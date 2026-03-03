import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    // SQL 인젝션 및 XSS 위험 키워드 목록
    const dangerWords = [
      'select', 'insert', 'update', 'delete', 'drop', 'union', '--', 
      '<script', 'alert(', 'onclick', 'onerror', 'eval(', 'javascript:'
    ];

    // 위험 단어 포함 여부 체크
    const bodyString = JSON.stringify(req.body).toLowerCase();
    
    const detected = dangerWords.find(word => bodyString.includes(word));

    if (detected) {
      throw new BadRequestException(`보안 위협 키워드 감지됨: ${detected}`);
    }

    return next.handle();
  }
}