// WITS 앱 관리(이벤트·광고) 공용 이미지 선택기.
//  · SingleImageField  : 한 장(배너·광고 이미지). 기존 이미지를 보여 주고 바꾸기/지우기.
//  · MultiImageField   : 여러 장(이벤트 본문). 기존 이미지는 순서대로 유지, 새 이미지는 그 뒤에 붙는다.
// 용량 검사는 여기서 하고, 넘치면 onError 로 알린다(필수 여부 검증은 폼이 한다).
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import { fileTooBigMessage } from './witsFormat';
import s from './Wits.module.css';

/** File 미리보기 URL — 파일이 바뀌거나 사라지면 revoke 한다. */
function useObjectUrl(file: File | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

type SingleImageFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  /** 서버에 이미 있는 이미지(수정). 지우기로 숨길 수 있다. */
  existingUrl?: string | null;
  /** 새로 고른 파일(있으면 이걸 보여 준다). */
  file: File | null;
  maxBytes: number;
  hint?: string;
  onPick: (file: File) => void;
  /** 새 파일을 취소하거나(있을 때) 기존 이미지를 지운다. 없으면 지우기 버튼을 숨긴다. */
  onRemove?: () => void;
  onError: (message: string) => void;
};

export function SingleImageField({
  label,
  required,
  error,
  existingUrl,
  file,
  maxBytes,
  hint,
  onPick,
  onRemove,
  onError,
}: SingleImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileUrl = useObjectUrl(file);
  const shown = fileUrl ?? existingUrl ?? null;

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!f) return;
    const tooBig = fileTooBigMessage(f, maxBytes);
    if (tooBig) return onError(tooBig);
    onPick(f);
  };

  return (
    <div className={s.field}>
      <span className={s.fieldLabel}>
        {label} {required ? <span className={s.required}>*</span> : null}
      </span>
      <div className={`${s.singleImage} ${error ? s.imageError : ''}`}>
        {shown ? (
          <img className={s.singlePreview} src={shown} alt={label} />
        ) : (
          <span className={s.imageEmpty}>이미지 없음</span>
        )}
      </div>
      <div className={s.imageActions}>
        <label className={s.smallBtn}>
          {shown ? '이미지 변경' : '이미지 선택'}
          <input ref={inputRef} type='file' accept='image/*' className={s.fileInput} onChange={pick} />
        </label>
        {shown && onRemove ? (
          <button type='button' className={`${s.smallBtn} ${s.smallBtnDanger}`} onClick={onRemove}>
            {file ? '선택 취소' : '삭제'}
          </button>
        ) : null}
        {file ? <span className={s.help}>새 이미지 · 저장하면 교체됩니다</span> : hint ? <span className={s.help}>{hint}</span> : null}
      </div>
      {error ? (
        <span className={s.fieldError} role='alert'>
          {error}
        </span>
      ) : null}
    </div>
  );
}

function FileThumb({ file, alt }: { file: File; alt: string }) {
  const url = useObjectUrl(file);
  return url ? <img className={s.thumbImg} src={url} alt={alt} /> : null;
}

type MultiImageFieldProps = {
  label: string;
  error?: string;
  /** 남길 기존 이미지 URL(이 순서대로 저장). */
  keptUrls: string[];
  /** 새로 더할 파일(기존 뒤에 붙는다). */
  files: File[];
  max: number;
  maxBytes: number;
  onRemoveKept: (url: string) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onError: (message: string) => void;
};

export function MultiImageField({
  label,
  error,
  keptUrls,
  files,
  max,
  maxBytes,
  onRemoveKept,
  onAddFiles,
  onRemoveFile,
  onError,
}: MultiImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const total = keptUrls.length + files.length;

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = '';
    if (picked.length === 0) return;
    for (const f of picked) {
      const tooBig = fileTooBigMessage(f, maxBytes);
      if (tooBig) return onError(tooBig);
    }
    if (total + picked.length > max) return onError(`본문 이미지는 최대 ${max}장입니다.`);
    onAddFiles(picked);
  };

  return (
    <div className={s.field}>
      <span className={s.fieldLabel}>
        {label}{' '}
        <span className={s.counter}>
          {total}/{max}
        </span>
      </span>
      <div className={`${s.thumbGrid} ${error ? s.imageError : ''}`}>
        {keptUrls.map((url, i) => (
          <div key={url} className={s.thumb}>
            <img className={s.thumbImg} src={url} alt={`본문 이미지 ${i + 1}`} />
            <span className={s.thumbOrder}>{i + 1}</span>
            <button type='button' className={s.thumbRemove} onClick={() => onRemoveKept(url)} aria-label='이미지 빼기'>
              ✕
            </button>
          </div>
        ))}
        {files.map((f, i) => (
          <div key={`${f.name}-${f.lastModified}-${i}`} className={`${s.thumb} ${s.thumbNew}`}>
            <FileThumb file={f} alt={`새 이미지 ${i + 1}`} />
            <span className={s.thumbOrder}>{keptUrls.length + i + 1}</span>
            <button type='button' className={s.thumbRemove} onClick={() => onRemoveFile(i)} aria-label='이미지 빼기'>
              ✕
            </button>
          </div>
        ))}
        {total < max ? (
          <label className={s.thumbAdd}>
            +
            <input ref={inputRef} type='file' accept='image/*' multiple className={s.fileInput} onChange={pick} />
          </label>
        ) : null}
      </div>
      <span className={s.help}>앱 상세 화면에 이 순서대로 보입니다. 새로 올린 이미지는 기존 이미지 뒤에 붙습니다.</span>
      {error ? (
        <span className={s.fieldError} role='alert'>
          {error}
        </span>
      ) : null}
    </div>
  );
}
