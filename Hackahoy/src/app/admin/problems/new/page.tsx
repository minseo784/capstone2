"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./new.module.css";
import axios from "axios";

function toPinId(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return (n === 1 || n === 2 || n === 3) ? n : null;
}

export default function AdminCreateProblemPage() {
  return (
    <Suspense fallback={<div style={{ color: "white" }}>로딩 중...</div>}>
      <AdminCreateProblemContent />
    </Suspense>
  );
}

function AdminCreateProblemContent() {
  const router = useRouter();
  const sp = useSearchParams();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flag, setFlag] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pinId = useMemo(() => toPinId(sp.get("pin")), [sp]);

  useEffect(() => {
    if (!pinId || pinId === 1) {
      router.replace("/admin/problems/select");
    }
  }, [pinId, router]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const rawTitle = title.trim();
    const rawDescription = description.trim();
    const rawFlag = flag.trim();
    const rawUrl = serverUrl.trim();

    if (!rawTitle || !rawDescription || !rawFlag || !rawUrl) {
      setError("모든 필드를 입력해주세요.");
      setLoading(false);
      return;
    }

    const flagRegex = /^hackahoy\{.+\}$/;
    if (!flagRegex.test(rawFlag)) {
      setError("Flag 형식이 올바르지 않습니다. (hackahoy{...})");
      setLoading(false);
      return;
    }

    const urlRegex = /^(http:\/\/|https:\/\/)/;
    if (!urlRegex.test(rawUrl)) {
      setError("Server URL은 http:// 또는 https://로 시작해야 합니다.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      
      await axios.post("http://localhost:4000/admin/problems", {
        islandId: pinId,
        title: rawTitle,
        description: rawDescription,
        hint: "힌트는 기본값입니다.",
        correctFlag: rawFlag,
        serverLink: rawUrl,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ 문제가 성공적으로 등록되었습니다!");
      router.push(`/island/${pinId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "등록 실패: 보안 정책 위반일 수 있습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.stage}>
      <div className={styles.board}>
        <button type="button" className={styles.closeBtn} onClick={() => router.push("/admin/problems/select")}>✕</button>
        <h1 className={styles.title}>Create Problem</h1>

        {error && <div style={{ color: "#ff4d4d", fontWeight: "bold", marginBottom: "15px", textAlign: "center" }}>{error}</div>}

        <form className={styles.form} onSubmit={onCreate}>
          <div className={styles.field}><div className={styles.label}>Title</div>
            <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요." />
          </div>
          <div className={styles.field}><div className={styles.label}>Description</div>
            <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="설명을 입력하세요" />
          </div>
          <div className={styles.row2}>
            <div className={styles.field}><div className={styles.label}>Flag</div>
              <input className={styles.input} value={flag} onChange={(e) => setFlag(e.target.value)} placeholder="hackahoy{...}" />
            </div>
            <div className={styles.field}><div className={styles.label}>Server</div>
              <input className={styles.input} value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className={styles.footer}>
            <button type="submit" className={styles.imgBtn} disabled={loading}>
              <Image src="/assets/ui/createproblem.png" alt="CREATE" width={170} height={64} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}