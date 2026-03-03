import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { EventsService } from 'src/events/events.service';
import { JwtService } from '@nestjs/jwt';
import { BanService } from 'src/ban/ban.service'; // 👈 BanService 임포트

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly eventsService: EventsService,
    private readonly jwtService: JwtService,
    private readonly banService: BanService, // 👈 생성자 주입
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // 1. 토큰에서 유저 ID 추출 (기존 로직 유지)
    let userId = request.user?.id;
    
    if (!userId) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = this.jwtService.decode(token) as any;
          userId = decoded?.id || decoded?.sub || decoded?.userId || decoded?.user_id; 
        } catch (e) {
          console.error('❌ [디버깅] 토큰 디코딩 중 에러:', e.message);
        }
      }
    }

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // 2. 500 에러(SERVER_ERROR) 발생 시 처리
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && userId) {
      const problemIdRaw = request.params.id ? Number(request.params.id) : null;
      
      // problemId가 유효할 때만 이벤트 저장
      if (problemIdRaw) {
        await this.eventsService.trackUserEvent(userId, problemIdRaw, 'SERVER_ERROR');
      }
      
      await this.banService.checkServerErrorSpam(userId);
    }

    // 3. 클라이언트 응답
    response.status(status).json({
      statusCode: status,
      path: request.url,
      message: '서버 내부 에러가 발생했습니다.',
    });
  }
}