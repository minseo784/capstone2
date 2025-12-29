"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import TopNav, { NavButton, NavButtonType } from "@/components/common/TopNav";
import { useAuth } from "@/components/common/AuthContext";

export default function AppTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, openLoginModal } = useAuth();

  // ✅ 로그인 여부 확인
  const isLoggedIn = !!user;
  
  // ✅ [수정] role 대신 AuthContext에서 정의한 isAdmin(boolean)을 사용합니다.
  const isAdmin = !!user?.isAdmin;

  const isMypage = pathname === "/mypage";
  const isSub =
    pathname.startsWith("/island/") || pathname.startsWith("/challenge/");

  const mk = (
    type: NavButtonType,
    onClick?: NavButton["onClick"]
  ): NavButton => ({
    type,
    onClick,
  });

  const left: NavButton[] = useMemo(() => {
    if (isSub) {
      return [mk("back", () => router.back())];
    }
    return [];
  }, [isSub, router]);

  const right: NavButton[] = useMemo(() => {
    if (!isLoggedIn) {
      return [
        mk("login", () => {
          if (pathname !== "/") router.push("/");
          setTimeout(() => openLoginModal(), 0);
        }),
      ];
    }

    const arr: NavButton[] = [];

    // 1. 홈/마이페이지 버튼 로직
    // 현재 페이지가 홈("/")이 아닐 때는 언제나 홈 버튼이 나오게 하면 편리합니다.
    if (pathname !== "/") {
      arr.push(mk("home", () => router.push("/")));
    }
    
    // 현재 페이지가 마이페이지가 아닐 때만 마이페이지 버튼 표시
    if (!isMypage) {
      arr.push(mk("mypage", () => router.push("/mypage")));
    }

    // 2. [수정] 어드민 버튼 추가
    if (isAdmin) {
      arr.push(mk("admin", () => router.push("/admin")));
    }

    // 3. 로그아웃 버튼
    arr.push(
      mk("logout", async () => {
        await logout();
        router.push("/");
      })
    );

    return arr;
  }, [isLoggedIn, isMypage, isAdmin, logout, openLoginModal, pathname, router]);
  
  return <TopNav left={left} right={right} />;
}