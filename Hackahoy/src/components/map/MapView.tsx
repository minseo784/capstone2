// src/components/map/MapView.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import CreateSlotsLayer from "./CreateSlotsLayer";
import { useAuth } from "@/components/common/AuthContext";
import DevAdminLoginButton from "@/components/dev/DevAdminLoginButton";
import {
  loadStore,
  getOccupiedPinsWithFixed,
  STORE_KEY,
  type IslandsStore,
} from "@/lib/islandStore";
import { getIslands } from "@/lib/api/islands";
import type { Island } from "@/domain/types/Island";

export default function MapView() {
  const { login, user, loginModalOpen, closeLoginModal, openLoginModal } =
    useAuth();

  const isLoggedIn = !!user;

  // Kakao / Naver SDK 준비 여부
  const [kakaoReady, setKakaoReady] = useState(false);
  const [naverReady, setNaverReady] = useState(false);

  // 네이버 로그인 인스턴스 저장용
  const naverLoginRef = useRef<any>(null);

  // ✅ store는 먼저 선언되어야 함
  const [store, setStore] = useState<IslandsStore>({});

  // ✅ 백엔드에서 섬 데이터 가져오기
  const [islands, setIslands] = useState<Island[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ 1. 현재 레벨 (levelNum) 가져오기
  const currentLevel = user?.levelNum ?? 1;

  // ✅ 2. 레벨에 따라 ship-1, ship-2, ship-3... 이미지 매칭
  const shipImgSrc = useMemo(() => {
    // 혹시 이미지가 없는 레벨을 대비해 1~3 정도로 제한하거나 숫자를 그대로 씁니다.
    const shipNumber = currentLevel > 0 ? currentLevel : 1;
    return `/assets/ships/ship-${shipNumber}.png`;
  }, [currentLevel]);

  // ✅ API에서 섬 데이터 로드
  useEffect(() => {
    async function fetchIslands() {
      try {
        const data = await getIslands();
        setIslands(data);
        console.log('✅ Islands loaded from API:', data);
      } catch (error) {
        console.error('❌ Failed to fetch islands:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchIslands();
  }, []);

  // ✅ 최초 로드 + (선택) storage 이벤트로 갱신
  useEffect(() => {
    setStore(loadStore());

    // 다른 탭에서 변경됐을 때 반영 (같은 탭은 아래 custom event로 처리 권장)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY) setStore(loadStore());
    };
    window.addEventListener("storage", onStorage);

    // 같은 탭에서 변경됐을 때 반영 (new에서 dispatch 해주면 즉시 갱신됨)
    const onLocalUpdate = () => setStore(loadStore());
    window.addEventListener("hackahoy:islands-updated", onLocalUpdate as any);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "hackahoy:islands-updated",
        onLocalUpdate as any
      );
    };
  }, []);

  // ✅ store 선언 아래에서 memo
  const occupiedPins = useMemo(() => getOccupiedPinsWithFixed(store), [store]);

  /**
   * 다른 페이지에서 LOGIN 클릭 → "/"로 이동한 뒤
   * sessionStorage 플래그 보고 자동으로 로그인 모달 열기
   */
  useEffect(() => {
    if (isLoggedIn) return;

    try {
      const flag = sessionStorage.getItem("open_login_modal_once");
      if (flag === "1") {
        sessionStorage.removeItem("open_login_modal_once");
        openLoginModal?.();
      }
    } catch (e) {
      console.error(e);
    }
  }, [isLoggedIn, openLoginModal]);

  /* ------------------------------------
   *  Kakao SDK 로드 & init
   * ----------------------------------*/
  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as any;
    if (w.Kakao) {
      if (!w.Kakao.isInitialized()) {
        w.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
      }
      setKakaoReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://developers.kakao.com/sdk/js/kakao.min.js";
    script.async = true;

    script.onload = () => {
      const w2 = window as any;
      if (w2.Kakao && !w2.Kakao.isInitialized()) {
        w2.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
      }
      setKakaoReady(true);
    };

    script.onerror = () => {
      console.error("Kakao SDK script load error");
      setKakaoReady(false);
    };

    document.head.appendChild(script);
  }, []);

  /* ------------------------------------
   *  Naver SDK 인스턴스 생성 (전역 SDK 사용)
   * ----------------------------------*/
  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as any;
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!;
    const callbackUrl =
      process.env.NEXT_PUBLIC_NAVER_CALLBACK_URL ||
      `${window.location.origin}/auth/naver/callback`;

    if (!w.naver || !w.naver.LoginWithNaverId) {
      console.error("[NAVER] global SDK not loaded on window");
      setNaverReady(false);
      return;
    }

    const naverLogin = new w.naver.LoginWithNaverId({
      clientId,
      callbackUrl,
      isPopup: true,
    });

    naverLogin.init();
    naverLoginRef.current = naverLogin;
    setNaverReady(true);
  }, []);

  /* ------------------------------------
   *  Naver 콜백 팝업에서 postMessage 수신
   * ----------------------------------*/
  useEffect(() => {
    function handleMessage(ev: MessageEvent) {
      if (!ev.data || typeof ev.data !== "object") return;
      if ((ev.data as any).type !== "naver-login-success") return;

      const profile = (ev.data as any).profile;

      const fakeUser = {
        userId: profile.id,
        nickname: profile.nickname ?? "네이버유저",
        level: 1,
        role: "USER" as const,
        oauthProvider: "naver" as const,
        email: profile.email ?? "unknown@naver.com",
      };

      const fakeToken = "dev-jwt-token-naver";
      login(fakeToken, fakeUser);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [login]);

  /* ------------------------------------
   *  Kakao 로그인
   * ----------------------------------*/
  function handleKakaoLogin() {
    window.location.href = "http://localhost:4000/auth/kakao";
  }

  /* ------------------------------------
   *  Naver 로그인
   * ----------------------------------*/
  async function handleNaverLogin() {
    if (!naverReady || !naverLoginRef.current) {
      alert("네이버 SDK가 아직 준비되지 않았습니다.");
      return;
    }
    naverLoginRef.current.authorize();
  }

  /* ------------------------------------
   *  Google 로그인
   * ----------------------------------*/
  function handleGoogleLogin() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
    const redirectUri =
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
      `${window.location.origin}/auth/google/callback`;

    const scope = encodeURIComponent("openid profile email");
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    sessionStorage.setItem("google_oauth_state", state);
    sessionStorage.setItem("google_oauth_nonce", nonce);

    const authUrl =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token%20id_token` +
      `&scope=${scope}` +
      `&include_granted_scopes=true` +
      `&state=${encodeURIComponent(state)}` +
      `&nonce=${encodeURIComponent(nonce)}`;

    window.location.href = authUrl;
  }

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
      {/* 로딩 중 */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          zIndex: 100,
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
          position: "absolute",
          left: "55%",
          top: "63%",
          transform: "translate(-50%, -50%)",
          zIndex: 5,
        }}
        priority
      />

      {/* ✅ 생성된 핀만 클릭 가능 + 백엔드 islands 전달 */}
      <CreateSlotsLayer 
        mode="play" 
        occupiedPins={occupiedPins}
        islands={islands}
      />

      {/* 로그인 모달 */}
      {loginModalOpen && !isLoggedIn && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
          onClick={() => closeLoginModal()}
        >
          <div
            style={{
              width: 680,
              height: 560,
              backgroundImage: "url('/assets/backgrounds/main-login.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              boxSizing: "border-box",
              padding: "40px 80px 40px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
              <p
                className="retro-title text-center"
                style={{ marginTop: 20, marginBottom: 40 }}
              >
                소셜로 시작하기
              </p>

              {/* 카카오 */}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  marginBottom: 16,
                }}
                onClick={handleKakaoLogin}
              >
                <Image
                  src="/assets/ui/kakao.png"
                  alt="카카오로 시작하기"
                  width={400}
                  height={90}
                />
              </button>

              {/* 네이버 */}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  marginBottom: 16,
                }}
                onClick={handleNaverLogin}
              >
                <Image
                  src="/assets/ui/naver.png"
                  alt="네이버로 시작하기"
                  width={400}
                  height={90}
                />
              </button>

              {/* 구글 */}
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
                onClick={handleGoogleLogin}
              >
                <Image
                  src="/assets/ui/google.png"
                  alt="구글로 시작하기"
                  width={400}
                  height={90}
                />
              </button>

              {/* DEV 전용 ADMIN 로그인 버튼 (모달 안) */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 2100,
                }}
              >
                <DevAdminLoginButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}