"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import TopNav, { NavButton, NavButtonType } from "@/components/common/TopNav";
import { useAuth } from "@/components/common/AuthContext";

export default function AppTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, openLoginModal } = useAuth();

  const isLoggedIn = !!user;
  
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

    if (pathname !== "/") {
      arr.push(mk("home", () => router.push("/")));
    }
    
    if (!isMypage) {
      arr.push(mk("mypage", () => router.push("/mypage")));
    }

    if (isAdmin) {
      arr.push(mk("admin", () => router.push("/admin")));
    }

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