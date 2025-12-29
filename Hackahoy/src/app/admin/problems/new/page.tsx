// src/app/admin/problems/new/page.tsx
"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./new.module.css";
import { useAuth } from "@/components/common/AuthContext";
import axios from "axios";

import {
  loadStore,
  saveStore,
  getProblemsByPin,
  getUsedSlots,
  addProblemToPin,
  type IslandsStore,
  type PinId,
  type IslandRecord,
} from "@/lib/islandStore";

function toPinId(v: string | null): PinId | null {
  if (!v) return null;
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3) return n as PinId;
  return null;
}

function pickNextSlot(used: Set<1 | 2 | 3>): 1 | 2 | 3 | null {
  if (!used.has(1)) return 1;
  if (!used.has(2)) return 2;
  if (!used.has(3)) return 3;
  return null;
}

export default function AdminCreateProblemPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { user } = useAuth() as any;

  const isAdmin = user?.isAdmin === true;

  if (user === null) {
    return <div style={{ color: "white" }}>사용자 확인 중...</div>;
  }

  const pinId = useMemo(() => toPinId(sp.get("pin")), [sp]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flag, setFlag] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 핀 없으면 select로, pin=1은 고정이라 생성 금지
  useEffect(() => {
    if (!isAdmin) return;
    if (!pinId) router.replace("/admin/problems/select");
    if (pinId === 1) router.replace("/admin/problems/select");
  }, [isAdmin, pinId, router]);

  const canSubmit =
    isAdmin &&
    !!pinId &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    flag.trim().length > 0 &&
    serverUrl.trim().length > 0;

    // onCreate 함수 수정 - 백엔드에서 직접 가져오게
  // 기존 onCreate를 지우고 이걸 붙여넣으세요
  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. 기초 권한 확인
    if (!isAdmin || !pinId) return;

    // 2. 서버 URL 형식 검증 (http:// 또는 https:// 포함 여부)
    const urlPattern = /^https?:\/\//;
    if (!urlPattern.test(serverUrl.trim())) {
      setError("올바른 서버 URL 형식이 아닙니다. (http:// 또는 https:// 포함)");
      return;
    }

    // 3. 플래그 형식 검증 (hackahoy{내용} 형식)
    // 최소 한 글자 이상의 내용이 중괄호 안에 있어야 함
    const flagPattern = /^hackahoy\{.+\}$/;
    if (!flagPattern.test(flag.trim())) {
      setError("플래그 형식이 올바르지 않습니다. hackahoy{내용} 형식을 지켜주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      
      // 4. 백엔드 API 호출 (serverUrl도 전송 데이터에 포함 확인 필요)
      await axios.post("http://localhost:4000/admin/problems", {
        islandId: Number(pinId),
        title: title.trim(),
        description: description.trim(),
        hint: "힌트는 기본값입니다.",
        correctFlag: flag.trim(),
        serverLink: serverUrl.trim(), // 백엔드 필드명이 serverLink라면 이대로 유지
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ 문제가 서버에 등록되었습니다!");
      router.push(`/island/${pinId}`);
    } catch (err: any) {
      console.error("등록 에러:", err);
      setError(err.response?.data?.message || "서버 등록에 실패했습니다.");
    }
  };

  if (!isAdmin) {
    console.log("현재 유저 정보:", user); // 디버깅용: 콘솔에 뭐가 찍히는지 보세요
    return <div style={{ color: "white" }}>관리자 권한이 없습니다.</div>;
  }

  return (
    <section className={styles.stage}>
      <div className={styles.board}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => router.push("/admin/problems/select")}
          aria-label="close"
          title="Close"
        >
          ✕
        </button>

        <h1 className={styles.title}>Create Problem</h1>

        {error && (
          <div style={{ color: "#b00020", fontWeight: 900, marginBottom: 10 }}>
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={onCreate}>
          <div className={styles.field}>
            <div className={styles.label}>Title</div>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문제 제목"
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Description</div>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="문제 설명"
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <div className={styles.label}>Flag</div>
              <input
                className={styles.input}
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="flag{enter_your_flag}"
              />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>Server</div>
              <input
                className={styles.input}
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://localhost"
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="submit"
              className={styles.imgBtn}
              disabled={!canSubmit}
            >
              <Image
                src="/assets/ui/createproblem.png"
                alt="CREATE PROBLEM"
                width={170}
                height={64}
                priority
              />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
