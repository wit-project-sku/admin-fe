// WITS 앱 이벤트 등록·수정 창.
//  · 글(제목·요약·본문)은 한국어 필수 + 영어 선택 — 한국어/English 전환 탭으로 한 칸씩 보여 준다.
//  · 앱 홈 배너 노출을 켜면 배너 이미지가 필요하다. 본문 이미지는 최대 5장(기존 유지분 → 새 이미지 순).
//  · 저장은 멀티파트 한 번(data JSON + 이미지) — 중간 상태가 남지 않게.
import { useEffect, useState, type FormEvent } from 'react';

import { InputField, ModalContainer, ModalFooter, ModalHeader, TextAreaField } from '@modals/ModalElements';
import { useWitsEvent, useWitsEventMutations } from '@/hooks/wits-api/useWitsEvents';
import {
  WITS_EVENT_CONTENT_IMAGE_MAX,
  WITS_IMAGE_MAX_BYTES,
  WITS_LINK_MAX,
  WITS_PARTICIPATION_LABEL,
  WITS_SUMMARY_MAX,
  WITS_TITLE_MAX,
  type WitsEventPayload,
  type WitsParticipationType,
} from '@/hooks/wits-api/witsTypes';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { MultiImageField, SingleImageField } from '../ImagePickers';
import { blankToNull, toInputDateTime, toServerDateTime } from '../witsFormat';
import s from '../Wits.module.css';

type Lang = 'ko' | 'en';

type FormState = {
  titleKo: string;
  titleEn: string;
  summaryKo: string;
  summaryEn: string;
  contentKo: string;
  contentEn: string;
  startAt: string;
  endAt: string;
  published: boolean;
  bannerVisible: boolean;
  participationType: WitsParticipationType;
  linkUrl: string;
};

type ErrorKey = 'titleKo' | 'contentKo' | 'startAt' | 'endAt' | 'banner' | 'contentImages' | 'linkUrl';

const EMPTY_FORM: FormState = {
  titleKo: '',
  titleEn: '',
  summaryKo: '',
  summaryEn: '',
  contentKo: '',
  contentEn: '',
  startAt: '',
  endAt: '',
  published: true,
  bannerVisible: false,
  participationType: 'APP_BUTTON',
  linkUrl: '',
};

const PARTICIPATION_OPTIONS: { value: WitsParticipationType; sub: string }[] = [
  { value: 'APP_BUTTON', sub: '앱에 "참여하기" 버튼이 보이고 참여 기록이 남습니다' },
  { value: 'NONE', sub: '버튼 없이 내용만 안내합니다' },
];

type Props = {
  mode: 'create' | 'edit';
  eventId: number | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  /** 수정 창에서 참여자 보기 */
  onShowParticipants?: (id: number, title: string) => void;
};

export function WitsEventFormModal({ mode, eventId, onClose, onSuccess, onShowParticipants }: Props) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [lang, setLang] = useState<Lang>('ko');
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [apiError, setApiError] = useState('');
  const [initialized, setInitialized] = useState(!isEdit);

  // 배너: 서버에 있던 것(지우면 null) + 새로 고른 파일
  const [initialBannerUrl, setInitialBannerUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  // 본문: 남길 기존 URL(순서 유지) + 새 파일(뒤에 붙음)
  const [keptUrls, setKeptUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const { event, isPending: eventPending, isError: eventError } = useWitsEvent(isEdit ? eventId : null);
  const { createAsync, updateAsync, isSaving } = useWitsEventMutations();

  useEffect(() => {
    if (!isEdit || initialized || !event) return;
    setForm({
      titleKo: event.titleKo ?? '',
      titleEn: event.titleEn ?? '',
      summaryKo: event.summaryKo ?? '',
      summaryEn: event.summaryEn ?? '',
      contentKo: event.contentKo ?? '',
      contentEn: event.contentEn ?? '',
      startAt: toInputDateTime(event.startAt),
      endAt: toInputDateTime(event.endAt),
      published: event.published ?? true,
      bannerVisible: event.bannerVisible ?? false,
      participationType: event.participationType ?? 'APP_BUTTON',
      linkUrl: event.linkUrl ?? '',
    });
    setInitialBannerUrl(event.bannerImageUrl ?? null);
    setBannerUrl(event.bannerImageUrl ?? null);
    setKeptUrls(Array.isArray(event.contentImageUrls) ? event.contentImageUrls : []);
    setInitialized(true);
  }, [isEdit, initialized, event]);

  const clearError = (key: ErrorKey) => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    setApiError('');
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K], errKey?: ErrorKey) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errKey) clearError(errKey);
    else setApiError('');
  };

  const hasBanner = !!bannerFile || !!bannerUrl;

  const validate = (): Partial<Record<ErrorKey, string>> => {
    const e: Partial<Record<ErrorKey, string>> = {};
    if (!form.titleKo.trim()) e.titleKo = '한국어 제목을 입력해 주세요.';
    if (!form.contentKo.trim()) e.contentKo = '한국어 본문을 입력해 주세요.';
    if (!form.startAt) e.startAt = '시작 일시를 골라 주세요.';
    if (!form.endAt) e.endAt = '종료 일시를 골라 주세요.';
    else if (form.startAt && form.endAt <= form.startAt) e.endAt = '종료 일시는 시작 일시보다 늦어야 합니다.';
    if (form.bannerVisible && !hasBanner) e.banner = '앱 홈 배너에 노출하려면 배너 이미지가 필요합니다.';
    if (keptUrls.length + newFiles.length > WITS_EVENT_CONTENT_IMAGE_MAX)
      e.contentImages = `본문 이미지는 최대 ${WITS_EVENT_CONTENT_IMAGE_MAX}장입니다.`;
    if (form.linkUrl.trim() && !/^https?:\/\//i.test(form.linkUrl.trim()))
      e.linkUrl = 'http:// 또는 https:// 로 시작하는 주소를 입력해 주세요.';
    return e;
  };

  const handleSubmit = async (ev?: FormEvent) => {
    ev?.preventDefault();
    if (isSaving) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      // 한국어 칸이 틀렸는데 English 탭을 보고 있으면 한국어로 돌린다.
      if (next.titleKo || next.contentKo) setLang('ko');
      return;
    }

    const payload: WitsEventPayload = {
      titleKo: form.titleKo.trim(),
      titleEn: blankToNull(form.titleEn),
      summaryKo: blankToNull(form.summaryKo),
      summaryEn: blankToNull(form.summaryEn),
      contentKo: form.contentKo.trim(),
      contentEn: blankToNull(form.contentEn),
      startAt: toServerDateTime(form.startAt),
      endAt: toServerDateTime(form.endAt),
      published: form.published,
      bannerVisible: form.bannerVisible,
      participationType: form.participationType,
      linkUrl: blankToNull(form.linkUrl),
    };

    try {
      if (isEdit && eventId != null) {
        await updateAsync({
          id: eventId,
          payload: {
            ...payload,
            keepContentImageUrls: keptUrls,
            removeBannerImage: initialBannerUrl != null && bannerUrl == null && !bannerFile,
          },
          bannerImage: bannerFile,
          contentImages: newFiles,
        });
        onSuccess('이벤트를 수정했습니다.');
      } else {
        await createAsync({ payload, bannerImage: bannerFile, contentImages: newFiles });
        onSuccess('이벤트를 등록했습니다.');
      }
    } catch (err) {
      setApiError(apiErrorMessage(err, '저장에 실패했습니다. 입력값을 확인해 주세요.'));
    }
  };

  const loading = isEdit && (eventPending || !initialized);
  const koError = !!(errors.titleKo || errors.contentKo);

  return (
    <ModalContainer onClose={onClose} modalClassName={s.modalWide}>
      <ModalHeader title={isEdit ? '이벤트 수정' : '이벤트 등록'} onClose={onClose} />
      <form onSubmit={handleSubmit} className={s.form}>
        {isEdit && eventError ? (
          <div className={s.loading}>이벤트를 불러오지 못했습니다.</div>
        ) : loading ? (
          <div className={s.loading}>불러오는 중...</div>
        ) : (
          <div className={s.formBody}>
            {isEdit && event && onShowParticipants ? (
              <div className={s.imageActions}>
                <span className={s.help}>참여자 {event.participantCount.toLocaleString('ko-KR')}명</span>
                <button
                  type='button'
                  className={s.smallBtn}
                  onClick={() => onShowParticipants(event.id, event.titleKo)}
                >
                  참여자 보기
                </button>
              </div>
            ) : null}

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
                    value={form.titleKo}
                    error={errors.titleKo}
                    placeholder='예: 인사동 스탬프 투어'
                    onChange={(e) => setField('titleKo', e.target.value, 'titleKo')}
                  />
                  <InputField
                    label='요약'
                    maxLength={WITS_SUMMARY_MAX}
                    value={form.summaryKo}
                    placeholder='목록에 보이는 한 줄 설명'
                    onChange={(e) => setField('summaryKo', e.target.value)}
                  />
                  <TextAreaField
                    label='본문'
                    required
                    rows={8}
                    value={form.contentKo}
                    error={errors.contentKo}
                    onChange={(e) => setField('contentKo', e.target.value, 'contentKo')}
                  />
                </>
              ) : (
                <>
                  <InputField
                    label='Title'
                    maxLength={WITS_TITLE_MAX}
                    value={form.titleEn}
                    placeholder='비우면 앱 영어 화면에 한국어가 보입니다'
                    onChange={(e) => setField('titleEn', e.target.value)}
                  />
                  <InputField
                    label='Summary'
                    maxLength={WITS_SUMMARY_MAX}
                    value={form.summaryEn}
                    onChange={(e) => setField('summaryEn', e.target.value)}
                  />
                  <TextAreaField
                    label='Content'
                    rows={8}
                    value={form.contentEn}
                    onChange={(e) => setField('contentEn', e.target.value)}
                  />
                </>
              )}
              <span className={s.help}>영어는 선택입니다. 비어 있으면 앱 영어 화면에 한국어가 대신 보입니다.</span>
            </div>

            <div className={s.row2}>
              <InputField
                label='시작 일시'
                required
                type='datetime-local'
                value={form.startAt}
                error={errors.startAt}
                onChange={(e) => setField('startAt', e.target.value, 'startAt')}
              />
              <InputField
                label='종료 일시'
                required
                type='datetime-local'
                min={form.startAt || undefined}
                value={form.endAt}
                error={errors.endAt}
                onChange={(e) => setField('endAt', e.target.value, 'endAt')}
              />
            </div>
            <span className={s.help} style={{ marginTop: -8 }}>
              시작 전 이벤트는 앱에 보이지 않습니다. 종료 일시까지 진행 중으로 봅니다.
            </span>

            <div className={s.field}>
              <span className={s.fieldLabel}>노출</span>
              <div className={s.checkRow}>
                <label className={s.check}>
                  <input
                    type='checkbox'
                    checked={form.published}
                    onChange={(e) => setField('published', e.target.checked)}
                  />
                  앱에 공개
                </label>
                <label className={s.check}>
                  <input
                    type='checkbox'
                    checked={form.bannerVisible}
                    onChange={(e) => setField('bannerVisible', e.target.checked, 'banner')}
                  />
                  앱 홈 배너 노출
                </label>
              </div>
              <span className={s.help}>공개를 끄면 임시 저장처럼 앱에서 숨겨집니다.</span>
            </div>

            <div className={s.field}>
              <span className={s.fieldLabel}>참여 방식</span>
              <div className={s.radioRow}>
                {PARTICIPATION_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type='button'
                    className={`${s.radioBtn} ${form.participationType === o.value ? s.radioBtnOn : ''}`}
                    aria-pressed={form.participationType === o.value}
                    onClick={() => setField('participationType', o.value)}
                  >
                    {WITS_PARTICIPATION_LABEL[o.value]}
                    <span className={s.radioSub}>{o.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <InputField
              label='외부 링크'
              maxLength={WITS_LINK_MAX}
              value={form.linkUrl}
              error={errors.linkUrl}
              placeholder='https://'
              onChange={(e) => setField('linkUrl', e.target.value, 'linkUrl')}
            />

            <SingleImageField
              label='배너 이미지'
              required={form.bannerVisible}
              error={errors.banner}
              existingUrl={bannerUrl}
              file={bannerFile}
              maxBytes={WITS_IMAGE_MAX_BYTES}
              hint='앱 홈 배너·이벤트 목록에 쓰입니다 · 최대 20MB'
              onPick={(f) => {
                setBannerFile(f);
                clearError('banner');
              }}
              onRemove={() => (bannerFile ? setBannerFile(null) : setBannerUrl(null))}
              onError={(msg) => setErrors((p) => ({ ...p, banner: msg }))}
            />

            <MultiImageField
              label='본문 이미지'
              error={errors.contentImages}
              keptUrls={keptUrls}
              files={newFiles}
              max={WITS_EVENT_CONTENT_IMAGE_MAX}
              maxBytes={WITS_IMAGE_MAX_BYTES}
              onRemoveKept={(url) => {
                setKeptUrls((prev) => prev.filter((u) => u !== url));
                clearError('contentImages');
              }}
              onAddFiles={(files) => {
                setNewFiles((prev) => [...prev, ...files]);
                clearError('contentImages');
              }}
              onRemoveFile={(i) => {
                setNewFiles((prev) => prev.filter((_, x) => x !== i));
                clearError('contentImages');
              }}
              onError={(msg) => setErrors((p) => ({ ...p, contentImages: msg }))}
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
          submitText={isEdit ? '수정' : '등록'}
          isLoading={isSaving}
          submitDisabled={loading || (isEdit && eventError)}
        />
      </form>
    </ModalContainer>
  );
}
