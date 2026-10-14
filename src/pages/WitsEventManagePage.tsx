// WITS 앱 이벤트 관리 — 배너 관리처럼 한 페이지 두 탭.
//  · 이벤트 목록 : 등록·수정·삭제, 참여자 보기
//  · 앱 배너 순서 : 앱 홈 배너에 거는 이벤트의 순서
import { useCallback, useState } from 'react';

import shared from '@commons/shared.module.css';
import RegisterBtn from '@components/common/RegisterBtn';
import { WitsEventListPanel } from '@/features/wits/events/WitsEventListPanel';
import { WitsEventBannerPanel } from '@/features/wits/events/WitsEventBannerPanel';
import { WitsEventFormModal } from '@/features/wits/events/WitsEventFormModal';
import { WitsEventParticipantsModal } from '@/features/wits/events/WitsEventParticipantsModal';
import s from '@/features/wits/Wits.module.css';

type Tab = 'events' | 'banners';

const TABS: { id: Tab; label: string }[] = [
  { id: 'events', label: '이벤트 목록' },
  { id: 'banners', label: '앱 배너 순서' },
];

type FormState = { mode: 'create' | 'edit'; id: number | null } | null;
type ParticipantsState = { id: number; title: string } | null;

export default function WitsEventManagePage() {
  const [tab, setTab] = useState<Tab>('events');
  const [form, setForm] = useState<FormState>(null);
  const [participants, setParticipants] = useState<ParticipantsState>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = useCallback((text: string, ok = true) => {
    setNotice({ text, ok });
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  return (
    <div>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>이벤트 관리</h1>
          <p className={shared.pageSubtitle}>
            {tab === 'events' ? 'WITS 앱에 보일 이벤트를 등록하고 참여자를 확인합니다.' : '앱 홈 배너에 거는 이벤트의 순서를 정합니다.'}
          </p>
        </div>
        {tab === 'events' ? <RegisterBtn title='이벤트 등록' onClick={() => setForm({ mode: 'create', id: null })} /> : null}
      </div>

      <div className={s.tabGroup}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type='button'
            className={`${s.tabBtn} ${tab === id ? s.tabBtnActive : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {notice ? <div className={`${s.notice} ${notice.ok ? s.noticeOk : s.noticeErr}`}>{notice.text}</div> : null}

      <div className={shared.card}>
        {tab === 'events' ? (
          <WitsEventListPanel
            onEdit={(row) => setForm({ mode: 'edit', id: row.id })}
            onParticipants={(row) => setParticipants({ id: row.id, title: row.titleKo })}
            onNotice={flash}
          />
        ) : (
          <WitsEventBannerPanel onNotice={flash} />
        )}
      </div>

      {form ? (
        <WitsEventFormModal
          mode={form.mode}
          eventId={form.id}
          onClose={() => setForm(null)}
          onSuccess={(msg) => {
            setForm(null);
            flash(msg);
          }}
          onShowParticipants={(id, title) => setParticipants({ id, title })}
        />
      ) : null}

      {participants ? (
        <WitsEventParticipantsModal
          eventId={participants.id}
          title={participants.title}
          onClose={() => setParticipants(null)}
        />
      ) : null}
    </div>
  );
}
