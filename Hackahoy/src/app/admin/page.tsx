"use client";

import Image from "next/image";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";
import { listUsers, setUserBanned, AdminUser } from "@/lib/api/admin";
import axios from "axios";

type Role = "ADMIN" | "USER";

const PAGE_SIZE = 3;

export default function AdminPage() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AdminUser[]>([]); 
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listUsers({ keyword: q });
      setRows(data);
    } catch (err) {
      console.error("유저 목록 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, safePage]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const toggleRole = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, role: r.role === "ADMIN" ? "USER" : "ADMIN" } : r
      )
    );
  };

  const handleToggleBanned = (userId: string, currentBanned: boolean) => {
  
  setRows((prev) =>
    prev.map((u) => (u.id === userId ? { ...u, banned: !currentBanned } : u))
  );
};

  const onSave = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      
      await axios.post(
        "http://localhost:4000/admin/users/batch-update",
        { users: rows }, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("변경 사항이 성공적으로 저장되었습니다! 💾");
    } catch (err) {
      console.error("저장 실패:", err);
      alert("서버에 저장하는 중 오류가 발생했습니다. 백엔드 엔드포인트를 확인하세요.");
    }
  };

  return (
    <section className={styles.board}>
      <div className={styles.headRow}>
        <div className={styles.title}>Admin</div>

        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="search user..."
          />
        </div>
      </div>

      <div className={styles.table}>
        <div className={`${styles.row} ${styles.rowHead}`}>
          <div className={styles.cell}>닉네임</div>
          <div className={styles.cell}>권한</div>
          <div className={styles.cell}>banned</div>
        </div>

        {loading ? (
          <div className={styles.row}>
            <div className={styles.cell} style={{ width: "100%", textAlign: "center" }}>
              Loading...
            </div>
          </div>
        ) : (
          pageRows.map((r) => (
            <div key={r.id} className={styles.row}>
              <div className={styles.cell}>{r.nickname}</div>
                <div className={styles.cell}>
                  <button
                    type="button"
                    className={styles.roleBtn}
                    onClick={() => toggleRole(r.id)}
                  >
                    {r.role === "ADMIN" ? "Admin" : "User"} <span>↕</span>
                  </button>
                </div>
                <div className={styles.cell}>
                    <button
                      type="button"
                      className={styles.banBox}
                      onClick={() => handleToggleBanned(r.id, r.banned)}
                      aria-label={`toggle ban ${r.nickname}`}
                    >
                      {r.banned ? <span className={styles.check}>✓</span> : null}
                    </button>
                  </div>
            </div>
          ))
        )}

        {!loading && Array.from({ length: PAGE_SIZE - pageRows.length }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.row}>
            <div className={styles.cell}>&nbsp;</div>
            <div className={styles.cell}>&nbsp;</div>
            <div className={styles.cell}>&nbsp;</div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.createBtn}
          onClick={() => router.push("/admin/problems/select")}
        >
          <Image
            src="/assets/ui/createproblem.png"
            alt="CREATE PROBLEM"
            width={160}
            height={90}
            priority
          />
        </button>
        
        <div className={styles.pager}>
          <button
            type="button"
            className={`${styles.pagerIconBtn} ${styles.pagerLeft}`}
            onClick={goPrev}
            disabled={safePage <= 1}
          />
          <div className={styles.pageText}>
            {safePage} / {totalPages}
          </div>
          <button
            type="button"
            className={`${styles.pagerIconBtn} ${styles.pagerRight}`}
            onClick={goNext}
            disabled={safePage >= totalPages}
          />
        </div>

        <button type="button" className={styles.saveBtn} onClick={onSave}>
          <Image
            src="/assets/ui/save.png"
            alt="SAVE"
            width={160}
            height={90}
            priority
          />
        </button>
      </div>
    </section>
  );
}