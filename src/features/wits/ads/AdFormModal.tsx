// 광고 등록·수정 창. 광고는 한국어만, 광고주는 광고마다 입력한다.
//  · 노출 위치: 키오스크(지점 선택 + 키오스크 이미지) / 앱(앱 이미지) — 하나 이상.
//  · 수정은 상세(GET /admin/ads/{id})로 연락처 원문·메모를 받아 채운다. 이미지를 고르면 교체, 위치를 끄면 서버가 그 이미지를 지운다.
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import {
  InputField,
  ModalContainer,
  ModalFooter,
  ModalHeader,
  MultiSelectField,
  TextAreaField,
  type MultiSelectItem,
} from '@modals/ModalElements';
import { useAd, useAdMutations } from '@/hooks/ad-api/useAds';
import {
  AD_IMAGE_MAX_BYTES,
  AD_LINK_MAX,
  AD_MEMO_MAX,
  AD_NAME_MAX,
  AD_PHONE_PATTERN,
  AD_TITLE_MAX,
  CONTENT_REGIONS,
  type AdPayload,
} from '@/hooks/ad-api/adTypes';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { SingleImageField } from '../ImagePickers';
import { blankToNull } from '../witsFormat';
import s from '../Wits.module.css';

type FormState = {
  advertiserName: string;
  advertiserPhone: string;
  title: string;
  startDate: string;
  endDate: string;
  showOnKiosk: boolean;
  showOnApp: boolean;
  regions: string[];
  linkUrl: string;
  paused: boolean;
  memo: string;
};

type ErrorKey =
  | 'advertiserName'
  | 'advertiserPhone'
  | 'title'
  | 'startDate'
  | 'endDate'
  | 'channel'
  | 'regions'
  | 'kioskImage'
  | 'appImage'
  | 'linkUrl';

const EMPTY_FORM: FormState = {
  advertiserName: '',
  advertiserPhone: '',
  title: '',
  startDate: '',
  endDate: '',
  showOnKiosk: false,
  showOnApp: false,
  regions: [],
  linkUrl: '',
  paused: false,
  memo: '',
};

const REGION_ITEMS: MultiSelectItem[] = CONTENT_REGIONS.map((r) => ({ id: r.value, name: r.label }));

type Props = {
  mode: 'create' | 'edit';
  adId: number | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export function AdFormModal({ mode, adId, onClose, onSuccess }: Props) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [apiError, setApiError] = useState('');
  const [initialized, setInitialized] = useState(!isEdit);
  const [kioskImageUrl, setKioskImageUrl] = useState<string | null>(null);
  const [appImageUrl, setAppImageUrl] = useState<string | null>(null);
  const [kioskFile, setKioskFile] = useState<File | null>(null);
  const [appFile, setAppFile] = useState<File | null>(null);

  const { ad, isPending: adPending, isError: adError } = useAd(isEdit ? adId : null);
  const { createAsync, updateAsync, isSaving } = useAdMutations();

  useEffect(() => {
    if (!isEdit || initialized || !ad) return;
    setForm({
      advertiserName: ad.advertiserName ?? '',
      advertiserPhone: ad.advertiserPhone ?? '',
      title: ad.title ?? '',
      startDate: (ad.startDate ?? '').slice(0, 10),
      endDate: (ad.endDate ?? '').slice(0, 10),
      showOnKiosk: !!ad.showOnKiosk,
      showOnApp: !!ad.showOnApp,
      regions: Array.isArray(ad.regions) ? ad.regions : [],
      linkUrl: ad.linkUrl ?? '',
      paused: !!ad.paused,
      memo: ad.memo ?? '',
    });
    setKioskImageUrl(ad.kioskImageUrl ?? null);
    setAppImageUrl(ad.appImageUrl ?? null);
    setInitialized(true);
  }, [isEdit, initialized, ad]);

  // 서버에 새 지점이 생겨 이 화면 목록에 없는 값이 저장돼 있어도 선택지에서 사라지지 않게 남긴다.
  const regionItems = useMemo<MultiSelectItem[]>(() => {
    const extra = form.regions.filter((r) => !REGION_ITEMS.some((i) => i.id === r)).map((r) => ({ id: r, name: r }));
    return [...REGION_ITEMS, ...extra];
  }, [form.regions]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K], errKey?: ErrorKey) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errKey) setErrors((p) => (p[errKey] ? { ...p, [errKey]: undefined } : p));
    setApiError('');
  };

  const validate = () => {
    const e: Partial<Record<ErrorKey, string>> = {};
    if (!form.advertiserName.trim()) e.advertiserName = '광고주 이름을 입력해 주세요.';
    const phone = form.advertiserPhone.trim();
    if (!phone) e.advertiserPhone = '광고주 연락처를 입력해 주세요.';
    else if (!AD_PHONE_PATTERN.test(phone)) e.advertiserPhone = '숫자와 하이픈(-)만 7~20자로 입력해 주세요.';
    if (!form.title.trim()) e.title = '광고 제목을 입력해 주세요.';
    if (!form.startDate) e.startDate = '시작일을 골라 주세요.';
    if (!form.endDate) e.endDate = '종료일을 골라 주세요.';
    else if (form.startDate && form.endDate < form.startDate) e.endDate = '종료일이 시작일보다 빠릅니다.';
    if (!form.showOnKiosk && !form.showOnApp) e.channel = '노출 위치를 하나 이상 골라 주세요.';
    if (form.showOnKiosk) {
      if (form.regions.length === 0) e.regions = '광고를 띄울 지점을 하나 이상 골라 주세요.';
      if (!kioskFile && !kioskImageUrl) e.kioskImage = '키오스크 이미지를 올려 주세요.';
    }
    if (form.showOnApp && !appFile && !appImageUrl) e.appImage = '앱 이미지를 올려 주세요.';
    if (form.linkUrl.trim() && !/^https?:\/\//i.test(form.linkUrl.trim()))
      e.linkUrl = 'http:// 또는 https:// 로 시작하는 주소를 입력해 주세요.';
    return e;
  };

  const handleSubmit = async (ev?: FormEvent) => {
    ev?.preventDefault();
    if (isSaving) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: AdPayload = {
      advertiserName: form.advertiserName.trim(),
      advertiserPhone: form.advertiserPhone.trim(),
      title: form.title.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      showOnKiosk: form.showOnKiosk,
      showOnApp: form.showOnApp,
      // 키오스크를 끄면 지점도 비운다(서버가 위치 이미지를 지우는 것과 맞춘다).
      regions: form.showOnKiosk ? form.regions : [],
      linkUrl: blankToNull(form.linkUrl),
      paused: form.paused,
      memo: blankToNull(form.memo),
    };
    // 꺼진 위치의 새 이미지는 보내지 않는다.
    const files = {
      kioskImage: form.showOnKiosk ? kioskFile : null,
      appImage: form.showOnApp ? appFile : null,
    };

    try {
      if (isEdit && adId != null) {
        await updateAsync({ id: adId, payload, ...files });
        onSuccess('광고를 수정했습니다.');
      } else {
        await createAsync({ payload, ...files });
        onSuccess('광고를 등록했습니다.');
      }
    } catch (err) {
      setApiError(apiErrorMessage(err, '저장에 실패했습니다. 입력값을 확인해 주세요.'));
    }
  };

  const loading = isEdit && (adPending || !initialized);

  return (
    <ModalContainer onClose={onClose} modalClassName={s.modalWide}>
      <ModalHeader title={isEdit ? '광고 수정' : '광고 등록'} onClose={onClose} />
      <form onSubmit={handleSubmit} className={s.form}>
        {isEdit && adError ? (
          <div className={s.loading}>광고를 불러오지 못했습니다.</div>
        ) : loading ? (
          <div className={s.loading}>불러오는 중...</div>
        ) : (
          <div className={s.formBody}>
            <div className={s.row2}>
              <InputField
                label='광고주 이름'
                required
                maxLength={AD_NAME_MAX}
                value={form.advertiserName}
                error={errors.advertiserName}
                onChange={(e) => setField('advertiserName', e.target.value, 'advertiserName')}
              />
              <InputField
                label='광고주 연락처'
                required
                type='tel'
                maxLength={20}
                placeholder='010-1234-5678'
                value={form.advertiserPhone}
                error={errors.advertiserPhone}
                onChange={(e) => setField('advertiserPhone', e.target.value, 'advertiserPhone')}
              />
            </div>

            <InputField
              label='광고 제목'
              required
              maxLength={AD_TITLE_MAX}
              placeholder='관리용 이름(앱·키오스크에는 보이지 않습니다)'
              value={form.title}
              error={errors.title}
              onChange={(e) => setField('title', e.target.value, 'title')}
            />

            <div className={s.row2}>
              <InputField
                label='시작일'
                required
                type='date'
                value={form.startDate}
                error={errors.startDate}
                onChange={(e) => setField('startDate', e.target.value, 'startDate')}
              />
              <InputField
                label='종료일'
                required
                type='date'
                min={form.startDate || undefined}
                value={form.endDate}
                error={errors.endDate}
                onChange={(e) => setField('endDate', e.target.value, 'endDate')}
              />
            </div>

            <div className={s.field}>
              <span className={s.fieldLabel}>
                노출 위치 <span className={s.required}>*</span>
              </span>
              <div className={s.checkRow}>
                <label className={s.check}>
                  <input
                    type='checkbox'
                    checked={form.showOnKiosk}
                    onChange={(e) => setField('showOnKiosk', e.target.checked, 'channel')}
                  />
                  키오스크
                </label>
                <label className={s.check}>
                  <input
                    type='checkbox'
                    checked={form.showOnApp}
                    onChange={(e) => setField('showOnApp', e.target.checked, 'channel')}
                  />
                  앱
                </label>
              </div>
              {errors.channel ? (
                <span className={s.fieldError} role='alert'>
                  {errors.channel}
                </span>
              ) : null}
              {isEdit ? <span className={s.help}>위치를 끄고 저장하면 그 위치의 이미지는 지워집니다.</span> : null}
            </div>

            {form.showOnKiosk ? (
              <MultiSelectField
                label='지점'
                required
                selectAllable
                items={regionItems}
                selectedIds={form.regions}
                error={errors.regions}
                onChange={(ids) => setField('regions', ids.map(String), 'regions')}
              />
            ) : null}

            {form.showOnKiosk || form.showOnApp ? (
              <>
                <div className={s.note}>키오스크와 앱은 배너 비율이 달라 위치마다 이미지를 따로 올립니다</div>
                <div className={s.row2}>
                  {form.showOnKiosk ? (
                    <SingleImageField
                      label='키오스크 이미지'
                      required
                      error={errors.kioskImage}
                      existingUrl={kioskImageUrl}
                      file={kioskFile}
                      maxBytes={AD_IMAGE_MAX_BYTES}
                      hint='최대 20MB'
                      onPick={(f) => {
                        setKioskFile(f);
                        setErrors((p) => ({ ...p, kioskImage: undefined }));
                      }}
                      onRemove={kioskFile ? () => setKioskFile(null) : undefined}
                      onError={(msg) => setErrors((p) => ({ ...p, kioskImage: msg }))}
                    />
                  ) : null}
                  {form.showOnApp ? (
                    <SingleImageField
                      label='앱 이미지'
                      required
                      error={errors.appImage}
                      existingUrl={appImageUrl}
                      file={appFile}
                      maxBytes={AD_IMAGE_MAX_BYTES}
                      hint='최대 20MB'
                      onPick={(f) => {
                        setAppFile(f);
                        setErrors((p) => ({ ...p, appImage: undefined }));
                      }}
                      onRemove={appFile ? () => setAppFile(null) : undefined}
                      onError={(msg) => setErrors((p) => ({ ...p, appImage: msg }))}
                    />
                  ) : null}
                </div>
              </>
            ) : null}

            <InputField
              label='연결 링크'
              maxLength={AD_LINK_MAX}
              placeholder='https://'
              value={form.linkUrl}
              error={errors.linkUrl}
              onChange={(e) => setField('linkUrl', e.target.value, 'linkUrl')}
            />

            <div className={s.field}>
              <label className={s.check}>
                <input type='checkbox' checked={form.paused} onChange={(e) => setField('paused', e.target.checked)} />
                일시 중지
              </label>
              <span className={s.help}>켜 두면 기간 안이어도 어디에도 노출하지 않습니다.</span>
            </div>

            <TextAreaField
              label='메모'
              maxLength={AD_MEMO_MAX}
              placeholder='예: 계약 담당 홍길동, 월 단위 연장'
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
          submitText={isEdit ? '수정' : '등록'}
          isLoading={isSaving}
          submitDisabled={loading || (isEdit && adError)}
        />
      </form>
    </ModalContainer>
  );
}
