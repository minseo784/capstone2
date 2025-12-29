"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./challenge.module.css";
import { getProblem, submitFlag } from "@/lib/api/islands";
import { useAuth } from "@/components/common/AuthContext";

type HintData = { img: string; text: string };

type Problem = {
  id: number;
  title: string;
  description: string;
  hint: string | null;
  serverLink: string;
  islandId: number;
};

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const [flagInput, setFlagInput] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    async function fetchProblem() {
      try {
        const problemId = Number(id);
        const response = await getProblem(problemId);
        
        let data = response;
        if (data && data.data) data = data.data;
        if (Array.isArray(data)) data = data[0];

        if (data && (data.title || data.id)) {
          setProblem(data);
        } else {
          setProblem(null);
        }
      } catch (error) {
        console.error('❌ 문제 로드 실패:', error);
        setProblem(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem || submitting) return;

    setSubmitting(true);
    try {
      const result = await submitFlag(problem.id, flagInput.trim());

      if (result.correct) {
        if (result.alreadySolved) {
          alert("이미 해결한 문제입니다! ✅");
          setSubmitting(false);
          return;
        }

        const prevLevel = user?.levelNum ?? 1;
        const newLevel = result.newLevel;
        await refreshUser();

        if (newLevel > prevLevel) {
          const prevShip = encodeURIComponent(`/assets/ships/ship-${prevLevel}.png`);
          const newShip = encodeURIComponent(`/assets/ships/ship-${newLevel}.png`);
          const redirect = encodeURIComponent(`/`);
          router.push(`/level-up?prevShip=${prevShip}&newShip=${newShip}&redirect=${redirect}`);
        } else {
          alert("정답입니다! 🎉");
          setFlagInput("");
        }
      } else {
        alert("틀렸습니다. 다시 생각해보세요! ❌");
      }
    } catch (err) {
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 배경 이미지 결정
  const getBackgroundImage = (islandId: number) => {
    if (islandId === 1 && problem && problem.id <= 3) {
      return `/assets/backgrounds/island-${problem.id}.png`;
    }
    if (islandId === 1) return `/assets/backgrounds/island-1.png`;
    return "/assets/backgrounds/default-island.png";
  };

  // 힌트 이미지 결정
  const getHintImage = (problemId: number, islandId: number) => {
    if (islandId === 1 && [1, 2, 3].includes(problemId)) {
      return `/assets/icons/hint-${problemId}.png`;
    }
    return "/assets/icons/default-hint.png";
  };

  if (loading) {
    return <main className={styles.pageRoot}><div className={styles.statusText}>🎯 문제를 불러오는 중...</div></main>;
  }

  if (!problem || !problem.title) {
    return <main className={styles.pageRoot}><div className={styles.statusText}>❌ 문제가 아직 생성되지 않았습니다.</div></main>;
  }

  const bg = getBackgroundImage(problem.islandId);
  const hintIcon = getHintImage(problem.id, problem.islandId);

  // ⭐ [핵심 수정] "힌트는 기본값입니다." 체크 로직
  const DEFAULT_HINT_TEXT = "힌트는 기본값입니다.";
  const isDefaultHint = !problem.hint || problem.hint.trim() === "" || problem.hint === DEFAULT_HINT_TEXT;

  // 유효한 힌트가 있을 때만 데이터 할당
  const hintData: HintData | null = !isDefaultHint ? { img: hintIcon, text: problem.hint! } : null;

  return (
    <main className={styles.pageRoot}>
      <div className={styles.bg} style={{ backgroundImage: `url(${bg})` }} />

      <section className={styles.stage}>
        <div className={styles.boardWrap}>
          <div className={styles.board}>
            <h1 className={styles.title}>{problem.title}</h1>
            <p className={styles.desc}>{problem.description}</p>

            {problem.serverLink && (
              <p className={styles.link}>
                Server link:&nbsp;
                <a href={problem.serverLink} target="_blank" rel="noopener noreferrer">{problem.serverLink}</a>
              </p>
            )}

            <form className={styles.formRow} onSubmit={onSubmit}>
              <input
                className={styles.input}
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                placeholder="flag{enter_your_flag}"
                disabled={submitting}
              />
              <button type="submit" className={styles.flagBtn} disabled={submitting}>
                <Image src="/assets/ui/flag.png" alt="flag" width={94} height={70} />
              </button>
            </form>
            {submitting && <p style={{ color: "yellow", marginTop: "10px" }}>제출 중...</p>}
          </div>

          {/* ⭐ [힌트 아이콘 렌더링 영역] */}
          {hintData ? (
            // 1. 유효한 힌트가 있을 때: 클릭 가능한 버튼
            <button
              type="button"
              className={styles.hintBtn}
              onClick={() => setHintOpen(true)}
              aria-label="open hint"
            >
              <Image src={hintData.img} alt="hint" width={260} height={320} />
            </button>
          ) : (
            // 2. 힌트가 기본값이거나 없을 때: 클릭 불가한 상태 (시각적 피드백 추가)
            <div 
              className={styles.hintBtn} 
              style={{ 
                cursor: 'default', 
                opacity: 0.5, 
                filter: 'grayscale(1)',
                pointerEvents: 'none' 
              }}
            >
              <Image src={hintIcon} alt="no-hint" width={260} height={320} />
            </div>
          )}
        </div>
      </section>

      {/* 힌트 모달 */}
      {hintOpen && hintData && (
        <div className={styles.modalDim} onClick={() => setHintOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>HINT</div>
              <button className={styles.modalClose} onClick={() => setHintOpen(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>{hintData.text}</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.okBtn} onClick={() => setHintOpen(false)}>
                <span className={styles.okBtnText}>ok</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}