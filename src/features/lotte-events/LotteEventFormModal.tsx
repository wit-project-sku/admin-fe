import { useMemo, useState } from 'react';
import { DropDownField, InfoField, InputField, ModalContainer, ModalFooter, ModalHeader } from '@modals/ModalElements';
import { useLotteEventMutations } from '../../hooks/lotte-event-api/useLotteEvents';
import type { LotteEventDto, LotteEventKind, LotteEventRequest } from '../../hooks/lotte-event-api/lotteEventTypes';
import { apiErrorMessage } from '../../utils/apiErrorMessage';
import s from '../lotte/Lotte.module.css';
import { LOTTE_BRANCHES, branchLabel, type LotteBranch, type LotteBranchCode } from '../lotte/lotteBranches';
import { ymd } from '../lotte/lotteFormat';
import {
  LOTTE_BUILDINGS,
  LOTTE_EVENT_KINDS,
  LOTTE_EVENT_MESSAGES,
  LOTTE_EVENT_TITLE_MAX,
  kioskWhenLine,
} from './lotteEventConfig';

type Props = {
  /** null = 새로 등록 */
  event: LotteEventDto | null;
  branches: LotteBranch[];
  /** 등록 창의 지점 기본값 — 목록에서 보고 있던 지점 */
  defaultBranch: LotteBranchCode | '';
  onClose: () => void;
};

type Form = {
  branch: LotteBranchCode | '';
  building: string;
  kind: LotteEventKind | '';
  title: string;
  startDate: string;
  endDate: string;
  timeText: string;
  place: string;
};

const emptyForm = (branch: LotteBranchCode | ''): Form => {
  const today = ymd(new Date());
  const buildings = branch ? LOTTE_BUILDINGS[branch] : [];
  return {
    branch,
    building: buildings.length === 1 ? buildings[0]! : '',
    kind: '',
    title: '',
    startDate: today,
    endDate: today,
    timeText: '',
    place: '',
  };
};

/** 건물 이벤트 등록·수정. 아래에 키오스크에 나갈 한 줄을 미리 보여 준다. */
export function LotteEventFormModal({ event, branches, defaultBranch, onClose }: Props) {
  const { saveAsync, isSaving } = useLotteEventMutations();
  const byKioskId = useMemo(() => new Map(branches.map((b) => [b.kioskId, b.code])), [branches]);

  const [form, setForm] = useState<Form>(() =>
    event
      ? {
          branch: byKioskId.get(event.kioskId) ?? '',
          building: event.building,
          kind: event.kind,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          timeText: event.timeText ?? '',
          place: event.place ?? '',
        }
      : emptyForm(defaultBranch),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [apiError, setApiError] = useState('');

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const changeBranch = (code: LotteBranchCode | '') => {
    const buildings = code ? LOTTE_BUILDINGS[code] : [];
    setForm((f) => ({
      ...f,
      branch: code,
      // 건물이 하나뿐인 지점은 저절로 고르고, 다른 지점으로 바꾸면 맞지 않는 건물은 비운다.
      building: buildings.length === 1 ? buildings[0]! : buildings.includes(f.building) ? f.building : '',
    }));
  };

  const branchOptions = LOTTE_BRANCHES.map((b) => {
    const kioskId = branches.find((x) => x.code === b.code)?.kioskId;
    return { value: b.code, label: kioskId == null ? `${branchLabel(b)} (서버에 없음)` : branchLabel(b) };
  });
  const buildingOptions = (form.branch ? LOTTE_BUILDINGS[form.branch] : []).map((v) => ({ value: v, label: v }));
  const kioskId = form.branch ? (branches.find((b) => b.code === form.branch)?.kioskId ?? null) : null;

  const validate = (): Partial<Record<keyof Form, string>> => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.branch) e.branch = '지점을 고르세요.';
    else if (kioskId == null) e.branch = LOTTE_EVENT_MESSAGES.branchMissing(form.branch);
    if (!form.building) e.building = '건물을 고르세요.';
    if (!form.kind) e.kind = '종류를 고르세요.';
    if (!form.title.trim()) e.title = '제목을 입력하세요.';
    if (!form.startDate) e.startDate = '시작일을 고르세요.';
    if (!form.endDate) e.endDate = '종료일을 고르세요.';
    else if (form.startDate && form.endDate < form.startDate) e.endDate = '종료일이 시작일보다 빠릅니다.';
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0 || kioskId == null || !form.kind) return;
    const body: LotteEventRequest = {
      kioskId,
      building: form.building,
      kind: form.kind,
      title: form.title.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      timeText: form.timeText.trim() || null,
      place: form.place.trim() || null,
    };
    setApiError('');
    try {
      await saveAsync({ id: event?.id ?? null, body });
      onClose();
    } catch (err) {
      setApiError(apiErrorMessage(err, LOTTE_EVENT_MESSAGES.saveFailed));
    }
  };

  const preview = kioskWhenLine({ ...form, building: form.building || '건물' });

  return (
    <ModalContainer onClose={isSaving ? undefined : onClose}>
      <ModalHeader title={event ? '건물 이벤트 수정' : '건물 이벤트 등록'} onClose={onClose} />
      <div className={s.body}>
        <div className={s.row}>
          <DropDownField
            label='지점'
            required
            options={branchOptions}
            value={form.branch}
            error={errors.branch}
            onChange={(e) => changeBranch(e.target.value as LotteBranchCode | '')}
          />
          <DropDownField
            label='건물'
            required
            options={buildingOptions}
            value={form.building}
            error={errors.building}
            disabled={!form.branch}
            onChange={(e) => set('building', e.target.value)}
          />
        </div>
        <div className={s.row}>
          <DropDownField
            label='종류'
            required
            options={LOTTE_EVENT_KINDS}
            value={form.kind}
            error={errors.kind}
            onChange={(e) => set('kind', e.target.value as LotteEventKind | '')}
          />
          <InputField
            label='장소'
            placeholder='예: 1F 아트리움 · B1 팝업존'
            value={form.place}
            maxLength={30}
            onChange={(e) => set('place', e.target.value)}
          />
        </div>
        <InputField
          label='제목'
          required
          placeholder='예: 겨울 시즌 오픈 행사'
          value={form.title}
          maxLength={LOTTE_EVENT_TITLE_MAX}
          error={errors.title}
          onChange={(e) => set('title', e.target.value)}
        />
        <div className={s.row}>
          <InputField
            label='시작일'
            required
            type='date'
            value={form.startDate}
            error={errors.startDate}
            onChange={(e) => set('startDate', e.target.value)}
          />
          <InputField
            label='종료일'
            required
            type='date'
            value={form.endDate}
            min={form.startDate || undefined}
            error={errors.endDate}
            onChange={(e) => set('endDate', e.target.value)}
          />
        </div>
        <InputField
          label='시간 (선택)'
          placeholder='예: 18:00 · 매일 11:00, 15:00'
          value={form.timeText}
          maxLength={30}
          onChange={(e) => set('timeText', e.target.value)}
        />
        <InfoField label='키오스크에 나가는 모양' value={preview || '—'} />
        {apiError ? <p className={s.apiError}>{apiError}</p> : null}
      </div>
      <ModalFooter
        onCancel={onClose}
        onSubmit={submit}
        cancelText='취소'
        submitText={event ? '수정 완료' : '등록'}
        isLoading={isSaving}
      />
    </ModalContainer>
  );
}
