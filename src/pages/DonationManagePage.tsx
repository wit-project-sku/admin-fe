import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import shared from '@commons/shared.module.css';
import FilterGroup from '@components/common/FilterGroup';
import SearchBar from '@components/common/SearchBar';
import Pagination from '@components/common/Pagination';
import RegisterBtn from '@components/common/RegisterBtn';
import EditBtn from '@components/common/EditBtn';
import DeleteBtn from '@components/common/DeleteBtn';
import ImageZoom from '@components/common/ImageZoom';
import DeleteModal from '@modals/DeleteModal';
import DonationCampaignManageModal from '@modals/DonationCampaignManageModal';
import DonationCampaignDetailModal from '@modals/DonationCampaignDetailModal';
import DonationHistoryDetailModal from '@modals/DonationHistoryDetailModal';
import DonationOrganizationManageModal from '@modals/DonationOrganizationManageModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  useGetDonationCampaigns,
  type DonationCampaign,
} from '../hooks/donation-api/useGetDonationCampaigns';
import { useGetDonationHistory, type DonationHistoryItem } from '../hooks/donation-api/useGetDonationHistory';
import {
  useGetDonationOrganizations,
  useDeleteDonationOrganization,
  type DonationOrganization,
} from '../hooks/donation-api/useDonationOrganizations';
import type { DonationTypeCode } from '../hooks/donation-api/donationApiTypes';
import { extractPaginatedResult } from '../utils/queryHelpers';
import {
  DONATION_TABS,
  DONATION_CAMPAIGN_PAGE_SIZE,
  DONATION_HISTORY_PAGE_SIZE,
  DONATION_TYPE_LABEL,
  DONATION_TYPE_OPTIONS,
  CAMPAIGN_STATUS_MAP,
  CAMPAIGN_TABLE_MESSAGES,
  DONATION_STATUS_MAP,
  PAYMENT_METHOD_MAP,
  type DonationTab,
} from '../features/donations/donationListConfig';
import {
  extractCampaignResult,
  formatAmountOptions,
  formatCampaignProgress,
  formatIsoDateTime,
  formatKrw,
} from '../features/donations/donationFormatters';
import { useDonationCampaignManage } from '../features/donations/useDonationCampaignManage';

const CAMPAIGN_COLS = 10;
const HISTORY_COLS = 10;
const ORG_COLS = 6;
const ORG_PAGE_SIZE = 10;

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

export default function DonationManagePage() {
  const [tab, setTab] = useState<DonationTab>('campaigns');

  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignType, setCampaignType] = useState<DonationTypeCode | ''>('');
  const [campaignOrgId, setCampaignOrgId] = useState<number | null>(null);

  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const [historyType, setHistoryType] = useState<DonationTypeCode | ''>('');
  const [historyOrgId, setHistoryOrgId] = useState<number | null>(null);
  const debouncedHistorySearch = useDebouncedValue(historySearch, 300);

  // 단체 관리 탭
  const [orgPage, setOrgPage] = useState(1);
  const [orgTypeFilter, setOrgTypeFilter] = useState<DonationTypeCode | ''>('');
  const [orgActiveFilter, setOrgActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgModalMode, setOrgModalMode] = useState<'create' | 'edit'>('create');
  const [selectedOrg, setSelectedOrg] = useState<DonationOrganization | null>(null);
  const [showOrgDeleteModal, setShowOrgDeleteModal] = useState(false);
  const { deleteOrganizationAsync, isPending: isOrgDeleting } = useDeleteDonationOrganization();

  const campaignManage = useDonationCampaignManage();
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState<DonationCampaign | null>(null);
  const [showCampaignDetailModal, setShowCampaignDetailModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<DonationHistoryItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 캠페인/내역 필터의 단체 선택지(활성·비활성 모두 — 과거 캠페인이 비활성 단체를 참조할 수 있음)
  const { data: orgFilterData } = useGetDonationOrganizations({ pageSize: 200 });
  const orgFilterList = orgFilterData?.data?.content ?? [];

  const {
    data: campaignsData,
    isLoading: campaignsLoading,
    isFetching: campaignsFetching,
    error: campaignsError,
  } = useGetDonationCampaigns({
    pageNum: campaignPage,
    pageSize: DONATION_CAMPAIGN_PAGE_SIZE,
    type: campaignType,
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
    type: historyType,
    organizationId: historyOrgId,
  });

  const {
    data: orgListData,
    isLoading: orgLoading,
    isFetching: orgFetching,
    error: orgError,
  } = useGetDonationOrganizations({
    pageNum: orgPage,
    pageSize: ORG_PAGE_SIZE,
    type: orgTypeFilter,
    active: orgActiveFilter === 'all' ? undefined : orgActiveFilter === 'active',
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

  useEffect(() => {
    setHistoryPage(1);
  }, [debouncedHistorySearch, historyType, historyOrgId]);

  useEffect(() => {
    setCampaignPage(1);
  }, [campaignType, campaignOrgId]);

  useEffect(() => {
    setOrgPage(1);
  }, [orgTypeFilter, orgActiveFilter]);

  useEffect(() => {
    setCampaignPage(1);
  }, [tab]);

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

  const handleTabChange = useCallback((key: string) => {
    setTab(key as DonationTab);
  }, []);

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

  const openOrgDelete = (org: DonationOrganization) => {
    setSelectedOrg(org);
    setShowOrgDeleteModal(true);
  };

  const confirmOrgDelete = async () => {
    if (selectedOrg == null) return;
    try {
      await deleteOrganizationAsync(selectedOrg.id);
      setShowOrgDeleteModal(false);
    } catch {
      alert('단체 비활성화에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const statusBadge = (map: Record<string, { label: string; cls: string }>, status: string) => {
    const info = map[status] ?? { label: status ?? '-', cls: 'badgeGray' };
    return <span className={`${shared.badge} ${shared[info.cls]}`}>{info.label}</span>;
  };

  const typeBadge = (type?: string | null) => {
    if (!type) return <span className={shared.tdMuted}>미지정</span>;
    const cls = type === 'SCHOOL' ? 'badgeGreen' : 'badgeBlue';
    return <span className={`${shared.badge} ${shared[cls]}`}>{DONATION_TYPE_LABEL[type] ?? type}</span>;
  };

  /** 단체(종류 배지 + 단체명) 셀. */
  const orgCell = (type?: string | null, name?: string | null) => {
    if (!name) return <span className={shared.tdMuted}>미지정</span>;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {typeBadge(type)}
        <span style={{ fontSize: 12 }}>{name}</span>
      </div>
    );
  };

  const campaignOrgOptions = orgFilterList.filter((o) => !campaignType || o.type === campaignType);
  const historyOrgOptions = orgFilterList.filter((o) => !historyType || o.type === historyType);

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>기부 관리</h1>
          <p className={shared.pageSubtitle}>Donation Management</p>
        </div>
        {tab === 'campaigns' ? <RegisterBtn title='캠페인 등록' onClick={campaignManage.openCreate} /> : null}
        {tab === 'organizations' ? <RegisterBtn title='단체 등록' onClick={openOrgCreate} /> : null}
      </div>

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
          <FilterGroup filters={DONATION_TABS} current={tab} onFilterChange={handleTabChange} />

          {tab === 'campaigns' ? (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                style={filterSelectStyle}
                value={campaignType}
                onChange={(e) => {
                  setCampaignType(e.target.value as DonationTypeCode | '');
                  setCampaignOrgId(null);
                }}
              >
                <option value=''>종류 전체</option>
                {DONATION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                style={filterSelectStyle}
                value={campaignOrgId ?? ''}
                onChange={(e) => setCampaignOrgId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value=''>단체 전체</option>
                {campaignOrgOptions.map((org) => (
                  <option key={org.id} value={org.id}>
                    [{DONATION_TYPE_LABEL[org.type] ?? org.type}] {org.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {tab === 'history' ? (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                style={filterSelectStyle}
                value={historyType}
                onChange={(e) => {
                  setHistoryType(e.target.value as DonationTypeCode | '');
                  setHistoryOrgId(null);
                }}
              >
                <option value=''>종류 전체</option>
                {DONATION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                style={filterSelectStyle}
                value={historyOrgId ?? ''}
                onChange={(e) => setHistoryOrgId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value=''>단체 전체</option>
                {historyOrgOptions.map((org) => (
                  <option key={org.id} value={org.id}>
                    [{DONATION_TYPE_LABEL[org.type] ?? org.type}] {org.name}
                  </option>
                ))}
              </select>
              <SearchBar
                value={historySearch}
                onChange={setHistorySearch}
                placeholder='캠페인명 또는 기부자명 검색...'
                minWidth='240px'
              />
            </div>
          ) : null}

          {tab === 'organizations' ? (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                style={filterSelectStyle}
                value={orgTypeFilter}
                onChange={(e) => setOrgTypeFilter(e.target.value as DonationTypeCode | '')}
              >
                <option value=''>종류 전체</option>
                {DONATION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
                  <th className={shared.th}>금액 옵션</th>
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
                          <ImageZoom
                            src={c.imageUrl}
                            title={c.name}
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }}
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
                      <td className={shared.td}>{orgCell(c.organization?.type, c.organization?.name)}</td>
                      <td className={`${shared.td} ${shared.tdRight} ${shared.tdMuted}`} style={{ fontSize: 11 }}>
                        <div>{formatKrw(c.targetAmount)}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{formatKrw(c.accumulatedAmount)}</div>
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter} ${shared.tdBold}`}>
                        {formatCampaignProgress(c.accumulatedAmount, c.targetAmount)}
                      </td>
                      <td className={`${shared.td} ${shared.tdMuted}`} style={{ fontSize: 11, maxWidth: 180 }}>
                        {formatAmountOptions(c.amountOptions)}
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
                  <th className={shared.th}>캠페인</th>
                  <th className={shared.th}>단체</th>
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
                      <td className={shared.td}>{h.campaignName}</td>
                      <td className={shared.td}>{orgCell(h.type, h.organizationName)}</td>
                      <td className={shared.td}>{h.donatorName}</td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        {h.photoUrl ? (
                          <ImageZoom
                            src={h.photoUrl}
                            title={h.donatorName}
                            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }}
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
          ) : (
            <table className={shared.table}>
              <thead className={shared.thead}>
                <tr>
                  <th className={`${shared.th} ${shared.thCenter}`}>ID</th>
                  <th className={`${shared.th} ${shared.thCenter}`}>종류</th>
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
                      <td className={`${shared.td} ${shared.tdCenter}`}>{typeBadge(org.type)}</td>
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
                          {org.active ? <DeleteBtn onClick={() => openOrgDelete(org)} /> : null}
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
        ) : (
          <Pagination
            currentPage={orgPage}
            totalPages={orgTotalPages}
            onPageChange={setOrgPage}
            totalCount={orgTotalCount}
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
          title='단체를 비활성화하시겠습니까?'
          target={selectedOrg?.name}
          loading={isOrgDeleting}
          onConfirm={confirmOrgDelete}
          onClose={() => setShowOrgDeleteModal(false)}
        />
      ) : null}
    </div>
  );
}
