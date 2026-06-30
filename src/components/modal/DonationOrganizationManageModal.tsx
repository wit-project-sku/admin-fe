import { useEffect, useState, type FormEvent } from 'react';
import { DropDownField, InputField, ModalContainer, ModalFooter, ModalHeader } from './ModalElements';
import {
  useCreateDonationOrganization,
  useUpdateDonationOrganization,
  type DonationOrganization,
} from '../../hooks/donation-api/useDonationOrganizations';
import { DONATION_TYPE_OPTIONS } from '../../features/donations/donationListConfig';
import type { DonationTypeCode } from '../../hooks/donation-api/donationApiTypes';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  organization: DonationOrganization | null;
  onClose: () => void;
  onSuccess: () => void;
};

type FieldErrors = Partial<Record<'type' | 'name', string>>;

export default function DonationOrganizationManageModal({ open, mode, organization, onClose, onSuccess }: Props) {
  const isEdit = mode === 'edit';
  const { createOrganizationAsync, isPending: isCreating } = useCreateDonationOrganization();
  const { updateOrganizationAsync, isPending: isUpdating } = useUpdateDonationOrganization();

  const [type, setType] = useState<DonationTypeCode | ''>('');
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const isBusy = saving || isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (isEdit && organization) {
      setType(organization.type);
      setName(organization.name);
      setActive(organization.active);
    } else {
      setType('');
      setName('');
      setActive(true);
    }
    setErrors({});
  }, [open, isEdit, organization]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!type) nextErrors.type = '기부 종류를 선택해 주세요.';
    if (!name.trim()) nextErrors.name = '단체명을 입력해 주세요.';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const body = { type: type as DonationTypeCode, name: name.trim(), active };
      if (isEdit && organization) {
        await updateOrganizationAsync({ id: organization.id, body });
      } else {
        await createOrganizationAsync(body);
      }
      onSuccess();
    } catch (err) {
      // 백엔드 409(중복) 등은 메시지로 안내
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        '단체 저장에 실패했습니다. 입력값을 확인해 주세요.';
      setErrors({ name: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalContainer onClose={onClose}>
      <ModalHeader title={isEdit ? '기부 단체 수정' : '기부 단체 등록'} onClose={onClose} />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DropDownField
            label='기부 종류'
            required
            error={errors.type}
            options={[...DONATION_TYPE_OPTIONS]}
            value={type}
            onChange={(e) => {
              setErrors((prev) => ({ ...prev, type: undefined }));
              setType(e.target.value as DonationTypeCode | '');
            }}
          />
          <InputField
            label='단체명'
            required
            error={errors.name}
            placeholder='예: 세이브더칠드런 / OO초등학교'
            value={name}
            onChange={(e) => {
              setErrors((prev) => ({ ...prev, name: undefined }));
              setName(e.target.value);
            }}
          />
          <DropDownField
            label='상태'
            options={[
              { value: 'active', label: '활성' },
              { value: 'inactive', label: '비활성' },
            ]}
            value={active ? 'active' : 'inactive'}
            onChange={(e) => setActive(e.target.value === 'active')}
          />
        </div>
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          cancelText='취소'
          submitText={isEdit ? '수정하기' : '등록하기'}
          isLoading={isBusy}
        />
      </form>
    </ModalContainer>
  );
}
