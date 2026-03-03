import { Module, Global } from '@nestjs/common';
import { BanService } from './ban.service';

@Global() // @Global을 붙이면 다른 모듈에서 일일이 import 안 해도 됩니다.
@Module({
  providers: [BanService],
  exports: [BanService],
})
export class BanModule {}