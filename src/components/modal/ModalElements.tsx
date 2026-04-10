import type { ChangeEventHandler, FormEvent, ReactNode } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import m from './ModalElements.module.css';

type ModalContainerProps = {
  children: ReactNode;
  onClose?: () => void;
  /** Merged with the default modal box (e.g. wider preview dialogs). */
  modalClassName?: string;
};

export const ModalContainer = ({ children, onClose, modalClassName }: ModalContainerProps) => (
  <div className={m.overlay} onClick={onClose}>
    <div className={[m.modal, modalClassName].filter(Boolean).join(' ')} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

type ModalHeaderProps = {
  title: string;
  onClose?: () => void;
};

export const ModalHeader = ({ title, onClose }: ModalHeaderProps) => (
  <div className={m.header}>
    <span className={m.title}>{title}</span>
    <button type="button" className={m.closeBtn} onClick={onClose}>
      ✕
    </button>
  </div>
);

type InfoFieldProps = {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
};

export const InfoField = ({ label, value, children }: InfoFieldProps) => (
  <div className={m.field}>
    <label className={m.label}>{label}</label>
    <div className={m.valueText}>{children != null ? children : (value ?? '-')}</div>
  </div>
);

type InputFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const InputField = ({ label, required, error, className, ...props }: InputFieldProps) => (
  <div className={m.field}>
    <label className={m.label}>
      {label} {required && <span className={m.required}>*</span>}
    </label>
    <input
      className={[m.input, error ? m.inputError : '', className].filter(Boolean).join(' ')}
      aria-invalid={error ? true : undefined}
      {...props}
    />
    {error ? (
      <span className={m.fieldError} role="alert">
        {error}
      </span>
    ) : null}
  </div>
);

export type SelectOption = { value?: string | number; id?: string | number; label?: string; name?: string };

type DropDownFieldProps = {
  label: string;
  options: SelectOption[];
  required?: boolean;
  error?: string;
  value?: string | number;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'>;

export const DropDownField = ({ label, options, required, error, value, onChange, className, ...props }: DropDownFieldProps) => {
  return (
    <div className={m.field}>
      <label className={m.label}>
        {label} {required && <span className={m.required}>*</span>}
      </label>
      <select
        className={[m.input, error ? m.selectError : '', className].filter(Boolean).join(' ')}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        <option value="">선택하세요</option>
        {options.map((opt) => (
          <option key={String(opt.value ?? opt.id)} value={opt.value ?? opt.id}>
            {opt.label ?? opt.name}
          </option>
        ))}
      </select>
      {error ? (
        <span className={m.fieldError} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
};

type TextAreaFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextAreaField = ({ label, required, error, className, ...props }: TextAreaFieldProps) => (
  <div className={`${m.field} ${m.fieldFull}`}>
    <span className={m.label}>
      {label} {required && <span className={m.required}>*</span>}
    </span>
    <textarea
      className={[m.fieldTextarea, error ? m.textareaError : '', className].filter(Boolean).join(' ')}
      required={required}
      aria-invalid={error ? true : undefined}
      {...props}
    />
    {error ? (
      <span className={m.fieldError} role="alert">
        {error}
      </span>
    ) : null}
  </div>
);

export type MultiSelectItem = { id: string | number; name: string };

type MultiSelectFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  items?: MultiSelectItem[];
  selectedIds?: (string | number)[];
  onChange: (ids: (string | number)[]) => void;
  isEdit?: boolean;
};

const idKey = (v: string | number) => String(v);

export const MultiSelectField = ({
  label,
  required,
  error,
  items = [],
  selectedIds = [],
  onChange,
  isEdit = true,
}: MultiSelectFieldProps) => {
  const ids = Array.isArray(selectedIds) ? selectedIds : [];

  const toggleItem = (itemId: string | number) => {
    if (!isEdit) return;
    const k = idKey(itemId);
    const newIds = ids.some((i) => idKey(i) === k)
      ? ids.filter((i) => idKey(i) !== k)
      : [...ids, itemId];
    onChange(newIds);
  };

  return (
    <div className={`${m.field} ${m.fieldFull}`}>
      <span className={m.label}>
        {label} {required && <span className={m.required}>*</span>}
      </span>
      <div className={[m.itemGrid, error ? m.multiSelectErrorWrap : ''].filter(Boolean).join(' ')}>
        {items.map((item) => {
          const isActive = ids.some((i) => idKey(i) === idKey(item.id));
          return (
            <div
              key={item.id}
              className={`${m.selectableItem} ${isActive ? m.itemActive : ''}`}
              onClick={() => toggleItem(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') toggleItem(item.id);
              }}
              role="button"
              tabIndex={0}
            >
              <div className={`${m.checkCircle} ${isActive ? m.checked : ''}`} />
              <span className={m.itemName}>{item.name}</span>
            </div>
          );
        })}
      </div>
      {error ? (
        <span className={m.fieldError} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
};

type ImageUploadFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  /** Span full width in parent CSS grids (e.g. product modal). */
  spanFull?: boolean;
  previewUrls?: string[];
  onUpload?: ChangeEventHandler<HTMLInputElement>;
  onDelete?: (url?: string) => void;
  isEdit?: boolean;
  maxCount?: number;
};

export const ImageUploadField = ({
  label,
  required,
  error,
  spanFull,
  previewUrls = [],
  onUpload,
  onDelete,
  isEdit,
  maxCount = 1,
}: ImageUploadFieldProps) => {
  const urls = Array.isArray(previewUrls) ? previewUrls : [];

  return (
    <div
      className={[m.imageSection, spanFull ? m.fieldFull : '', error ? m.imageSectionError : '']
        .filter(Boolean)
        .join(' ')}
    >
      <label className={m.label}>
        {label} {required && <span className={m.required}>*</span>}
      </label>
      <div className={m.imageGrid}>
        {urls.map((url, index) => (
          <div key={`${url}-${index}`} className={m.imageThumbnail}>
            <img src={url} className={m.previewImg} alt={`미리보기 ${index + 1}`} />
            {isEdit && (
              <button type="button" className={m.deleteBtn} onClick={() => onDelete?.(url)}>
                ✕
              </button>
            )}
          </div>
        ))}

        {isEdit && previewUrls.length < maxCount && (
          <div className={m.uploadArea}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <input type="file" className={m.fileInput} onChange={onUpload} accept="image/*" multiple={maxCount > 1} />
          </div>
        )}
      </div>
      {error ? (
        <span className={m.fieldError} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
};

type ModalFooterProps = {
  onCancel?: () => void;
  onSubmit?: (e?: FormEvent) => void | Promise<void>;
  cancelText?: string;
  submitText?: string;
  isLoading?: boolean;
  submitDisabled?: boolean;
};

export const ModalFooter = ({
  onCancel,
  onSubmit,
  cancelText = '취소',
  submitText = '확인',
  isLoading,
  submitDisabled,
}: ModalFooterProps) => (
  <div className={m.footer}>
    <button type="button" className={onSubmit ? m.btnCancel : m.btnSubmit} onClick={onCancel}>
      {cancelText}
    </button>
    {onSubmit && (
      <button
        type="button"
        className={m.btnSubmit}
        disabled={isLoading || submitDisabled}
        onClick={() => {
          void onSubmit();
        }}
      >
        {isLoading ? '처리 중...' : submitText}
      </button>
    )}
  </div>
);
