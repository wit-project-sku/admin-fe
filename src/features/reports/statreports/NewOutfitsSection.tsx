// '이번 주(달) 새로 등록된 의상' 섹션 — TOP10 사진박스 UI 재사용(순위 배지 없음, 등록일 표기).
// 실데이터: GET /admin/outfits 전체에서 등록일(createdAt)이 기간 내인 의상 필터.
// 서버 응답에 등록일 필드가 없으면 안내 문구를 표시한다(→ 백엔드 응답 필드 추가 필요).
import { useQuery } from '@tanstack/react-query';
import { APIService } from '@/utils/axios';
import s from './StatReports.module.css';
import { Section } from './StatReportParts';
import { EmptyNote } from './LiveReportViews';
import { fmtMD } from './statReportsMockData';

type NewOutfit = { id: string; name: string; cat?: string; imageUrl?: string; createdYmd: string };

function readOutfits(raw: unknown): { rows: NewOutfit[]; hasDateField: boolean } {
  const root = (raw ?? {}) as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const list = (Array.isArray(data.content) ? data.content : Array.isArray(data) ? data : []) as Record<string, unknown>[];
  let hasDateField = false;
  const rows = list.map((o, i) => {
    const created = o.createdAt ?? o.created_at ?? o.createdDate ?? null;
    if (created != null) hasDateField = true;
    const catObj = (o.category ?? null) as Record<string, unknown> | null;
    return {
      id: String(o.id ?? o.outfitCode ?? i),
      name: String(o.name ?? o.displayName ?? o.outfitCode ?? '-'),
      cat: o.categoryName != null ? String(o.categoryName) : catObj?.name != null ? String(catObj.name) : undefined,
      imageUrl: typeof o.imageUrl === 'string' ? o.imageUrl : typeof o.image_url === 'string' ? o.image_url : undefined,
      createdYmd: created != null ? String(created).slice(0, 10) : '',
    };
  });
  return { rows, hasDateField };
}

export function useNewOutfits(start: string, end: string) {
  return useQuery({
    queryKey: ['stat-report-new-outfits', start, end],
    queryFn: async () => {
      const res = await APIService.private.get('/admin/outfits', { params: { pageNum: 1, pageSize: 500 } });
      const { rows, hasDateField } = readOutfits(res);
      return { list: rows.filter((r) => r.createdYmd >= start && r.createdYmd <= end), hasDateField };
    },
    staleTime: 60_000,
  });
}

/** 표본 모드용 고정 데이터 */
export const SAMPLE_NEW_OUTFITS: NewOutfit[] = [
  { id: 'n1', name: '연노랑 두루마기', cat: '남성 한복', createdYmd: '2026-07-15' },
  { id: 'n2', name: '청록 당의', cat: '궁중 의상', createdYmd: '2026-07-17' },
];

export function NewOutfitCards({ list }: { list: NewOutfit[] }) {
  return (
    <div className={s.gal}>
      {list.map((o) => (
        <div key={o.id} className={s.gcard} data-no-rank>
          {o.imageUrl ? (
            <img src={o.imageUrl} alt={o.name} className={s.gcardImg} style={{ objectFit: 'contain', width: '100%' }} />
          ) : (
            <div className={s.gcardImg} style={{ background: 'linear-gradient(135deg, #e2e8f0, #f1f5f9)' }}>👘</div>
          )}
          <div className={s.gcardMeta}>
            <span className={s.gcardName}>{o.name}</span>
            <span className={s.gcardCat}>{o.cat ?? ' '}</span>
          </div>
          <div className={s.gcardFooter}>
            <span className={s.gcardFooterLabel}>등록일</span>
            <span className={s.gcardFooterVal}>{fmtMD(o.createdYmd)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 신규 등록 의상 섹션 — variant: 기간 라벨, mode: live(서버)/sample(표본) */
export function NewOutfitsSection({
  periodLabel,
  start,
  end,
  mode,
}: {
  periodLabel: string;
  start: string;
  end: string;
  mode: 'live' | 'sample';
}) {
  const live = useNewOutfits(start, end);

  if (mode === 'sample') {
    return (
      <Section title={`${periodLabel} 새로 등록된 의상`} sub='기간 내 신규 등록 — 자동 생성 시 실물 사진 삽입'>
        <NewOutfitCards list={SAMPLE_NEW_OUTFITS} />
      </Section>
    );
  }

  return (
    <Section title={`${periodLabel} 새로 등록된 의상`} sub='기간 내 신규 등록 의상'>
      {live.isPending ? (
        <p className={s.note}>불러오는 중…</p>
      ) : live.isError ? (
        <EmptyNote title='신규 의상 정보를 불러오지 못했습니다' />
      ) : !live.data?.hasDateField ? (
        <EmptyNote title='의상 등록일 정보가 없습니다' hint='의상 목록 API에 등록일(createdAt) 필드 추가가 필요합니다(백엔드 개발 항목).' />
      ) : (live.data?.list.length ?? 0) === 0 ? (
        <EmptyNote title='기간 내 새로 등록된 의상이 없습니다' hint={null} />
      ) : (
        <NewOutfitCards list={live.data.list} />
      )}
    </Section>
  );
}
