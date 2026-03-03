import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';

    res.on('finish', () => {
      const { statusCode } = res;
      const message = `[${method}] ${originalUrl} ${statusCode} - IP: ${ip} - UA: ${userAgent}`;

      if (statusCode >= 400) {
        // e.g. 404, 500 응답
        this.logger.warn(`🚨 보안 위협 가능성: ${message}`);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}