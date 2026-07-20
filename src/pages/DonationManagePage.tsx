import { useState, useEffect, type CSSProperties } from 'react';
import type { AxiosError } from 'axios';
import shared from '@commons/shared.module.css';
import FilterGroup from '@components/common/FilterGroup';
import SearchBar from '@components/common/SearchBar';
import Pagination from '@components/common/Pagination';
import RegisterBtn from '@components/common/RegisterBtn';
import EditBtn from '@components/common/EditBtn';
import DeleteBtn from '@components/common/DeleteBtn';
import DeleteModal from '@modals/DeleteModal';
import DonationCampaignManageModal from '@modals/DonationCampaignManageModal';
import DonationCampaignDetailModal from '@modals/DonationCampaignDetailModal';
import DonationHistoryDetailModal from '@modals/DonationHistoryDetailModal';
import DonationOrganizationManageModal from '@modals/DonationOrganizationManageModal';
import DonationSchoolManageModal from '@modals/DonationSchoolManageModal';
import DonationSchoolDetailModal from '@modals/DonationSchoolDetailModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  useGetDonationCampaigns,
  type DonationCampaign,
} from '../hooks/donation-api/useGetDonationCampaigns';
import { useGetDonationHistory, type DonationHistoryItem } from '../hooks/donation-api/useGetDonationHistory';
import {
  useGetDonationOrganizations,
  useDeleteDonationOrganization,
  usePermanentDeleteDonationOrganization,
  type DonationOrganization,
} from '../hooks/donation-api/useDonationOrganizations';
import {
  useGetDonationSchools,
  useGetDonationSchoolRegions,
  useDeleteDonationSchool,
  usePermanentDeleteDonationSchool,
  type DonationSchool,
  type SchoolSort,
} from '../hooks/donation-api/useDonationSchools';
import { extractPaginatedResult } from '../utils/queryHelpers';
import {
  NGO_DONATION_TABS,
  SCHOOL_DONATION_TABS,
  DONATION_MODE_OPTIONS,
  DONATION_CAMPAIGN_PAGE_SIZE,
  DONATION_HISTORY_PAGE_SIZE,
  DONATION_SCHOOL_PAGE_SIZE,
  DONATION_ORG_PAGE_SIZE,
  SCHOOL_INITIAL_BUCKETS,
  SCHOOL_SORT_OPTIONS,
  CAMPAIGN_STATUS_MAP,
  CAMPAIGN_TABLE_MESSAGES,
  SCHOOL_TABLE_MESSAGES,
  DONATION_STATUS_MAP,
  PAYMENT_METHOD_MAP,
  type DonationMode,
  type DonationTab,
} from '../features/donations/donationListConfig';
import {
  amountOptionsToNumbers,
  extractCampaignResult,
  formatAmountShort,
  formatCampaignProgress,
  formatIsoDateTime,
  formatKrw,
} from '../features/donations/donationFormatters';
import { useDonationCampaignManage } from '../features/donations/useDonationCampaignManage';

// 서버 BaseResponse 에러 메시지(예: FK 참조로 완전 삭제 거부)를 우선 노출, 없으면 기본 문구.
function getApiErrorMessage(e: unknown, fallback: string): string {
  const msg = (e as AxiosError<{ message?: string }>)?.response?.data?.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

const CAMPAIGN_COLS = 9;
const HISTORY_COLS = 9; // 유형 열 제거
const ORG_COLS = 5; // 종류 열 제거
const SCHOOL_COLS = 10;

const filterSelectStyle: CSSProperties = {
  height: 36,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid var(--border-color, #e2e8f0)',
  background: 'var(--card-bg, #fff)',
  fontSize: 13,
  color: 'var(--text-primary)',
  cursor: 'pointer',
};

const DEFAULT_TAB: Record<DonationMode, DonationTab> = {
  NGO: 'campaigns',
  SCHOOL: 'schools',
};

type DonationManagePageProps = {
  /** 특정 세그먼트(NGO/학교)로 고정. 지정 시 상단 세그먼트 토글을 숨긴다. */
  lockedMode?: DonationMode;
};

export default function DonationManagePage({ lockedMode }: DonationManagePageProps = {}) {
  const [modeState, setMode] = useState<DonationMode>(lockedMode ?? 'NGO');
  // 고정 모드일 땐 항상 lockedMode 를 따른다. 라우터가 /ngo↔/school 전환 시 컴포넌트를
  // 재사용(언마운트 없음)하므로 useState 초깃값만으로는 이전 세그먼트 상태가 남는다.
  const mode = lockedMode ?? modeState;
  const [tab, setTab] = useState<DonationTab>(DEFAULT_TAB[lockedMode ?? 'NGO']);

  // 고정 세그먼트가 바뀌면(예: NGO 기부 → 학교 기부) 해당 세그먼트 기본 탭으로 리셋.
  useEffect(() => {
    if (lockedMode) setTab(DEFAULT_TAB[lockedMode]);
  }, [lockedMode]);

  const changeMode = (nextMode: DonationMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setTab(DEFAULT_TAB[nextMode]);
  };

  // 캠페인
  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignOrgId, setCampaignOrgId] = useState<number | null>(null);

  // 기부 내역
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const debouncedHistorySearch = useDebouncedValue(historySearch, 300);

  // 단체 관리
  const [orgPage, setOrgPage] = useState(1);
  const [orgActiveFilter, setOrgActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgModalMode, setOrgModalMode] = useState<'create' | 'edit'>('create');
  const [selectedOrg, setSelectedOrg] = useState<DonationOrganization | null>(null);
  const [showOrgDeleteModal, setShowOrgDeleteModal] = useState(false);
  const [orgDeleteHard, setOrgDeleteHard] = useState(false); // true=완전삭제(물리), false=비활성화(소프트)
  const { deleteOrganizationAsync, isPending: isOrgDeleting } = useDeleteDonationOrganization();
  const { deleteOrganizationPermanentlyAsync, isPending: isOrgHardDeleting } =
    usePermanentDeleteDonationOrganization();

  // 학교 관리
  const [schoolPage, setSchoolPage] = useState(1);
  const [schoolRegion, setSchoolRegion] = useState('');
  const [schoolInitial, setSchoolInitial] = useState('');
  const [schoolKeyword, setSchoolKeyword] = useState('');
  const [schoolSort, setSchoolSort] = useState<SchoolSort>('NAME');
  const debouncedSchoolKeyword = useDebouncedValue(schoolKeyword, 300);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [schoolModalMode, setSchoolModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSchool, setSelectedSchool] = useState<DonationSchool | null>(null);
  const [showSchoolDeleteModal, setShowSchoolDeleteModal] = useState(false);
  const [schoolDeleteHard, setSchoolDeleteHard] = useState(false); // true=완전삭제(물리), false=비활성화(소프트)
  const [selectedSchoolDetail, setSelectedSchoolDetail] = useState<DonationSchool | null>(null);
  const [showSchoolDetailModal, setShowSchoolDetailModal] = useState(false);
  const { deleteSchoolAsync, isPending: isSchoolDeleting } = useDeleteDonationSchool();
  const { deleteSchoolPermanentlyAsync, isPending: isSchoolHardDeleting } =
    usePermanentDeleteDonationSchool();

  const campaignManage = useDonationCampaignManage();
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState<DonationCampaign | null>(null);
  const [showCampaignDetailModal, setShowCampaignDetailModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<DonationHistoryItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 캠페인 필터의 단체 선택지(활성·비활성 모두 — 과거 캠페인이 비활성 단체를 참조할 수 있음)
  const { data: orgFilterData } = useGetDonationOrganizations({ pageSize: 200 });
  const orgFilterList = orgFilterData?.data?.content ?? [];

  // 학교 지역 필터 선택지
  const { data: schoolRegionsData } = useGetDonationSchoolRegions();
  const schoolRegionOptions = schoolRegionsData?.data ?? [];

  const {
    data: campaignsData,
    isLoading: campaignsLoading,
    isFetching: campaignsFetching,
    error: campaignsError,
  } = useGetDonationCampaigns({
    pageNum: campaignPage,
    pageSize: DONATION_CAMPAIGN_PAGE_SIZE,
    organizationId: campaignOrgId,
  });

  const {
    data: historyData,
    isLoading: historyLoading,
    isFetching: historyFetching,
    error: historyError,
  } = useGetDonationHistory({
    pageNum: historyPage,
    pageSize: DONATION_HISTORY_PAGE_SIZE,
    keyword: debouncedHistorySearch,
    // NGO 세그먼트 → CAMPAIGN 결제, 학교 세그먼트 → SCHOOL 결제 (결제 targetType 스냅샷 값)
    targetType: mode === 'NGO' ? 'CAMPAIGN' : 'SCHOOL',
  });

  const {
    data: orgListData,
    isLoading: orgLoading,
    isFetching: orgFetching,
    error: orgError,
  } = useGetDonationOrganizations({
    pageNum: orgPage,
    pageSize: DONATION_ORG_PAGE_SIZE,
    active: orgActiveFilter === 'all' ? undefined : orgActiveFilter === 'active',
  });

  const {
    data: schoolsData,
    isLoading: schoolsLoading,
    isFetching: schoolsFetching,
    error: schoolsError,
  } = useGetDonationSchools({
    pageNum: schoolPage,
    pageSize: DONATION_SCHOOL_PAGE_SIZE,
    region: schoolRegion || undefined,
    initial: schoolInitial || undefined,
    keyword: debouncedSchoolKeyword,
    sort: schoolSort,
  });

  const {
    campaigns,
    totalPages: campaignTotalPages,
    totalCount: campaignTotalCount,
  } = extractCampaignResult<DonationCampaign>(campaignsData, campaignPage, DONATION_CAMPAIGN_PAGE_SIZE);

  const {
    content: historyItems,
    totalPages: historyTotalPages,
    totalElements: historyTotalCount,
  } = extractPaginatedResult<DonationHistoryItem>(historyData);

  const {
    content: orgItems,
    totalPages: orgTotalPages,
    totalElements: orgTotalCount,
  } = extractPaginatedResult<DonationOrganization>(orgListData);

  const {
    content: schoolItems,
    totalPages: schoolTotalPages,
    totalElements: schoolTotalCount,
  } = extractPaginatedResult<DonationSchool>(schoolsData);

  useEffect(() => {
    setHistoryPage(1);
  }, [debouncedHistorySearch, mode]);

  useEffect(() => {
    setCampaignPage(1);
  }, [campaignOrgId]);

  useEffect(() => {
    setOrgPage(1);
  }, [orgActiveFilter]);

  useEffect(() => {
    setSchoolPage(1);
  }, [schoolRegion, schoolInitial, debouncedSchoolKeyword, schoolSort]);

  /** Shrink page only when totals drop (e.g. search/filter), not while paginating. */
  useEffect(() => {
    if (historyFetching) return;
    setHistoryPage((p) => (p > historyTotalPages ? historyTotalPages : p));
  }, [historyTotalPages, historyFetching]);

  useEffect(() => {
    if (campaignsFetching) return;
    setCampaignPage((p) => (p > campaignTotalPages ? campaignTotalPages : p));
  }, [campaignTotalPages, campaignsFetching]);

  useEffect(() => {
    if (orgFetching) return;
    setOrgPage((p) => (p > orgTotalPages ? orgTotalPages : p));
  }, [orgTotalPages, orgFetching]);

  useEffect(() => {
    if (schoolsFetching) return;
    setSchoolPage((p) => (p > schoolTotalPages ? schoolTotalPages : p));
  }, [schoolTotalPages, schoolsFetching]);

  const openCampaignDetail = (campaign: DonationCampaign) => {
    setSelectedCampaignDetail(campaign);
    setShowCampaignDetailModal(true);
  };

  const openHistoryDetail = (item: DonationHistoryItem) => {
    setSelectedHistory(item);
    setShowHistoryModal(true);
  };

  const openOrgCreate = () => {
    setOrgModalMode('create');
    setSelectedOrg(null);
    setShowOrgModal(true);
  };

  const openOrgEdit = (org: DonationOrganization) => {
    setOrgModalMode('edit');
    setSelectedOrg(org);
    setShowOrgModal(true);
  };

  const openOrgDelete = (org: DonationOrganization, hard = false) => {
    setSelectedOrg(org);
    setOrgDeleteHard(hard);
    setShowOrgDeleteModal(true);
  };

  const confirmOrgDelete = async () => {
    if (selectedOrg == null) return;
    try {
      if (orgDeleteHard) {
        await deleteOrganizationPermanentlyAsync(selectedOrg.id);
      } else {
        await deleteOrganizationAsync(selectedOrg.id);
      }
      setShowOrgDeleteModal(false);
    } catch (e) {
      alert(
        getApiErrorMessage(
          e,
          orgDeleteHard
            ? '단체 완전 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.'
            : '단체 비활성화에 실패했습니다. 잠시 후 다시 시도해주세요.',
        ),
      );
    }
  };

  const openSchoolCreate = () => {
    setSchoolModalMode('create');
    setSelectedSchool(null);
    setShowSchoolModal(true);
  };

  const openSchoolEdit = (school: DonationSchool) => {
    setSchoolModalMode('edit');
    setSelectedSchool(school);
    setShowSchoolModal(true);
  };

  const openSchoolDetail = (school: DonationSchool) => {
    setSelectedSchoolDetail(school);
    setShowSchoolDetailModal(true);
  };

  const openSchoolDelete = (school: DonationSchool, hard = false) => {
    setSelectedSchool(school);
    setSchoolDeleteHard(hard);
    setShowSchoolDeleteModal(true);
  };

  const confirmSchoolDelete = async () => {
    if (selectedSchool == null) return;
    try {
      if (schoolDeleteHard) {
        await deleteSchoolPermanentlyAsync(selectedSchool.id);
      } else {
        await deleteSchoolAsync(selectedSchool.id);
      }
      setShowSchoolDeleteModal(false);
    } catch (e) {
      alert(getApiErrorMessage(e, SCHOOL_TABLE_MESSAGES.deleteFailed));
    }
  };

  const statusBadge = (map: Record<string, { label: string; cls: string }>, status: string) => {
    const info = map[status] ?? { label: status ?? '-', cls: 'badgeGray' };
    return <span className={`${shared.badge} ${shared[info.cls]}`}>{info.label}</span>;
  };

  /** 단체명 셀(유형 배지는 상단 탭이 분리하므로 표시하지 않음). */
  const orgCell = (name?: string | null) => {
    if (!name) return <span className={shared.tdMuted}>미지정</span>;
    return <span style={{ fontSize: 12 }}>{name}</span>;
  };

  const subTabs = mode === 'NGO' ? NGO_DONATION_TABS : SCHOOL_DONATION_TABS;

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>
            {lockedMode === 'SCHOOL' ? '학교 기부 관리' : lockedMode === 'NGO' ? 'NGO 기부 관리' : '기부 관리'}
          </h1>
          <p className={shared.pageSubtitle}>
            {lockedMode === 'SCHOOL'
              ? 'School Donation Management'
              : lockedMode === 'NGO'
                ? 'NGO Donation Management'
                : 'Donation Management'}
          </p>
        </div>
        {tab === 'campaigns' ? <RegisterBtn title='캠페인 등록' onClick={campaignManage.openCreate} /> : null}
        {tab === 'organizations' ? <RegisterBtn title='단체 등록' onClick={openOrgCreate} /> : null}
        {tab === 'schools' ? <RegisterBtn title='학교 등록' onClick={openSchoolCreate} /> : null}
      </div>

      {/* NGO / 학교 세그먼트 토글 (고정 모드에서는 숨김) */}
      {lockedMode ? null : (
        <div style={{ marginBottom: 16 }}>
          <FilterGroup
            filters={DONATION_MODE_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
            current={mode}
            onFilterChange={(key) => changeMode(key as DonationMode)}
          />
        </div>
      )}

      <div className={shared.card}>
        <div
          className={shared.cardHead}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            flexWrap: 'wrap',
          }}
        >
          <FilterGroup filters={subTabs} current={tab} onFilterChange={(key) => setTab(key as DonationTab)} />

          {tab === 'campaigns' ? (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                style={filterSelectStyle}
                value={campaignOrgId ?? ''}
                onChange={(e) => setCampaignOrgId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value=''>단체 전체</option>
                {orgFilterList.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {tab === 'history' ? (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <SearchBar
                value={historySearch}
                onChange={setHistorySearch}
                placeholder='대상명 또는 기부자명 검색...'
                minWidth='240px'
              />
            </div>
          ) : null}

          {tab === 'organizations' ? (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                style={filterSelectStyle}
                value={orgActiveFilter}
                onChange={(e) => setOrgActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value='all'>활성 전체</option>
                <option value='active'>활성</option>
                <option value='inactive'>비활성</option>
              </select>
            </div>
          ) : null}

          {tab === 'schools' ? (
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                gap: 8,
                flexWrap: 'nowrap',
                alignItems: 'center',
                minWidth: 0,
              }}
            >
              <select
                style={{ ...filterSelectStyle, flexShrink: 0 }}
                value={schoolRegion}
                onChange={(e) => setSchoolRegion(e.target.value)}
              >
                <option value=''>지역 전체</option>
                {schoolRegionOptions.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
              <select
                style={{ ...filterSelectStyle, flexShrink: 0 }}
                value={schoolInitial}
                onChange={(e) => setSchoolInitial(e.target.value)}
              >
                <option value=''>초성 전체</option>
                {SCHOOL_INITIAL_BUCKETS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                style={{ ...filterSelectStyle, flexShrink: 0 }}
                value={schoolSort}
                onChange={(e) => setSchoolSort(e.target.value as SchoolSort)}
              >
                {SCHOOL_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div style={{ flex: '1 1 150px', minWidth: 120, display: 'flex' }}>
                <SearchBar value={schoolKeyword} onChange={setSchoolKeyword} placeholder='학교명 검색...' />
              </div>
            </div>
          ) : null}
        </div>

        <div className={shared.tableResponsive}>
          {tab === 'campaigns' ? (
            <table className={shared.table}>
              <thead className={shared.thead}>
                <tr>
                  <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>이미지</th>
                  <th className={shared.th}>캠페인명</th>
                  <th className={shared.th}>단체</th>
                  <th className={`${shared.th} ${shared.thRight}`}>목표 / 모금</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>달성률</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>등록일</th>
                  <th className={`${shared.th} ${shared.thRight}`}>관리</th>
                </tr>
              </thead>
              <tbody>
                {campaignsLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`campaign-skeleton-${idx}`} className={shared.skeletonRow}>
                      {Array.from({ length: CAMPAIGN_COLS }).map((__, col) => (
                        <td key={`campaign-skeleton-${idx}-${col}`} className={shared.td}>
                          <span className={shared.skeletonLine} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : campaignsError ? (
                  <tr>
                    <td colSpan={CAMPAIGN_COLS} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                      {CAMPAIGN_TABLE_MESSAGES.loadError}
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={CAMPAIGN_COLS} className={shared.tableStateCell}>
                      {CAMPAIGN_TABLE_MESSAGES.empty}
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr
                      key={c.id}
                      className={shared.tr}
                      onClick={() => openCampaignDetail(c)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>{c.id}</td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt=''
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className={shared.td}>
                        <button
                          type='button'
                          onClick={() => openCampaignDetail(c)}
                          style={{
                            border: 'none',
                            background: 'none',
                            padding: 0,
                            font: 'inherit',
                            fontWeight: 600,
                            color: 'var(--blue-text, #1d4ed8)',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          {c.name}
                        </button>
                      </td>
                      <td className={shared.td}>{orgCell(c.organization?.name)}</td>
                      <td className={`${shared.td} ${shared.tdRight} ${shared.tdMuted}`} style={{ fontSize: 11 }}>
                        <div>{formatKrw(c.targetAmount)}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{formatKrw(c.accumulatedAmount)}</div>
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter} ${shared.tdBold}`}>
                        {formatCampaignProgress(c.accumulatedAmount, c.targetAmount)}
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        {statusBadge(CAMPAIGN_STATUS_MAP, c.status)}
                      </td>
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                        {formatIsoDateTime(c.createdAt)}
                      </td>
                      <td className={`${shared.td} ${shared.tdRight}`}>
                        <div className={shared.actionGroup} onClick={(e) => e.stopPropagation()}>
                          <EditBtn onClick={() => campaignManage.openEdit(c)} />
                          <DeleteBtn onClick={() => campaignManage.openDelete(c)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : tab === 'history' ? (
            <table className={shared.table}>
              <thead className={shared.thead}>
                <tr>
                  <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
                  <th className={shared.th}>대상</th>
                  <th className={shared.th}>기부자</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>사진</th>
                  <th className={`${shared.th} ${shared.thRight}`}>금액</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>결제수단</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>상태</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>기부일시</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>상세</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={`history-skeleton-${idx}`} className={shared.skeletonRow}>
                      {Array.from({ length: HISTORY_COLS }).map((__, col) => (
                        <td key={`history-skeleton-${idx}-${col}`} className={shared.td}>
                          <span className={shared.skeletonLine} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : historyError ? (
                  <tr>
                    <td colSpan={HISTORY_COLS} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                      기부 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                    </td>
                  </tr>
                ) : historyItems.length === 0 ? (
                  <tr>
                    <td colSpan={HISTORY_COLS} className={shared.tableStateCell}>
                      해당 조건의 기부 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  historyItems.map((h) => (
                    <tr
                      key={h.id}
                      className={shared.tr}
                      onClick={() => openHistoryDetail(h)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>{h.id}</td>
                      <td className={shared.td}>{h.targetName}</td>
                      <td className={shared.td}>{h.donatorName}</td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        {h.photoUrl ? (
                          <img
                            src={h.photoUrl}
                            alt=''
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className={`${shared.td} ${shared.tdRight} ${shared.tdBold}`}>{formatKrw(h.totalAmount)}</td>
                      <td className={`${shared.td} ${shared.tdCenter} ${shared.tdMuted}`}>
                        {PAYMENT_METHOD_MAP[h.paymentMethod] ?? h.paymentMethod ?? '-'}
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        {statusBadge(DONATION_STATUS_MAP, h.status)}
                      </td>
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                        {formatIsoDateTime(h.donatedAt)}
                      </td>
                      <td className={shared.td}>
                        <div
                          className={shared.actionGroup}
                          style={{ justifyContent: 'center' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button type='button' className={shared.btnOutline} onClick={() => openHistoryDetail(h)}>
                            상세보기
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : tab === 'organizations' ? (
            <table className={shared.table}>
              <thead className={shared.thead}>
                <tr>
                  <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
                  <th className={shared.th}>단체명</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>활성</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>등록일</th>
                  <th className={`${shared.th} ${shared.thRight}`}>관리</th>
                </tr>
              </thead>
              <tbody>
                {orgLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`org-skeleton-${idx}`} className={shared.skeletonRow}>
                      {Array.from({ length: ORG_COLS }).map((__, col) => (
                        <td key={`org-skeleton-${idx}-${col}`} className={shared.td}>
                          <span className={shared.skeletonLine} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : orgError ? (
                  <tr>
                    <td colSpan={ORG_COLS} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                      기부 단체를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                    </td>
                  </tr>
                ) : orgItems.length === 0 ? (
                  <tr>
                    <td colSpan={ORG_COLS} className={shared.tableStateCell}>
                      등록된 기부 단체가 없습니다.
                    </td>
                  </tr>
                ) : (
                  orgItems.map((org) => (
                    <tr key={org.id} className={shared.tr} style={org.active ? undefined : { opacity: 0.55 }}>
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>{org.id}</td>
                      <td className={`${shared.td} ${shared.tdBold}`}>{org.name}</td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        {org.active ? (
                          <span className={`${shared.badge} ${shared.badgeGreen}`}>활성</span>
                        ) : (
                          <span className={`${shared.badge} ${shared.badgeGray}`}>비활성</span>
                        )}
                      </td>
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                        {formatIsoDateTime(org.createdAt)}
                      </td>
                      <td className={`${shared.td} ${shared.tdRight}`}>
                        <div className={shared.actionGroup}>
                          <EditBtn onClick={() => openOrgEdit(org)} />
                          {/* 활성=비활성화(소프트), 비활성=완전삭제(물리) */}
                          <DeleteBtn onClick={() => openOrgDelete(org, !org.active)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className={shared.table}>
              <thead className={shared.thead}>
                <tr>
                  <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>이미지</th>
                  <th className={shared.th}>학교명</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>지역</th>
                  <th className={`${shared.th} ${shared.thRight}`}>목표 / 누적</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>달성률</th>
                  <th className={shared.th}>금액 옵션</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>활성</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>등록일</th>
                  <th className={`${shared.th} ${shared.thRight}`}>관리</th>
                </tr>
              </thead>
              <tbody>
                {schoolsLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`school-skeleton-${idx}`} className={shared.skeletonRow}>
                      {Array.from({ length: SCHOOL_COLS }).map((__, col) => (
                        <td key={`school-skeleton-${idx}-${col}`} className={shared.td}>
                          <span className={shared.skeletonLine} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : schoolsError ? (
                  <tr>
                    <td colSpan={SCHOOL_COLS} className={`${shared.tableStateCell} ${shared.tableStateError}`}>
                      {SCHOOL_TABLE_MESSAGES.loadError}
                    </td>
                  </tr>
                ) : schoolItems.length === 0 ? (
                  <tr>
                    <td colSpan={SCHOOL_COLS} className={shared.tableStateCell}>
                      {SCHOOL_TABLE_MESSAGES.empty}
                    </td>
                  </tr>
                ) : (
                  schoolItems.map((s) => (
                    <tr
                      key={s.id}
                      className={shared.tr}
                      onClick={() => openSchoolDetail(s)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>{s.id}</td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        {s.logoImageUrl ? (
                          <img
                            src={s.logoImageUrl}
                            alt=''
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className={`${shared.td} ${shared.tdBold}`}>{s.name}</td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>{s.regionLabel ?? '-'}</td>
                      <td className={`${shared.td} ${shared.tdRight} ${shared.tdMuted}`} style={{ fontSize: 11 }}>
                        <div>{s.targetAmount && s.targetAmount > 0 ? formatKrw(s.targetAmount) : '목표 없음'}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{formatKrw(s.accumulatedAmount)}</div>
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter} ${shared.tdBold}`}>
                        {formatCampaignProgress(s.accumulatedAmount, s.targetAmount)}
                      </td>
                      <td className={shared.td}>
                        {(() => {
                          const opts = amountOptionsToNumbers(s.amountOptions);
                          if (opts.length === 0) return <span className={shared.tdMuted}>-</span>;
                          return (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {opts.map((amount) => (
                                <span
                                  key={amount}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '2px 7px',
                                    borderRadius: 999,
                                    background: 'var(--bg-muted, #f1f5f9)',
                                    color: 'var(--text-secondary)',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {formatAmountShort(amount)}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        {s.active ? (
                          <span className={`${shared.badge} ${shared.badgeGreen}`}>활성</span>
                        ) : (
                          <span className={`${shared.badge} ${shared.badgeGray}`}>비활성</span>
                        )}
                      </td>
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                        {formatIsoDateTime(s.createdAt)}
                      </td>
                      <td className={`${shared.td} ${shared.tdRight}`}>
                        <div className={shared.actionGroup} onClick={(e) => e.stopPropagation()}>
                          <EditBtn onClick={() => openSchoolEdit(s)} />
                          {/* 활성=비활성화(소프트), 비활성=완전삭제(물리) */}
                          <DeleteBtn onClick={() => openSchoolDelete(s, !s.active)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {tab === 'campaigns' ? (
          <Pagination
            currentPage={campaignPage}
            totalPages={campaignTotalPages}
            onPageChange={setCampaignPage}
            totalCount={campaignTotalCount}
            unit='건'
          />
        ) : tab === 'history' ? (
          <Pagination
            currentPage={historyPage}
            totalPages={historyTotalPages}
            onPageChange={setHistoryPage}
            totalCount={historyTotalCount}
            unit='건'
          />
        ) : tab === 'organizations' ? (
          <Pagination
            currentPage={orgPage}
            totalPages={orgTotalPages}
            onPageChange={setOrgPage}
            totalCount={orgTotalCount}
            unit='개'
          />
        ) : (
          <Pagination
            currentPage={schoolPage}
            totalPages={schoolTotalPages}
            onPageChange={setSchoolPage}
            totalCount={schoolTotalCount}
            unit='개'
          />
        )}
      </div>

      {campaignManage.showManageModal ? (
        <DonationCampaignManageModal
          open={campaignManage.showManageModal}
          mode={campaignManage.modalMode}
          campaign={campaignManage.selectedCampaign}
          onClose={() => campaignManage.setShowManageModal(false)}
          onSuccess={() => {
            campaignManage.setShowManageModal(false);
            campaignManage.refetch();
          }}
        />
      ) : null}

      {campaignManage.showDeleteModal ? (
        <DeleteModal
          open={campaignManage.showDeleteModal}
          title='캠페인을 삭제하시겠습니까?'
          target={campaignManage.selectedCampaign?.name}
          loading={campaignManage.isDeleting}
          onConfirm={campaignManage.confirmDelete}
          onClose={() => campaignManage.setShowDeleteModal(false)}
        />
      ) : null}

      {showCampaignDetailModal ? (
        <DonationCampaignDetailModal
          open={showCampaignDetailModal}
          campaign={selectedCampaignDetail}
          onClose={() => setShowCampaignDetailModal(false)}
        />
      ) : null}

      {showHistoryModal ? (
        <DonationHistoryDetailModal
          open={showHistoryModal}
          item={selectedHistory}
          onClose={() => setShowHistoryModal(false)}
        />
      ) : null}

      {showOrgModal ? (
        <DonationOrganizationManageModal
          open={showOrgModal}
          mode={orgModalMode}
          organization={selectedOrg}
          onClose={() => setShowOrgModal(false)}
          onSuccess={() => setShowOrgModal(false)}
        />
      ) : null}

      {showOrgDeleteModal ? (
        <DeleteModal
          open={showOrgDeleteModal}
          title={orgDeleteHard ? '단체를 완전 삭제하시겠습니까?' : '단체를 비활성화하시겠습니까?'}
          target={selectedOrg?.name}
          loading={isOrgDeleting || isOrgHardDeleting}
          onConfirm={confirmOrgDelete}
          onClose={() => setShowOrgDeleteModal(false)}
        />
      ) : null}

      {showSchoolModal ? (
        <DonationSchoolManageModal
          open={showSchoolModal}
          mode={schoolModalMode}
          school={selectedSchool}
          onClose={() => setShowSchoolModal(false)}
          onSuccess={() => setShowSchoolModal(false)}
        />
      ) : null}

      {showSchoolDetailModal ? (
        <DonationSchoolDetailModal
          open={showSchoolDetailModal}
          school={selectedSchoolDetail}
          onClose={() => setShowSchoolDetailModal(false)}
        />
      ) : null}

      {showSchoolDeleteModal ? (
        <DeleteModal
          open={showSchoolDeleteModal}
          title={schoolDeleteHard ? '학교를 완전 삭제하시겠습니까?' : '학교를 삭제하시겠습니까?'}
          target={selectedSchool?.name}
          loading={isSchoolDeleting || isSchoolHardDeleting}
          onConfirm={confirmSchoolDelete}
          onClose={() => setShowSchoolDeleteModal(false)}
        />
      ) : null}
    </div>
  );
}
