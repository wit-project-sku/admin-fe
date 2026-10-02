import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import {
  DropDownField,
  InputField,
  ModalContainer,
  ModalFooter,
  ModalHeader,
  TextAreaField,
  type SelectOption,
} from './ModalElements';
import s from './OnsiteEventManageModal.module.css';
import { useGetKiosks, type AdminKioskDto } from '../../hooks/useGetKiosks';
import {
  useOnsiteEvent,
  useOnsiteEventList,
  useOnsiteEventMutations,
} from '../../hooks/onsite-event-api/useOnsiteEvents';
import type { OnsiteEventDto, OnsiteEventPayload } from '../../hooks/onsite-event-api/onsiteEventTypes';
import { kioskLabel } from '../../utils/kioskHelpers';
import {
  isPermanentKioskName,
  ONSITE_EVENT_MEMO_MAX,
  ONSITE_EVENT_MESSAGES,
  ONSITE_EVENT_NAME_MAX,
  ONSITE_EVENT_VENUE_MAX,
} from '../../features/onsite-events/onsiteEventConfig';

type OnsiteEventManageModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  eventId: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

type FormState = {
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  contentKioskId: string;
  statsKioskId: string;
  memo: string;
};

type FieldKey = keyof FormState;

const EMPTY_FORM: FormState = {
  name: '',
  venue: '',
  startDate: '',
  endDate: '',
  contentKioskId: '',
  statsKioskId: '',
  memo: '',
};

/** 서버 거절(409 겹침·400 검증) 메시지를 그대로 보여 준다. */
function serverMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as { message?: unknown } | string | undefined;
    if (typeof body === 'string' && body.trim()) return body;
    const msg = body && typeof body === 'object' ? body.message : undefined;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return ONSITE_EVENT_MESSAGES.saveFailed;
}

function validate(f: FormState): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {};
  if (!f.name.trim()) e.name = '행사명을 입력해 주세요.';
  if (!f.venue.trim()) e.venue = '행사 지점을 입력해 주세요.';
  if (!f.startDate) e.startDate = '시작일을 골라 주세요.';
  if (!f.endDate) e.endDate = '종료일을 골라 주세요.';
  else if (f.startDate && f.endDate < f.startDate) e.endDate = '종료일이 시작일보다 빠릅니다.';
  if (!f.contentKioskId) e.contentKioskId = '사용 콘텐츠를 골라 주세요.';
  if (!f.statsKioskId) e.statsKioskId = '촬영 기기를 골라 주세요.';
  return e;
}

/**
 * 행사 등록·수정 창.
 * - 사용 콘텐츠 = 상설 키오스크(`#W…`), 라벨은 '=' 뒤 지점명. 표시용이며 집계에 쓰지 않는다.
 * - 촬영 기기 = 통계를 모을 기기(모든 키오스크, 이름 그대로). `#W` 가 아닌 행사 기기를 앞에 둔다.
 *   신규 등록 기본값은 가장 최근 등록한 행사의 촬영 기기 → 없으면 `#W` 가 아닌 첫 기기.
 */
export default function OnsiteEventManageModal({ open, mode, eventId, onClose, onSuccess }: OnsiteEventManageModalProps) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [apiError, setApiError] = useState('');
  const [initialized, setInitialized] = useState(false);

  const { data: kiosksData, isLoading: kiosksLoading } = useGetKiosks();
  const kiosks = useMemo<AdminKioskDto[]>(() => (Array.isArray(kiosksData) ? kiosksData : []), [kiosksData]);

  const { event, isPending: eventPending } = useOnsiteEvent(isEdit ? eventId : null);
  // 신규 기본 촬영 기기 — 최근 행사 몇 건 중 가장 나중에 등록된(id 가 큰) 것의 기기.
  const { rows: recentRows, isPending: recentPending } = useOnsiteEventList(
    { pageNum: 1, pageSize: 20 },
    { enabled: open && !isEdit },
  );

  const { createAsync, updateAsync, isSaving } = useOnsiteEventMutations();

  const contentOptions = useMemo<SelectOption[]>(() => {
    const opts = kiosks
      .filter((k) => isPermanentKioskName(k.name))
      .map((k) => ({ value: String(k.id), label: kioskLabel(k.name) }));
    // 기존 행사의 콘텐츠 기기가 `#W` 가 아니게 바뀌었어도 수정 창에서 값이 사라지지 않게 남긴다.
    if (form.contentKioskId && !opts.some((o) => o.value === form.contentKioskId)) {
      const cur = kiosks.find((k) => String(k.id) === form.contentKioskId);
      if (cur) opts.push({ value: String(cur.id), label: kioskLabel(cur.name) });
    }
    return opts;
  }, [kiosks, form.contentKioskId]);

  const statsOptions = useMemo<SelectOption[]>(() => {
    const events = kiosks.filter((k) => !isPermanentKioskName(k.name));
    const permanent = kiosks.filter((k) => isPermanentKioskName(k.name));
    return [...events, ...permanent].map((k) => ({ value: String(k.id), label: k.name }));
  }, [kiosks]);

  // 수정: 서버 값으로 채운다.
  useEffect(() => {
    if (!open || !isEdit || initialized || !event) return;
    setForm({
      name: event.name ?? '',
      venue: event.venue ?? '',
      startDate: event.startDate ?? '',
      endDate: event.endDate ?? '',
      contentKioskId: String(event.contentKioskId ?? ''),
      statsKioskId: String(event.statsKioskId ?? ''),
      memo: event.memo ?? '',
    });
    setInitialized(true);
  }, [open, isEdit, initialized, event]);

  // 신규: 촬영 기기 기본값(최근 행사 목록과 키오스크 목록이 모두 온 뒤 한 번만).
  useEffect(() => {
    if (!open || isEdit || initialized || kiosksLoading || recentPending) return;
    const latest = recentRows.reduce<OnsiteEventDto | null>((acc, r) => (acc == null || r.id > acc.id ? r : acc), null);
    const fromLatest =
      latest && kiosks.some((k) => k.id === latest.statsKioskId) ? String(latest.statsKioskId) : '';
    const firstEventKiosk = kiosks.find((k) => !isPermanentKioskName(k.name));
    setForm((f) => ({ ...f, statsKioskId: fromLatest || (firstEventKiosk ? String(firstEventKiosk.id) : '') }));
    setInitialized(true);
  }, [open, isEdit, initialized, kiosksLoading, recentPending, recentRows, kiosks]);

  const setField = (key: FieldKey, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setApiError('');
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (isSaving) return;
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const body: OnsiteEventPayload = {
      name: form.name.trim(),
      venue: form.venue.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      contentKioskId: Number(form.contentKioskId),
      statsKioskId: Number(form.statsKioskId),
      memo: form.memo.trim() || null,
    };

    try {
      if (isEdit && eventId != null) await updateAsync({ id: eventId, body });
      else await createAsync(body);
      onSuccess();
    } catch (err) {
      // 겹침(409)·검증(400)은 창을 닫지 않고 안에서 알린다.
      setApiError(serverMessage(err));
    }
  };

  if (!open) return null;

  const loadingEdit = isEdit && eventPending;

  return (
    <ModalContainer onClose={onClose}>
      <ModalHeader title={isEdit ? '행사 수정' : '행사 등록'} onClose={onClose} />
      <form onSubmit={handleSubmit} className={s.form}>
        {loadingEdit ? (
          <div className={s.loading}>불러오는 중...</div>
        ) : (
          <div className={s.body}>
            <InputField
              label='행사명'
              required
              maxLength={ONSITE_EVENT_NAME_MAX}
              placeholder='예: 가을 한복 체험 박람회'
              value={form.name}
              error={errors.name}
              onChange={(e) => setField('name', e.target.value)}
            />
            <InputField
              label='행사 지점'
              required
              maxLength={ONSITE_EVENT_VENUE_MAX}
              placeholder='예: 코엑스 B홀'
              value={form.venue}
              error={errors.venue}
              onChange={(e) => setField('venue', e.target.value)}
            />
            <div className={s.row}>
              <InputField
                label='시작일'
                required
                type='date'
                value={form.startDate}
                error={errors.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
              />
              <InputField
                label='종료일'
                required
                type='date'
                min={form.startDate || undefined}
                value={form.endDate}
                error={errors.endDate}
                onChange={(e) => setField('endDate', e.target.value)}
              />
            </div>
            <div className={s.row}>
              <div className={s.col}>
                <DropDownField
                  label='사용 콘텐츠'
                  required
                  options={contentOptions}
                  value={form.contentKioskId}
                  error={errors.contentKioskId}
                  onChange={(e) => setField('contentKioskId', e.target.value)}
                />
                <span className={s.help}>행사 기기에서 띄운 지점 콘텐츠</span>
              </div>
              <div className={s.col}>
                <DropDownField
                  label='촬영 기기'
                  required
                  options={statsOptions}
                  value={form.statsKioskId}
                  error={errors.statsKioskId}
                  onChange={(e) => setField('statsKioskId', e.target.value)}
                />
                <span className={s.help}>통계를 모을 기기</span>
              </div>
            </div>
            <TextAreaField
              label='메모'
              maxLength={ONSITE_EVENT_MEMO_MAX}
              placeholder='예: 운영 2명'
              value={form.memo}
              onChange={(e) => setField('memo', e.target.value)}
            />
            {apiError ? (
              <p className={s.apiError} role='alert'>
                {apiError}
              </p>
            ) : null}
          </div>
        )}
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          cancelText='취소'
          submitText='저장'
          isLoading={isSaving}
          submitDisabled={loadingEdit}
        />
      </form>
    </ModalContainer>
  );
}
