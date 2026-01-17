'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from "@/components/common/AuthContext";

export default function KakaoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  
  const hasCalledRefresh = useRef(false);

  useEffect(() => {
    if (hasCalledRefresh.current) return;

    const token = searchParams.get('token');
    const error = searchParams.get("error");

    if (error === "banned") {
      alert("⛔ 관리자에 의해 차단된 계정입니다. 접속할 수 없습니다.");
      router.replace("/");
      return;
    }

    if (token) {
      hasCalledRefresh.current = true;
      
      localStorage.setItem('accessToken', token);
      console.log('✅ Token saved to localStorage');

      refreshUser()
        .then((updatedUser) => {
          if (updatedUser?.isAdmin) {
            console.log("관리자 계정 로그인 완료");
          } else {
            console.log("일반 계정 로그인 완료");
          }
          router.replace('/'); 
        })
        .catch((err) => {
          console.error("유저 정보 로드 실패:", err);
          router.replace('/');
        });

    } else {
      console.error('No token found in URL');
      router.push('/');
    }
  }, [searchParams, refreshUser, router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#1a1a1a', 
      color: 'white',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>로그인 중입니다.</p>
      <p style={{ color: '#aaa' }}>잠시만 기다려주세요...</p>
    </div>
  );
}