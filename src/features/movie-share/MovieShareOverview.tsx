import shared from '@commons/shared.module.css';
import type { MovieShareCinema, MovieShareStats } from '../../hooks/movie-share-api/movieShareTypes';
import s from '../lotte/Lotte.module.css';
import { LOTTE_BRANCHES, type LotteBranchCode, type LotteBranchFilter } from '../lotte/lotteBranches';
import { formatCount } from '../lotte/lotteFormat';
import { MOVIE_SHARE_MESSAGES, cinemaCount } from './movieShareConfig';

type CinemaWithBranch = MovieShareCinema & { branchCode: LotteBranchCode | null };

type SummaryProps = {
  branch: LotteBranchFilter;
  verifications: number | undefined;
  shares: number | undefined;
  totalShared: number | undefined;
  loading: boolean;
};

/** 요약 — 기간 인증 · 기간 나눔 · 누적 나눔. */
export function MovieShareSummary({ branch, verifications, shares, totalShared, loading }: SummaryProps) {
  const v = (n: number | undefined) => (loading && n == null ? '…' : formatCount(n));
  return (
    <div className={s.statGrid}>
      <div className={s.statCard}>
        <div className={s.statLabel}>기간 인증 건수{branch ? ` · ${branch}` : ''}</div>
        <div className={s.statValue}>
          {v(verifications)}
          <span className={s.statUnit}>건</span>
        </div>
        <div className={s.statHint}>취소된 인증은 빠집니다</div>
      </div>
      <div className={s.statCard}>
        <div className={s.statLabel}>기간 나눔 건수</div>
        <div className={s.statValue}>
          {v(shares)}
          <span className={s.statUnit}>건</span>
        </div>
        <div className={s.statHint}>
          {branch ? '나눔은 극장에 묶이지 않아 지점 구분 없이 전체입니다' : '필름 5칸을 모아 나눈 수'}
        </div>
      </div>
      <div className={s.statCard}>
        <div className={s.statLabel}>누적 나눔 건수</div>
        <div className={s.statValue}>
          {formatCount(totalShared)}
          <span className={s.statUnit}>건</span>
        </div>
        <div className={s.statHint}>지금까지 세 지점 합계 · 기간과 무관</div>
      </div>
    </div>
  );
}

type MonthlyProps = {
  stats: MovieShareStats | null;
  cinemas: CinemaWithBranch[];
  loading: boolean;
  error: boolean;
  branch: LotteBranchFilter;
};

/** 월별 · 지점별 표 — 월 × 극장 인증 수, 그 달 인증 합계와 나눔 수. 최근 달이 위. */
export function MovieShareMonthlyTable({ stats, cinemas, loading, error, branch }: MonthlyProps) {
  // 롯데 3지점 열을 먼저, 지점에 못 맞춘 극장이 있으면 그 이름으로 뒤에 붙인다.
  const columns: { key: string; label: string; sub?: string; match: (c: CinemaWithBranch) => boolean }[] = [
    ...LOTTE_BRANCHES.map((b) => ({
      key: b.code,
      label: b.code,
      sub: cinemas.find((c) => c.branchCode === b.code)?.cinemaName ?? b.name,
      match: (c: CinemaWithBranch) => c.branchCode === b.code,
    })),
    ...cinemas
      .filter((c) => c.branchCode == null)
      .map((c) => ({ key: c.cinemaCode, label: c.cinemaName, match: (x: CinemaWithBranch) => x.cinemaCode === c.cinemaCode })),
  ];

  const months = stats?.months ?? [];
  const cell = (cs: MovieShareCinema[], match: (c: CinemaWithBranch) => boolean) => {
    const hits = cinemas.filter(match).map((c) => c.cinemaCode);
    const found = cs.filter((c) => hits.includes(c.cinemaCode));
    if (found.length === 0) return 0;
    const counts = found.map(cinemaCount);
    return counts.some((n) => n == null) ? null : counts.reduce<number>((a, n) => a + (n ?? 0), 0);
  };

  const totals = columns.map((col) =>
    months.reduce<number | null>((acc, m) => {
      const n = cell(m.cinemas ?? [], col.match);
      return acc == null || n == null ? null : acc + n;
    }, 0),
  );

  const colCount = columns.length + 3;

  return (
    <div className={`${shared.card} ${s.sectionGap}`}>
      <div className={shared.cardHead}>
        <span className={shared.cardTitle}>월별 · 지점별 현황</span>
        <span className={s.hint}>
          {stats ? `${stats.startDate} ~ ${stats.endDate}` : ''} · 인증은 인증 시각, 나눔은 나눈 시각 기준 · 기록 없는 달은
          빠짐
        </span>
      </div>
      <div className={shared.tableResponsive}>
        <table className={`${shared.table} ${s.monthTable}`}>
          <thead className={shared.thead}>
            <tr>
              <th className={shared.th} style={{ width: 96 }}>
                월
              </th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`${shared.th} ${shared.thRight}`}
                  style={branch && branch === c.key ? { color: 'var(--accent)' } : undefined}
                  title={c.sub}
                >
                  {c.label} 인증
                  {c.sub && c.sub !== c.label ? <div className={shared.tdSub}>{c.sub}</div> : null}
                </th>
              ))}
              <th className={`${shared.th} ${shared.thRight}`}>인증 합계</th>
              <th className={`${shared.th} ${shared.thRight}`}>나눔</th>
            </tr>
          </thead>
          <tbody>
            {loading && !stats ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className={shared.skeletonRow}>
                  {Array.from({ length: colCount }).map((__, j) => (
                    <td key={j} className={shared.td}>
                      <span className={shared.skeletonLine} />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={colCount} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                  {MOVIE_SHARE_MESSAGES.statsError}
                </td>
              </tr>
            ) : months.length === 0 ? (
              <tr>
                <td colSpan={colCount} className={shared.tableStateCell}>
                  기간 안에 인증·나눔 기록이 없습니다.
                </td>
              </tr>
            ) : (
              <>
                {months.map((m) => (
                  <tr key={m.month} className={shared.tr}>
                    <td className={`${shared.td} ${shared.tdBold}`}>{m.month}</td>
                    {columns.map((c) => (
                      <td key={c.key} className={`${shared.td} ${shared.tdRight}`}>
                        {formatCount(cell(m.cinemas ?? [], c.match))}
                      </td>
                    ))}
                    <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}>{formatCount(m.verificationCount)}</td>
                    <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}>{formatCount(m.shareCount)}</td>
                  </tr>
                ))}
                <tr className={`${shared.tr} ${s.totalRow}`}>
                  <td className={shared.td}>합계</td>
                  {totals.map((t, i) => (
                    <td key={columns[i]!.key} className={`${shared.td} ${shared.tdRight}`}>
                      {formatCount(t)}
                    </td>
                  ))}
                  <td className={`${shared.td} ${shared.tdRight}`}>{formatCount(stats?.totalVerificationCount)}</td>
                  <td className={`${shared.td} ${shared.tdRight}`}>{formatCount(stats?.totalShareCount)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
