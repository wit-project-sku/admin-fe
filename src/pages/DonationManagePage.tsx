import { useState, useEffect, useCallback } from 'react';
import shared from '@commons/shared.module.css';
import FilterGroup from '@components/common/FilterGroup';
import SearchBar from '@components/common/SearchBar';
import Pagination from '@components/common/Pagination';
import RegisterBtn from '@components/common/RegisterBtn';
import EditBtn from '@components/common/EditBtn';
import DeleteBtn from '@components/common/DeleteBtn';
import DeleteModal from '@modals/DeleteModal';
import DonationCampaignManageModal from '@modals/DonationCampaignManageModal';
import DonationHistoryDetailModal from '@modals/DonationHistoryDetailModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  useGetDonationCampaigns,
  type DonationCampaign,
} from '../hooks/donation-api/useGetDonationCampaigns';
import { useGetDonationHistory, type DonationHistoryItem } from '../hooks/donation-api/useGetDonationHistory';
import { extractPaginatedResult } from '../utils/queryHelpers';
import {
  DONATION_TABS,
  DONATION_CAMPAIGN_PAGE_SIZE,
  DONATION_HISTORY_PAGE_SIZE,
  CAMPAIGN_STATUS_MAP,
  CAMPAIGN_TABLE_MESSAGES,
  DONATION_STATUS_MAP,
  PAYMENT_METHOD_MAP,
  type DonationTab,
} from '../features/donations/donationListConfig';
import {
  extractCampaignResult,
  formatAmountOptions,
  formatIsoDateTime,
  formatKrw,
} from '../features/donations/donationFormatters';
import { useDonationCampaignManage } from '../features/donations/useDonationCampaignManage';

const CAMPAIGN_COLS = 8;
const HISTORY_COLS = 9;

export default function DonationManagePage() {
  const [tab, setTab] = useState<DonationTab>('campaigns');

  const [campaignPage, setCampaignPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const debouncedHistorySearch = useDebouncedValue(historySearch, 300);

  const campaignManage = useDonationCampaignManage();
  const [selectedHistory, setSelectedHistory] = useState<DonationHistoryItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const {
    data: campaignsData,
    isLoading: campaignsLoading,
    isFetching: campaignsFetching,
    error: campaignsError,
  } = useGetDonationCampaigns({
    pageNum: campaignPage,
    pageSize: DONATION_CAMPAIGN_PAGE_SIZE,
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

  useEffect(() => {
    setHistoryPage(1);
  }, [debouncedHistorySearch]);

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

  const handleTabChange = useCallback((key: string) => {
    setTab(key as DonationTab);
  }, []);

  const openHistoryDetail = (item: DonationHistoryItem) => {
    setSelectedHistory(item);
    setShowHistoryModal(true);
  };

  const statusBadge = (map: Record<string, { label: string; cls: string }>, status: string) => {
    const info = map[status] ?? { label: status ?? '-', cls: 'badgeGray' };
    return <span className={`${shared.badge} ${shared[info.cls]}`}>{info.label}</span>;
  };

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>기부 관리</h1>
          <p className={shared.pageSubtitle}>Donation Management</p>
        </div>
        {tab === 'campaigns' ? <RegisterBtn title='캠페인 등록' onClick={campaignManage.openCreate} /> : null}
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

          {tab === 'history' ? (
            <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
              <SearchBar
                value={historySearch}
                onChange={setHistorySearch}
                placeholder='캠페인명 또는 기부자명 검색...'
                minWidth='280px'
              />
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
                    <tr key={c.id} className={shared.tr}>
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>{c.id}</td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt=''
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }}
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className={shared.td}>{c.name}</td>
                      <td className={`${shared.td} ${shared.tdMuted}`} style={{ fontSize: 11 }}>
                        {formatAmountOptions(c.amountOptions)}
                      </td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        {statusBadge(CAMPAIGN_STATUS_MAP, c.status)}
                      </td>
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>
                        {formatIsoDateTime(c.createdAt)}
                      </td>
                      <td className={`${shared.td} ${shared.tdRight}`}>
                        <div className={shared.actionGroup}>
                          <EditBtn onClick={() => campaignManage.openEdit(c)} />
                          <DeleteBtn onClick={() => campaignManage.openDelete(c)} />
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
                  <th className={shared.th}>캠페인</th>
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
                    <tr key={h.id} className={shared.tr}>
                      <td className={`${shared.td} ${shared.tdMuted} ${shared.tdCenter}`}>{h.id}</td>
                      <td className={shared.td}>{h.campaignName}</td>
                      <td className={shared.td}>{h.donatorName}</td>
                      <td className={`${shared.td} ${shared.tdCenter}`}>
                        {h.photoUrl ? (
                          <img
                            src={h.photoUrl}
                            alt=''
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
                        <div className={shared.actionGroup} style={{ justifyContent: 'center' }}>
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
        ) : (
          <Pagination
            currentPage={historyPage}
            totalPages={historyTotalPages}
            onPageChange={setHistoryPage}
            totalCount={historyTotalCount}
            unit='건'
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

      {showHistoryModal ? (
        <DonationHistoryDetailModal
          open={showHistoryModal}
          item={selectedHistory}
          onClose={() => setShowHistoryModal(false)}
        />
      ) : null}
    </div>
  );
}
