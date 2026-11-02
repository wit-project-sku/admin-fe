import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import {
  DropDownField,
  ImageUploadField,
  InputField,
  ModalContainer,
  ModalFooter,
  ModalHeader,
  TextAreaField,
  type SelectOption,
} from './ModalElements';
import s from '../../features/installations/Installations.module.css';
import { isTestKiosk, useGetKiosks } from '../../hooks/useGetKiosks';
import { useInstallation, useInstallationMutations } from '../../hooks/installation-api/useInstallations';
import type { InstallationPayload } from '../../hooks/installation-api/installationTypes';
import {
  INSTALLATION_ADDRESS_MAX,
  INSTALLATION_CLIENT_MAX,
  INSTALLATION_DETAIL_MAX,
  INSTALLATION_IMAGE_MAX_BYTES,
  INSTALLATION_MANAGER_MAX,
  INSTALLATION_MEMO_MAX,
  INSTALLATION_MESSAGES,
  INSTALLATION_PHONE_MAX,
  INSTALLATION_SITE_MAX,
  isValidPhone,
} from '../../features/installations/installationConfig';

type InstallationManageModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  installationId: number | null;
  onClose: () => void;
  onSuccess: () => void;
};

type FormState = {
  kioskId: string;
  installedAt: string;
  address: string;
  siteName: string;
  clientName: string;
  managerName: string;
  managerPhone: string;
  detail: string;
  memo: string;
};

type FieldKey = keyof FormState;
type FieldErrors = Partial<Record<FieldKey | 'image', string>>;

const EMPTY_FORM: FormState = {
  kioskId: '',
  installedAt: '',
  address: '',
  siteName: '',
  clientName: '',
  managerName: '',
  managerPhone: '',
  detail: '',
  memo: '',
};

/** 서버 거절 메시지를 보여 준다. 404·413 은 서버 문구가 일반적이라 원인을 직접 알린다. */
function serverMessage(err: unknown): string {
  if (isAxiosError(err)) {
    if (err.response?.status === 404) return INSTALLATION_MESSAGES.saveNotFound;
    if (err.response?.status === 413) return INSTALLATION_MESSAGES.imageTooLarge;
    const body = err.response?.data as { message?: unknown } | string | undefined;
    if (typeof body === 'string' && body.trim()) return body;
    const msg = body && typeof body === 'object' ? body.message : undefined;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return INSTALLATION_MESSAGES.saveFailed;
}

function validate(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (!f.kioskId) e.kioskId = '키오스크를 골라 주세요.';
  if (!f.installedAt) e.installedAt = '설치일을 골라 주세요.';
  if (!f.address.trim()) e.address = '설치 주소를 입력해 주세요.';
  if (!f.clientName.trim()) e.clientName = '클라이언트 이름을 입력해 주세요.';
  const phone = f.managerPhone.trim();
  if (phone && !isValidPhone(phone)) e.managerPhone = '연락처는 숫자와 하이픈 7~20자로 입력해 주세요.';
  return e;
}

/**
 * 설치 정보 등록·수정 창. 화면에서 새로 올리는 사진은 한 장이다.
 * API 는 최대 10장이라 다른 경로로 들어온 사진이 여러 장일 수 있어, 기존 사진은 모두 보여 주고
 * 지운 것만 빼고 `imageUrls` 로 돌려보낸다(보이지 않는 사진이 저장 때 지워지지 않게).
 */
export default function InstallationManageModal({
  open,
  mode,
  installationId,
  onClose,
  onSuccess,
}: InstallationManageModalProps) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [keptImageUrls, setKeptImageUrls] = useState<string[]>([]);
  const [newImage, setNewImage] = useState<{ url: string; file: File } | null>(null);

  const { data: kiosksData } = useGetKiosks();
  const { installation, isPending, isError, isFetching } = useInstallation(isEdit ? installationId : null);
  const { createAsync, updateAsync, isSaving } = useInstallationMutations();

  const kioskOptions = useMemo<SelectOption[]>(() => {
    const kiosks = Array.isArray(kiosksData) ? kiosksData : [];
    return (
      kiosks
        // 기존 설치 건의 키오스크는 테스트 단말이어도 수정 창에서 값이 사라지지 않게 남긴다.
        .filter((k) => !isTestKiosk(k.name) || String(k.id) === form.kioskId)
        .map((k) => ({ value: String(k.id), label: k.name }))
    );
  }, [kiosksData, form.kioskId]);

  // 수정: 서버 값으로 채운다. PUT 은 칸과 사진을 통째로 덮어쓰므로 캐시가 아닌 최신 값을 받은 뒤에 채운다.
  useEffect(() => {
    if (!open || !isEdit || initialized || !installation || isFetching || isError) return;
    setForm({
      kioskId: String(installation.kioskId),
      installedAt: installation.installedAt,
      address: installation.address,
      siteName: installation.siteName ?? '',
      clientName: installation.clientName,
      managerName: installation.managerName ?? '',
      managerPhone: installation.managerPhone ?? '',
      detail: installation.detail ?? '',
      memo: installation.memo ?? '',
    });
    setKeptImageUrls(installation.imageUrls ?? []);
    setInitialized(true);
  }, [open, isEdit, initialized, installation, isFetching, isError]);

  // 고른 사진의 미리보기 URL 은 사진 삭제·창 닫기 때 해제한다.
  useEffect(() => {
    if (!newImage) return;
    return () => URL.revokeObjectURL(newImage.url);
  }, [newImage]);

  const setField = (key: FieldKey, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setApiError('');
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: INSTALLATION_MESSAGES.imageInvalid }));
      return;
    }
    if (file.size > INSTALLATION_IMAGE_MAX_BYTES) {
      setErrors((prev) => ({ ...prev, image: INSTALLATION_MESSAGES.imageTooLarge }));
      return;
    }
    setErrors((prev) => ({ ...prev, image: undefined }));
    setNewImage({ url: URL.createObjectURL(file), file });
  };

  const handleImageDelete = (url: string | undefined) => {
    if (newImage?.url === url) setNewImage(null);
    else setKeptImageUrls((urls) => urls.filter((u) => u !== url));
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (isSaving) return;
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const data: InstallationPayload = {
      kioskId: Number(form.kioskId),
      installedAt: form.installedAt,
      address: form.address.trim(),
      siteName: form.siteName.trim() || null,
      clientName: form.clientName.trim(),
      managerName: form.managerName.trim() || null,
      managerPhone: form.managerPhone.trim() || null,
      detail: form.detail.trim() || null,
      memo: form.memo.trim() || null,
    };
    const images = newImage ? [newImage.file] : [];

    try {
      if (isEdit && installationId != null) {
        await updateAsync({ id: installationId, data: { ...data, imageUrls: keptImageUrls }, images });
      } else {
        await createAsync({ data, images });
      }
      onSuccess();
    } catch (err) {
      setApiError(serverMessage(err));
    }
  };

  if (!open) return null;

  const loadFailed = isEdit && isError && !initialized;
  const loadingEdit = isEdit && (isPending || !initialized);
  const previewUrls = newImage ? [...keptImageUrls, newImage.url] : keptImageUrls;

  return (
    <ModalContainer onClose={onClose}>
      <ModalHeader title={isEdit ? '설치 정보 수정' : '설치 등록'} onClose={onClose} />
      <form onSubmit={handleSubmit} className={s.form}>
        {loadFailed ? (
          <div className={s.loading}>{INSTALLATION_MESSAGES.detailLoadError}</div>
        ) : loadingEdit ? (
          <div className={s.loading}>불러오는 중...</div>
        ) : (
          <div className={s.body}>
            <ImageUploadField
              label='설치 사진'
              isEdit
              maxCount={1}
              previewUrls={previewUrls}
              onUpload={handleImageChange}
              onDelete={handleImageDelete}
              error={errors.image}
            />
            <div className={s.row}>
              <DropDownField
                label='키오스크'
                required
                options={kioskOptions}
                value={form.kioskId}
                error={errors.kioskId}
                onChange={(e) => setField('kioskId', e.target.value)}
              />
              <InputField
                label='설치일'
                required
                type='date'
                value={form.installedAt}
                error={errors.installedAt}
                onChange={(e) => setField('installedAt', e.target.value)}
              />
            </div>
            <InputField
              label='클라이언트'
              required
              maxLength={INSTALLATION_CLIENT_MAX}
              placeholder='예: 종로구청 문화관광과'
              value={form.clientName}
              error={errors.clientName}
              onChange={(e) => setField('clientName', e.target.value)}
            />
            <InputField
              label='설치 주소'
              required
              maxLength={INSTALLATION_ADDRESS_MAX}
              placeholder='예: 서울 종로구 인사동길 12'
              value={form.address}
              error={errors.address}
              onChange={(e) => setField('address', e.target.value)}
            />
            <InputField
              label='설치 지점'
              maxLength={INSTALLATION_SITE_MAX}
              placeholder='예: 남인사마당 입구 왼쪽 화단 앞'
              value={form.siteName}
              onChange={(e) => setField('siteName', e.target.value)}
            />
            <div className={s.row}>
              <InputField
                label='담당자 이름'
                maxLength={INSTALLATION_MANAGER_MAX}
                placeholder='예: 김담당'
                value={form.managerName}
                onChange={(e) => setField('managerName', e.target.value)}
              />
              <InputField
                label='담당자 연락처'
                type='tel'
                maxLength={INSTALLATION_PHONE_MAX}
                placeholder='예: 02-1234-5678'
                value={form.managerPhone}
                error={errors.managerPhone}
                onChange={(e) => setField('managerPhone', e.target.value)}
              />
            </div>
            <TextAreaField
              label='상세 내용'
              maxLength={INSTALLATION_DETAIL_MAX}
              placeholder='예: 2026년 5월부터 1년 무상 설치, 전기는 구청 부담'
              value={form.detail}
              onChange={(e) => setField('detail', e.target.value)}
            />
            <TextAreaField
              label='관리 메모'
              maxLength={INSTALLATION_MEMO_MAX}
              placeholder='예: 겨울철 오후 5시 이후 일몰로 화면이 어두움'
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
