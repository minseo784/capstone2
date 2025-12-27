'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function KakaoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. URL에서 token 쿼리 스트링을 가져옵니다.
    const token = searchParams.get('token');

    if (token) {
      // 2. 로컬 스토리지에 토큰을 저장합니다.
      localStorage.setItem('accessToken', token);
      console.log('✅ Token saved to localStorage');

      // 3. 로그인이 완료되었으므로 메인 페이지(지도)로 이동합니다.
      router.push('/');
    } else {
      console.error('❌ No token found in URL');
      // 토큰이 없다면 다시 로그인 페이지나 메인으로 보냅니다.
      router.push('/');
    }
  }, [searchParams, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>로그인 중입니다. 잠시만 기다려주세요...</p>
    </div>
  );
}