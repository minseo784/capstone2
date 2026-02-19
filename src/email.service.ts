import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'rexyloop@gmail.com', // 🔴 내 지메일 주소 (수정)
        pass: 'enga ydaf eudb hqnk', // 🔴 방금 받은 앱 비밀번호 16자리 (수정)
      },
    });
  }

  // 이메일 보내는 함수a
  async sendSecurityAlert(ip: string, email: string) {
    try {
      await this.transporter.sendMail({
        from: '"Hackahoy 보안팀" <rexyloop@gmail.com>', // 보내는 사람
        to: 'mseo2004@naver.com', // 🔴 알림을 받을 메일 주소 (수정)
        subject: '🚨 보안 경고: 자동 차단 발생',
        text: `시스템이 보안 위협을 감지했습니다.\n\n차단 IP: ${ip}\n시도 계정: ${email}\n사유: 로그인 5회 실패로 인한 자동 차단`,
      });
      console.log('✅ [이메일 전송 성공] 관리자에게 보안 알림을 보냈습니다.');
    } catch (error) {
      console.error('❌ [이메일 전송 실패]', error);
    }
  }
}