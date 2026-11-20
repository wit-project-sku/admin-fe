import { useState } from 'react';
import { isAxiosError } from 'axios';
import { InfoField, ModalContainer, ModalFooter, ModalHeader, TextAreaField } from '@modals/ModalElements';
import { useCancelVerification } from '../../hooks/movie-share-api/useMovieShare';
import type { MovieShareVerification } from '../../hooks/movie-share-api/movieShareTypes';
import { apiErrorMessage } from '../../utils/apiErrorMessage';
import s from '../lotte/Lotte.module.css';
import { formatDateTime, formatShowtime } from '../lotte/lotteFormat';
import { CANCEL_REASON_MAX, MOVIE_SHARE_MESSAGES } from './movieShareConfig';

type Props = {
  verification: MovieShareVerification;
  onClose: () => void;
};

/**
 * 관람 인증 취소 — 되돌릴 수 없는 동작이라 사유를 받는다. 서버가 취소한 관리자·시각을 남긴다.
 * 아직 나눔에 쓰지 않은 필름이면 그 사용자의 필름이 1칸 줄고, 이미 쓴 필름이면 숫자는 그대로다.
 */
export function CancelVerificationModal({ verification: v, onClose }: Props) {
  const { cancelAsync, isCancelling } = useCancelVerification();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const trimmed = reason.trim();

  const submit = async () => {
    if (!trimmed) {
      setError('취소 사유를 입력하세요.');
      return;
    }
    setError('');
    try {
      const result = await cancelAsync({ id: v.verificationId, reason: trimmed });
      alert(
        result?.filmDeducted
          ? `인증을 취소했습니다. 그 사용자의 필름을 1칸 뺐습니다(현재 ${result.filmCount}칸).`
          : `인증을 취소했습니다. 이미 나눔에 쓰인 필름이라 필름 수는 그대로입니다${result ? `(현재 ${result.filmCount}칸)` : ''}.`,
      );
      onClose();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        alert(MOVIE_SHARE_MESSAGES.cancelConflict);
        onClose();
        return;
      }
      setError(apiErrorMessage(err, MOVIE_SHARE_MESSAGES.cancelFailed));
    }
  };

  return (
    <ModalContainer onClose={isCancelling ? undefined : onClose}>
      <ModalHeader title='관람 인증 취소' onClose={onClose} />
      <div className={s.body}>
        <div className={s.row}>
          <InfoField label='인증 시각' value={formatDateTime(v.verifiedAt)} />
          <InfoField label='사용자' value={v.maskedUser} />
        </div>
        <InfoField label='영화' value={v.movieTitle} />
        <div className={s.row}>
          <InfoField label='극장' value={`${v.cinemaName}${v.screenName ? ` · ${v.screenName}` : ''}`} />
          <InfoField label='상영 일시' value={formatShowtime(v.showStartAt, v.showEndAt)} />
        </div>
        <InfoField label='예매번호' value={v.maskedReservationNo} />

        <p className={s.warnBox}>
          {v.used
            ? '이 필름은 이미 나눔에 쓰였습니다. 인증은 취소되지만 필름 수와 나눔은 그대로입니다.'
            : '아직 나눔에 쓰지 않은 필름이라, 취소하면 그 사용자의 필름이 1칸 줄어듭니다.'}
          <br />
          취소한 예매번호는 다시 인증할 수 없고, 되돌릴 수 없습니다.
        </p>

        <TextAreaField
          label='취소 사유'
          required
          value={reason}
          maxLength={CANCEL_REASON_MAX}
          placeholder='예: 롯데 측 환불 통보 — 같은 예매로 중복 인증'
          onChange={(e) => setReason(e.target.value)}
          error={error}
          rows={3}
        />
      </div>
      <ModalFooter
        onCancel={onClose}
        onSubmit={submit}
        cancelText='닫기'
        submitText='인증 취소'
        isLoading={isCancelling}
        submitDisabled={!trimmed}
      />
    </ModalContainer>
  );
}
