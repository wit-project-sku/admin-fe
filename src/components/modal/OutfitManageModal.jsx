import { useEffect, useState } from 'react';
import m from './OutfitManageModal.module.css';
import shared from '@commons/shared.module.css';
import { getOutfitDetail, createOutfit, updateOutfit } from '@apis/outfitApi';
import { getCategories } from '@apis/categoryApi';
import { getKiosks } from '@apis/kioskApi';
import {
  DropDownField,
  ImageUploadField,
  InputField,
  ModalContainer,
  ModalFooter,
  ModalHeader,
  MultiSelectField,
  TextAreaField,
} from './ModalElements';

// 상태 옵션 데이터
const OUTFIT_STATUS_OPTIONS = [
  { value: 'ON_SALE', label: '판매중' },
  { value: 'SOLD_OUT', label: '품절' },
];

export default function OutfitManageModal({ open, mode, outfitId, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [kiosks, setKiosks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    subTitle: '',
    categoryId: '',
    price: '',
    stock: '',
    description: '',
    status: 'ON_SALE',
    kioskIds: [],
  });

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState([]);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!open) return;
    Promise.all([getCategories(), getKiosks()]).then(([cRes, kRes]) => {
      setCategories(cRes?.data ?? cRes ?? []);
      setKiosks(kRes?.data ?? kRes ?? []);
    });

    if (isEdit && outfitId) {
      // setLoading(true);
      // getOutfitDetail(outfitId)
      //   .then((res) => {
      //     const d = res?.data ?? res;
      //     setForm({ ...d });
      //     setPreviewUrl(d.imageUrls ?? []);
      //   })
      //   .finally(() => setLoading(false));

      // 테스트를 위해 임시 폼 유지
      setForm((prev) => ({ ...prev, kioskIds: [] }));
    } else {
      setForm({
        name: '',
        subTitle: '',
        categoryId: '',
        price: '',
        stock: '',
        description: '',
        status: 'ON_SALE',
        kioskIds: [],
      });
      setPreviewUrl([]);
      setImage([]);
    }
  }, [open, mode, outfitId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage([file]);
      setPreviewUrl([URL.createObjectURL(file)]); // 새 이미지로 미리보기 교체
    }
  };

  const handleDeleteImage = () => {
    setImage(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === 'create') await createOutfit(form, image);
      else await updateOutfit(outfitId, form, image);
      onSuccess?.();
    } catch {
      alert('실패');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <ModalContainer>
      <ModalHeader title={mode === 'create' ? '신규 의상 등록' : '의상 정보 수정'} onClose={onClose} />

      <form onSubmit={handleSubmit}>
        <div className={m.body}>
          <div className={m.mainFields}>
            <div className={m.gridRow}>
              <InputField
                label='의상 이름'
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <InputField
                label='부제목'
                value={form.subTitle}
                onChange={(e) => setForm({ ...form, subTitle: e.target.value })}
              />
            </div>
            <div className={m.gridRow}>
              {/** Dropdown 공용 컴포넌트로 수정 필요 */}
              <DropDownField
                label='카테고리'
                required
                options={categories}
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              />
              <DropDownField
                label='상태'
                options={OUTFIT_STATUS_OPTIONS}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              />
            </div>
            <MultiSelectField
              label='설치 키오스크 선택'
              items={kiosks}
              selectedIds={form.kioskIds || []} // undefined 방지
              onChange={(newIds) => setForm({ ...form, kioskIds: newIds })}
            />
          </div>
          <ImageUploadField
            label='의상 이미지 (1개)'
            previewUrls={previewUrl || []} // null 방지
            onUpload={handleFileChange}
            onDelete={handleDeleteImage}
            isEdit={true}
            maxCount={1}
          />
        </div>
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          isLoading={saving}
          submitText={mode === 'create' ? '의상 등록 완료' : '수정 완료'}
        />
      </form>
    </ModalContainer>
  );
}
