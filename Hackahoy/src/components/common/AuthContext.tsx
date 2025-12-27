// src/components/common/AuthContext.tsx

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export type AuthUser = {
  userId: string;
  nickname: string;
  levelNum: number;
  role: "USER" | "ADMIN";
  oauthProvider: "kakao" | "naver" | "google";
  email?: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  login: (jwt: string, userData: AuthUser) => void;
  logout: () => void;
  devLoginAsAdmin: () => void;

  // ✅ 로그인 모달 전역 제어
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;

  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // ✅ 로그인 모달 상태
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  // ⭐ [추가] 유저 정보를 서버로부터 새로고침하는 함수
  const refreshUser = async () => {
    const savedToken = localStorage.getItem("accessToken");
    if (!savedToken) return;

    try {
      const res = await axios.get("http://localhost:4000/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` }
      });
      setUser(res.data);
      console.log("🔄 유저 정보 동기화 완료:", res.data);
    } catch (err) {
      console.error("❌ 유저 정보 갱신 실패:", err);
    }
  };

  // ⭐ [추가] 앱 시작 시 자동 로그인 체크
  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");
    if (savedToken) {
      // 백엔드 /auth/me API 호출해서 유저 정보 가져오기
      axios.get("http://localhost:4000/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
      .then(res => {
        setToken(savedToken);
        // 백엔드 AuthController의 me(@Req() req) { return req.user } 결과에 맞춰 설정
        // 만약 res.data 안에 user 객체가 따로 있다면 res.data.user로 변경
        setUser(res.data); 
        console.log("✅ 자동 로그인 성공:", res.data);
      })
      .catch(err => {
        console.error("❌ 토큰 만료 또는 유효하지 않음:", err);
        localStorage.removeItem("accessToken");
      });
    }
  }, []);

  const login = (jwt: string, userData: AuthUser) => {
    setToken(jwt);
    setUser(userData);
    localStorage.setItem("accessToken", jwt); // 로컬 스토리지 저장
    setLoginModalOpen(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("accessToken"); // 로컬 스토리지 삭제
    setLoginModalOpen(false);
  };

  // DEV 전용 ADMIN 로그인
  const devLoginAsAdmin = () => {
    const adminToken = "DEV_ADMIN_TOKEN";
    const adminUser: AuthUser = {
      userId: "admin",
      nickname: "ADMIN",
      levelNum: 99,
      role: "ADMIN",
      oauthProvider: "google",
      email: "admin@hackahoy.dev",
    };
    setToken(adminToken);
    setUser(adminUser);
    localStorage.setItem("accessToken", adminToken);
    setLoginModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        devLoginAsAdmin,
        refreshUser,        // ✅ 추가한 함수
        loginModalOpen,     // ✅ 확인
        openLoginModal,    // ✅ 이 줄이 있는지 꼭 보세요!
        closeLoginModal,   // ✅ 이 줄도!
      }}
    >
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}