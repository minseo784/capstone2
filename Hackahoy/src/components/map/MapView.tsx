"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import CreateSlotsLayer from "./CreateSlotsLayer";
import { useAuth } from "@/components/common/AuthContext";

import {
  loadStore,
  getOccupiedPinsWithFixed,
  STORE_KEY,
  type IslandsStore,
} from "@/lib/islandStore";
import { getIslands } from "@/lib/api/islands";
import type { Island } from "@/domain/types/Island";

export default function MapView() {
  const { login, user, loginModalOpen, closeLoginModal, openLoginModal } = useAuth();

  const isLoggedIn = !!user;

  const [store, setStore] = useState<IslandsStore>({});
  const [islands, setIslands] = useState<Island[]>([]);
  const [loading, setLoading] = useState(true);

  // 현재 레벨에 따른 배 이미지 설정
  const currentLevel = user?.levelNum ?? 1;
  const shipImgSrc = useMemo(() => {
    const shipNumber = currentLevel > 0 ? currentLevel : 1;
    return `/assets/ships/ship-${shipNumber}.png`;
  }, [currentLevel]);

  useEffect(() => {
    async function fetchIslands() {
      try {
        const data = await getIslands();
        setIslands(data);
      } catch (error) {
        console.error('❌ Failed to fetch islands:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchIslands();
  }, []);

  // 로컬 스토리지 동기화
  useEffect(() => {
    setStore(loadStore());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY) setStore(loadStore());
    };
    const onLocalUpdate = () => setStore(loadStore());
    
    window.addEventListener("storage", onStorage);
    window.addEventListener("hackahoy:islands-updated", onLocalUpdate as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hackahoy:islands-updated", onLocalUpdate as any);
    };
  }, []);

  const occupiedPins = useMemo(() => getOccupiedPinsWithFixed(store), [store]);

  const handleKakaoLogin = () => window.location.href = "http://localhost:4000/auth/kakao";
  const handleNaverLogin = () => window.location.href = "http://localhost:4000/auth/naver";
  const handleGoogleLogin = () => window.location.href = "http://localhost:4000/auth/google";

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#1F6396",
        backgroundImage: "url('/assets/backgrounds/main-map.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "80% auto",
      }}
    >
      {loading && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          color: 'white', fontSize: '24px', fontWeight: 'bold', zIndex: 100,
        }}>
          🏝️ 섬을 불러오는 중...
        </div>
      )}

      {/* 중앙 배 */}
      <Image
        src={shipImgSrc}
        alt={`Level ${currentLevel} Ship`}
        width={240}
        height={220}
        style={{
          position: "absolute", left: "55%", top: "63%",
          transform: "translate(-50%, -50%)", zIndex: 5,
        }}
        priority
      />

      <CreateSlotsLayer 
        mode="play" 
        occupiedPins={occupiedPins}
        islands={islands}
      />

      {/* 로그인 */}
      {loginModalOpen && !isLoggedIn && (
        <div
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000,
          }}
          onClick={() => closeLoginModal()}
        >
          <div
            style={{
              width: 680, height: 560,
              backgroundImage: "url('/assets/backgrounds/main-login.png')",
              backgroundSize: "100% 100%", backgroundRepeat: "no-repeat",
              display: "flex", justifyContent: "flex-start", alignItems: "center",
              boxSizing: "border-box", padding: "40px 80px 40px", position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <p className="retro-title text-center" style={{ marginTop: 20, marginBottom: 40 }}>
                소셜로 시작하기
              </p>

              {/* 카카오 */}
              <button type="button" className="social-login-btn" onClick={handleKakaoLogin} style={{ background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}>
                <Image src="/assets/ui/kakao.png" alt="카카오" width={400} height={90} />
              </button>

              {/* 네이버 */}
              <button type="button" className="social-login-btn" onClick={handleNaverLogin} style={{ background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}>
                <Image src="/assets/ui/naver.png" alt="네이버" width={400} height={90} />
              </button>

              {/* 구글 */}
              <button type="button" className="social-login-btn" onClick={handleGoogleLogin} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Image src="/assets/ui/google.png" alt="구글" width={400} height={90} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}