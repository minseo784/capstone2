// jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // 💡 로그인 관련 경로는 가드를 아예 통과시킴
    // 소셜 로그인 콜백 경로만 통과
    const openPaths = ['/auth/kakao', '/auth/google', '/auth/naver', '/auth/login'];
    if (openPaths.some(path => request.url.includes(path))) {
    return true;
    }
    
    return super.canActivate(context);
  }

  // 💡 여기서 에러 핸들링을 안 해주면 토큰 없을 때 무조건 401 던집니다.
  handleRequest(err, user, info) {
    if (err || !user) {
      return null; // 에러 던지지 말고 null 반환해서 BanCheckGuard로 넘김
    }
    return user;
  }
}