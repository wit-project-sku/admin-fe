import React from 'react';
import m from './ModalElements.module.css';

export const ModalContainer = ({ children, onClose }) => (
  <div className={m.overlay} onClick={onClose}>
    <div className={m.modal} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

// 모달 상단 타이틀 + 닫기 버튼
export const ModalHeader = ({ title, onClose }) => (
  <div className={m.header}>
    <span className={m.title}>{title}</span>
    <button className={m.closeBtn} onClick={onClose}>
      ✕
    </button>
  </div>
);

// 라벨 + 정보 표시 (Read Only)
export const InfoField = ({ label, value, children }) => (
  <div className={m.field}>
    <label className={m.label}>{label}</label>
    <div className={m.valueText}>{children ? children : (value ?? '-')}</div>
  </div>
);

// 입력 필드 (Input)
export const InputField = ({ label, required, ...props }) => (
  <div className={m.field}>
    <label className={m.label}>
      {label} {required && <span className={m.required}>*</span>}
    </label>
    <input className={m.input} {...props} />
  </div>
);

// DropDown 버튼 필드
export const DropDownField = ({ label, options, required, value, onChange, ...props }) => {
  return (
    <div className={m.field}>
      <label className={m.label}>
        {label} {required && <span className={m.required}>*</span>}
      </label>
      <select
        className={m.input} // m.valueText 대신 input 스타일 적용 (선택창이므로)
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      >
        <option value=''>선택하세요</option>
        {options.map((opt) => (
          <option key={opt.value || opt.id} value={opt.value || opt.id}>
            {opt.label || opt.name}
          </option>
        ))}
      </select>
    </div>
  );
};

// textarea 필드
export const TextAreaField = ({ label, required, ...props }) => (
  <div className={`${m.field} ${m.fieldFull}`}>
    <span className={m.label}>
      {label} {required && <span className={m.required}>*</span>}
    </span>
    <textarea className={m.fieldTextarea} required {...props} />
  </div>
);

// 여러 버튼 선택 필드
export const MultiSelectField = ({ label, required, items = [], selectedIds = [], onChange, isEdit = true }) => {
  const ids = Array.isArray(selectedIds) ? selectedIds : [];

  const toggleItem = (id) => {
    if (!isEdit) return;
    const newIds = ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id];
    onChange(newIds);
  };

  return (
    <div className={`${m.field} ${m.fieldFull}`}>
      <span className={m.label}>
        {label} {required && <span className={m.required}>*</span>}
      </span>
      <div className={m.itemGrid}>
        {items.map((item) => {
          const isActive = selectedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className={`${m.selectableItem} ${ids.includes(item.id) ? m.itemActive : ''}`}
              onClick={() => toggleItem(item.id)}
            >
              <div className={`${m.checkCircle} ${isActive ? m.checked : ''}`} />
              <span className={m.itemName}>{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 이미지 업로드/표시 영역
export const ImageUploadField = ({ label, previewUrls = [], onUpload, onDelete, isEdit, maxCount = 1 }) => {
  const urls = Array.isArray(previewUrls) ? previewUrls : [];

  return (
    <div className={m.imageSection}>
      <label className={m.label}>{label}</label>
      <div className={m.imageGrid}>
        {/* 1. 등록된 이미지들 리스트 렌더링 */}
        {urls.map((url, index) => (
          <div key={`${url}-${index}`} className={m.imageThumbnail}>
            <img src={url} className={m.previewImg} alt={`미리보기 ${index + 1}`} />
            {isEdit && (
              <button type='button' className={m.deleteBtn} onClick={() => onDelete(url)}>
                ✕
              </button>
            )}
          </div>
        ))}

        {/* 2. 업로드 버튼: 편집 모드이면서 최대 개수보다 적을 때만 표시 */}
        {isEdit && previewUrls.length < maxCount && (
          <div className={m.uploadArea}>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#94a3b8' strokeWidth='2.5'>
              <line x1='12' y1='5' x2='12' y2='19' />
              <line x1='5' y1='12' x2='19' y2='12' />
            </svg>
            <input
              type='file'
              className={m.fileInput}
              onChange={onUpload}
              accept='image/*'
              multiple={maxCount > 1} // 여러 개 선택 가능 여부
            />
          </div>
        )}
      </div>
    </div>
  );
};

// 모달 하단 버튼 그룹
export const ModalFooter = ({ onCancel, onSubmit, cancelText = '취소', submitText = '확인', isLoading }) => (
  <div className={m.footer}>
    <button type='button' className={onSubmit ? m.btnCancel : m.btnSubmit} onClick={onCancel}>
      {cancelText}
    </button>
    {onSubmit && (
      <button type='submit' className={m.btnSubmit} disabled={isLoading}>
        {isLoading ? '처리 중...' : submitText}
      </button>
    )}
  </div>
);
