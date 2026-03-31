import { useEffect, useState } from 'react';
import m from './OutfitManageModal.module.css';
import shared from '@commons/shared.module.css';
import { getOutfitDetail, createOutfit, updateOutfit } from '@apis/outfitApi';
import { getCategories } from '@apis/categoryApi';
import { getKiosks } from '@apis/kioskApi';

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
  const [previewUrl, setPreviewUrl] = useState(null);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!open) return;
    Promise.all([getCategories(), getKiosks()]).then(([cRes, kRes]) => {
      setCategories(cRes?.data ?? cRes ?? []);
      setKiosks(kRes?.data ?? kRes ?? []);
    });

    if (isEdit && outfitId) {
      setLoading(true);
      getOutfitDetail(outfitId)
        .then((res) => {
          const d = res?.data ?? res;
          setForm({ ...d });
          setPreviewUrl(d.imageUrls ?? []);
        })
        .finally(() => setLoading(false));
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
      if (mode === 'create') await createOutfit(form, images);
      else await updateOutfit(outfitId, form, images);
      onSuccess?.();
    } catch {
      alert('실패');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className={m.overlay} onClick={onClose}>
      <div className={`${m.modal} ${m.modalLg}`} onClick={(e) => e.stopPropagation()}>
        <div className={m.header}>
          <span className={m.title}>{mode === 'create' ? '신규 의상 등록' : '의상 정보 수정'}</span>
          <button className={m.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={m.body}>
            <div className={m.mainFields}>
              <div className={m.gridRow}>
                <div className={m.field}>
                  <label className={m.label}>
                    의상 이름 <span className={m.required}>*</span>
                  </label>
                  <input
                    required
                    className={m.input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className={m.field}>
                  <label className={m.label}>부제목</label>
                  <input
                    className={m.input}
                    value={form.subTitle}
                    onChange={(e) => setForm({ ...form, subTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className={m.gridRow}>
                <div className={m.field}>
                  <label className={m.label}>
                    카테고리 <span className={m.required}>*</span>
                  </label>
                  <select
                    required
                    className={m.select}
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  >
                    <option value=''>선택</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={m.field}>
                  <label className={m.label}>상태</label>
                  <select
                    className={m.select}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value='ON_SALE'>판매중</option>
                    <option value='SOLD_OUT'>품절</option>
                  </select>
                </div>
              </div>
              <div className={m.field}>
                <label className={m.label}>설치 키오스크 선택</label>
                <div className={m.kioskGrid}>
                  {kiosks.map((k) => (
                    <div
                      key={k.id}
                      className={`${m.kioskItem} ${form.kioskIds.includes(k.id) ? m.kioskActive : ''}`}
                      onClick={() => {
                        const ids = form.kioskIds.includes(k.id)
                          ? form.kioskIds.filter((i) => i !== k.id)
                          : [...form.kioskIds, k.id];
                        setForm({ ...form, kioskIds: ids });
                      }}
                    >
                      <div className={`${m.kioskCheck} ${form.kioskIds.includes(k.id) ? m.kioskChecked : ''}`} />
                      <span>{k.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={m.imageSection}>
              <label className={m.label}>이미지 업로드</label>
              <div className={m.imagesGrid}>
                {/* 2/3번 요청 반영: 등록된 이미지 미리보기 및 삭제 버튼 */}
                {previewUrl && (
                  <div className={m.imageThumbnail}>
                    <img src={previewUrl} className={m.previewImg} alt='의상 미리보기' />
                    {/* 3번 요청: 삭제 버튼 */}
                    <button type='button' className={m.deleteBtn} onClick={handleDeleteImage}>
                      ✕
                    </button>
                  </div>
                )}

                {/* 1번 요청: 이미지가 없을 때만 업로드 영역(+) 표시 */}
                {!previewUrl && (
                  <div className={m.imageUploadArea}>
                    <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' strokeWidth='1.5'>
                      <line x1='12' y1='5' x2='12' y2='19' />
                      <line x1='5' y1='12' x2='19' y2='12' />
                    </svg>
                    <input type='file' className={m.fileInput} onChange={handleFileChange} />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={m.footer}>
            <button type='button' className={m.btnCancel} onClick={onClose}>
              취소
            </button>
            <button type='submit' className={shared.btnPrimary} style={{ width: 140, justifyContent: 'center' }}>
              {saving ? '저장 중...' : mode === 'create' ? '의상 등록 완료' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
