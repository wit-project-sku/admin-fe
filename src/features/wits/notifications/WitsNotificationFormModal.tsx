// WITS 앱 알림 등록·수정 창. 1단계는 앱 알림함만(푸시 없음) — 발송 시각부터 알림함에 보인다.
// 수정은 예약 상태일 때만 연다(목록에서 막고, 서버도 거절한다).
import { useMemo, useState, type FormEvent } from 'react';

import SearchableSelect, { type SearchableOption } from '@components/common/SearchableSelect';
import { InputField, ModalContainer, ModalFooter, ModalHeader, TextAreaField } from '@modals/ModalElements';
import { useWitsEventList } from '@/hooks/wits-api/useWitsEvents';
import { useWitsNotificationMutations } from '@/hooks/wits-api/useWitsNotifications';
import {
  WITS_EVENT_STATUS_LABEL,
  WITS_NOTIFICATION_BODY_MAX,
  WITS_TITLE_MAX,
  type WitsNotificationDto,
  type WitsNotificationPayload,
} from '@/hooks/wits-api/witsTypes';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { blankToNull, nowInputDateTime, toInputDateTime, toServerDateTime } from '../witsFormat';
import s from '../Wits.module.css';

type Lang = 'ko' | 'en';
type SendMode = 'now' | 'schedule';
type ErrorKey = 'titleKo' | 'bodyKo' | 'sendAt';

/** 연결 이벤트 선택지 — 최근 시작 순 100건이면 충분하다(오래된 이벤트에 알림을 걸 일은 드물다). */
const EVENT_OPTION_LIMIT = 100;
const NO_EVENT = '';

type Props = {
  /** 없으면 등록 */
  editing: WitsNotificationDto | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function WitsNotificationFormModal({ editing, onClose, onSuccess }: Props) {
  const isEdit = !!editing;
  const [lang, setLang] = useState<Lang>('ko');
  const [titleKo, setTitleKo] = useState(editing?.titleKo ?? '');
  const [titleEn, setTitleEn] = useState(editing?.titleEn ?? '');
  const [bodyKo, setBodyKo] = useState(editing?.bodyKo ?? '');
  const [bodyEn, setBodyEn] = useState(editing?.bodyEn ?? '');
  const [eventId, setEventId] = useState<string>(editing?.eventId != null ? String(editing.eventId) : NO_EVENT);
  const [sendMode, setSendMode] = useState<SendMode>(isEdit ? 'schedule' : 'now');
  const [sendAt, setSendAt] = useState(toInputDateTime(editing?.sendAt));
  const [isAd, setIsAd] = useState(editing?.isAd ?? false);
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [apiError, setApiError] = useState('');

  const { rows: events, isPending: eventsPending } = useWitsEventList({ pageNum: 1, pageSize: EVENT_OPTION_LIMIT });
  const { createAsync, updateAsync, isSaving } = useWitsNotificationMutations();

  const eventOptions = useMemo<SearchableOption[]>(() => {
    const opts: SearchableOption[] = [{ value: NO_EVENT, label: '연결 안 함' }];
    events.forEach((e) =>
      opts.push({ value: String(e.id), label: e.titleKo, sublabel: WITS_EVENT_STATUS_LABEL[e.status] ?? e.status }),
    );
    // 수정 중인 알림의 이벤트가 최근 100건 밖이어도 값이 사라지지 않게 남긴다.
    if (editing?.eventId != null && !events.some((e) => e.id === editing.eventId)) {
      opts.push({ value: String(editing.eventId), label: editing.eventTitleKo ?? `이벤트 #${editing.eventId}` });
    }
    return opts;
  }, [events, editing]);

  const touch = (key?: ErrorKey) => {
    if (key) setErrors((p) => (p[key] ? { ...p, [key]: undefined } : p));
    setApiError('');
  };

  const validate = () => {
    const e: Partial<Record<ErrorKey, string>> = {};
    if (!titleKo.trim()) e.titleKo = '한국어 제목을 입력해 주세요.';
    if (!bodyKo.trim()) e.bodyKo = '한국어 내용을 입력해 주세요.';
    if (sendMode === 'schedule') {
      if (!sendAt) e.sendAt = '예약 발송 시각을 골라 주세요.';
      else if (sendAt <= nowInputDateTime()) e.sendAt = '예약 시각은 지금보다 뒤여야 합니다. 바로 보내려면 "지금"을 고르세요.';
    }
    return e;
  };

  const handleSubmit = async (ev?: FormEvent) => {
    ev?.preventDefault();
    if (isSaving) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      if (next.titleKo || next.bodyKo) setLang('ko');
      return;
    }

    const body: WitsNotificationPayload = {
      titleKo: titleKo.trim(),
      titleEn: blankToNull(titleEn),
      bodyKo: bodyKo.trim(),
      bodyEn: blankToNull(bodyEn),
      eventId: eventId === NO_EVENT ? null : Number(eventId),
      isAd,
      // '지금'이면 sendAt 을 빼서 서버가 현재 시각으로 넣게 한다.
      ...(sendMode === 'schedule' ? { sendAt: toServerDateTime(sendAt) } : {}),
    };

    try {
      if (editing) {
        await updateAsync({ id: editing.id, body });
        onSuccess('알림을 수정했습니다.');
      } else {
        await createAsync(body);
        onSuccess(sendMode === 'now' ? '알림을 보냈습니다. 앱 알림함에 바로 보입니다.' : '알림을 예약했습니다.');
      }
    } catch (err) {
      setApiError(apiErrorMessage(err, '저장에 실패했습니다. 입력값을 확인해 주세요.'));
    }
  };

  const koError = !!(errors.titleKo || errors.bodyKo);

  return (
    <ModalContainer onClose={onClose} modalClassName={s.modalWide}>
      <ModalHeader title={isEdit ? '알림 수정' : '알림 등록'} onClose={onClose} />
      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.formBody}>
          <div className={s.section}>
            <div className={s.sectionHead}>
              <span className={s.sectionTitle}>내용</span>
              <div className={s.langTabs} role='tablist' aria-label='언어'>
                <button
                  type='button'
                  role='tab'
                  aria-selected={lang === 'ko'}
                  className={`${s.langTab} ${lang === 'ko' ? s.langTabActive : ''}`}
                  onClick={() => setLang('ko')}
                >
                  한국어
                  {koError ? <span className={s.langDot} /> : null}
                </button>
                <button
                  type='button'
                  role='tab'
                  aria-selected={lang === 'en'}
                  className={`${s.langTab} ${lang === 'en' ? s.langTabActive : ''}`}
                  onClick={() => setLang('en')}
                >
                  English
                </button>
              </div>
            </div>
            {lang === 'ko' ? (
              <>
                <InputField
                  label='제목'
                  required
                  maxLength={WITS_TITLE_MAX}
                  value={titleKo}
                  error={errors.titleKo}
                  onChange={(e) => {
                    setTitleKo(e.target.value);
                    touch('titleKo');
                  }}
                />
                <TextAreaField
                  label='내용'
                  required
                  rows={5}
                  maxLength={WITS_NOTIFICATION_BODY_MAX}
                  value={bodyKo}
                  error={errors.bodyKo}
                  onChange={(e) => {
                    setBodyKo(e.target.value);
                    touch('bodyKo');
                  }}
                />
              </>
            ) : (
              <>
                <InputField
                  label='Title'
                  maxLength={WITS_TITLE_MAX}
                  value={titleEn}
                  placeholder='비우면 앱 영어 화면에 한국어가 보입니다'
                  onChange={(e) => {
                    setTitleEn(e.target.value);
                    touch();
                  }}
                />
                <TextAreaField
                  label='Body'
                  rows={5}
                  maxLength={WITS_NOTIFICATION_BODY_MAX}
                  value={bodyEn}
                  onChange={(e) => {
                    setBodyEn(e.target.value);
                    touch();
                  }}
                />
              </>
            )}
            <span className={s.help}>영어는 선택입니다. 비어 있으면 앱 영어 화면에 한국어가 대신 보입니다.</span>
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>연결 이벤트</span>
            <SearchableSelect
              options={eventOptions}
              value={eventId}
              onChange={(v) => {
                setEventId(v);
                touch();
              }}
              placeholder={eventsPending ? '이벤트 불러오는 중…' : '연결 안 함'}
              minWidth='100%'
              aria-label='연결 이벤트'
            />
            <span className={s.help}>알림을 누르면 이 이벤트 상세로 이동합니다.</span>
          </div>

          <div className={s.field}>
            <span className={s.fieldLabel}>발송 시각</span>
            <div className={s.radioRow}>
              <button
                type='button'
                className={`${s.radioBtn} ${sendMode === 'now' ? s.radioBtnOn : ''}`}
                aria-pressed={sendMode === 'now'}
                onClick={() => {
                  setSendMode('now');
                  touch('sendAt');
                }}
              >
                지금
                <span className={s.radioSub}>저장하면 바로 알림함에 보입니다</span>
              </button>
              <button
                type='button'
                className={`${s.radioBtn} ${sendMode === 'schedule' ? s.radioBtnOn : ''}`}
                aria-pressed={sendMode === 'schedule'}
                onClick={() => {
                  setSendMode('schedule');
                  touch('sendAt');
                }}
              >
                예약
                <span className={s.radioSub}>정한 시각부터 알림함에 보입니다</span>
              </button>
            </div>
            {sendMode === 'schedule' ? (
              <InputField
                label='예약 시각'
                required
                type='datetime-local'
                min={nowInputDateTime()}
                value={sendAt}
                error={errors.sendAt}
                onChange={(e) => {
                  setSendAt(e.target.value);
                  touch('sendAt');
                }}
              />
            ) : null}
          </div>

          <div className={s.field}>
            <label className={s.check}>
              <input
                type='checkbox'
                checked={isAd}
                onChange={(e) => {
                  setIsAd(e.target.checked);
                  touch();
                }}
              />
              광고성 정보
            </label>
            <span className={s.help}>광고·홍보 목적이면 체크 — 앞으로 푸시 발송 시 수신 동의·야간 제한이 적용됩니다</span>
          </div>

          {apiError ? (
            <p className={s.apiError} role='alert'>
              {apiError}
            </p>
          ) : null}
        </div>
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          cancelText='취소'
          submitText={isEdit ? '수정' : sendMode === 'now' ? '보내기' : '예약'}
          isLoading={isSaving}
        />
      </form>
    </ModalContainer>
  );
}
