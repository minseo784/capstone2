"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/common/AuthContext";

export default function NaverCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error"); 

    if (error === "banned") {
      alert("⛔ 관리자에 의해 차단된 계정입니다. 접속할 수 없습니다.");
      router.replace("/");
      return;
    }

    if (token) {
      console.log("[NAVER CALLBACK] 토큰 수신 성공");
      
      localStorage.setItem("accessToken", token);
      
      refreshUser().then(() => {
        router.replace("/"); 
      }).catch(() => {
        router.replace("/");
      });
      
    } else {
      console.error("[NAVER CALLBACK] 토큰이 없습니다.");
      alert("네이버 로그인에 실패했습니다.");
      router.replace("/");
    }
  }, [searchParams, refreshUser, router]);

  return (
    <div style={{ backgroundColor: "#03c75a", height: "100vh", color: "white", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <p>네이버 로그인 처리 중...</p>
    </div>
  );
}