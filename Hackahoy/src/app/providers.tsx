// src/app/providers.tsx
"use client";

import React from "react";
import { AuthProvider } from "@/components/common/AuthContext";
import KakaoProvider from "@/components/common/KakaoProvider";
import AppTopNav from "@/components/common/AppTopNav";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <KakaoProvider>
      <AuthProvider>
        <AppTopNav />
        {children}
      </AuthProvider>
    </KakaoProvider>
  );
}
