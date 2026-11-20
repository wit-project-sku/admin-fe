import { useState } from 'react';
import { InfoField, ModalContainer, ModalFooter, ModalHeader, TextAreaField } from '@modals/ModalElements';
import { useLotteEventMutations } from '../../hooks/lotte-event-api/useLotteEvents';
import type { LotteEventDto } from '../../hooks/lotte-event-api/lotteEventTypes';
import { apiErrorMessage } from '../../utils/apiErrorMessage';
import s from '../lotte/Lotte.module.css';
import { LOTTE_EVENT_KIND_LABEL, LOTTE_EVENT_MESSAGES, LOTTE_EVENT_REASON_MAX, kioskWhenLine } from './lotteEventConfig';

type Props = {
  event: LotteEventDto;
  branchCode: string;
  onClose: () => void;
};

/** 건물 이벤트 삭제 — 되돌릴 수 없어 확인 창에서 사유를 받는다(기능 가이드 2절). */
export function LotteEventDeleteModal({ event, branchCode, onClose }: Props) {
  const { removeAsync, isRemoving } = useLotteEventMutations();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const trimmed = reason.trim();

  const submit = async () => {
    if (!trimmed) {
      setError('삭제 사유를 입력하세요.');
      return;
    }
    setError('');
    try {
      await removeAsync({ id: event.id, reason: trimmed });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, LOTTE_EVENT_MESSAGES.deleteFailed));
    }
  };

  return (
    <ModalContainer onClose={isRemoving ? undefined : onClose}>
      <ModalHeader title='건물 이벤트 삭제' onClose={onClose} />
      <div className={s.body}>
        <div className={s.row}>
          <InfoField label='지점 · 건물' value={`${branchCode} · ${event.building}`} />
          <InfoField label='종류' value={LOTTE_EVENT_KIND_LABEL[event.kind] ?? event.kind} />
        </div>
        <InfoField label='제목' value={event.title} />
        <InfoField label='키오스크 표시' value={kioskWhenLine(event)} />
        <p className={s.warnBox}>삭제하면 키오스크 건물 안내에서 바로 빠지고, 되돌릴 수 없습니다.</p>
        <TextAreaField
          label='삭제 사유'
          required
          value={reason}
          maxLength={LOTTE_EVENT_REASON_MAX}
          placeholder='예: 행사 취소 — 롯데 측 요청'
          onChange={(e) => setReason(e.target.value)}
          error={error}
          rows={3}
        />
      </div>
      <ModalFooter
        onCancel={onClose}
        onSubmit={submit}
        cancelText='닫기'
        submitText='삭제'
        isLoading={isRemoving}
        submitDisabled={!trimmed}
      />
    </ModalContainer>
  );
}
