import { useCallback, useEffect, useMemo, useState } from 'react';
import { isTestKiosk, useGetKiosks } from '@/hooks/useGetKiosks';
import {
  OUTFIT_LABEL_FIELDS,
  hasOverride,
  type KioskOutfitCategoryOverrideBody,
  type KioskOutfitCategorySetting,
  type OutfitCategoryLabelKey,
  type OutfitCategoryLabels,
} from '@/hooks/inventory-api/kioskOutfitCategoryTypes';
import {
  useDeleteKioskOutfitCategorySetting,
  useGetKioskOutfitCategorySettings,
  useUpdateKioskOutfitCategorySetting,
} from '@/hooks/inventory-api/useKioskOutfitCategorySettings';

/** 편집 중인 라벨 8칸(빈 문자열 = 기본값을 따른다). */
export type LabelDraft = Record<OutfitCategoryLabelKey, string>;

const emptyDraft = (): LabelDraft =>
  OUTFIT_LABEL_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {} as LabelDraft);

const draftFrom = (row: KioskOutfitCategorySetting): LabelDraft =>
  OUTFIT_LABEL_FIELDS.reduce(
    (acc, f) => ({ ...acc, [f.key]: row[f.key] ?? '' }),
    {} as LabelDraft,
  );

/** 빈 칸은 `null` 로 보낸다 — 서버에서 '기본을 따른다'는 뜻이 된다. */
const labelsFromDraft = (draft: LabelDraft): OutfitCategoryLabels =>
  OUTFIT_LABEL_FIELDS.reduce((acc, f) => {
    const value = draft[f.key]?.trim();
    return { ...acc, [f.key]: value ? value : null };
  }, {} as OutfitCategoryLabels);

const errorMessageOf = (e: unknown, fallback: string): string => {
  const res = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return res || fallback;
};

export function useKioskOutfitCategoryPage() {
  const { data: kiosksData, isLoading: kiosksLoading } = useGetKiosks();

  // 의상 등록과 같은 기준으로 거른다 — 사내 HQ 테스트 단말만 감춘다(#P003-VN 은 실제 설치라 남긴다).
  const kiosks = useMemo(
    () => (kiosksData ?? []).filter((k) => !isTestKiosk(k.name)),
    [kiosksData],
  );

  const [kioskId, setKioskId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [draft, setDraft] = useState<LabelDraft>(emptyDraft);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // 첫 로드 시 첫 키오스크를 고른다(선택 전에는 표를 그릴 것이 없다).
  useEffect(() => {
    if (kioskId == null && kiosks.length > 0) setKioskId(kiosks[0].id);
  }, [kiosks, kioskId]);

  const { settings, isLoading, error, refetch } = useGetKioskOutfitCategorySettings(kioskId);
  const { updateSettingAsync, isPending: saving } = useUpdateKioskOutfitCategorySetting();
  const { deleteSettingAsync, isPending: resetting } = useDeleteKioskOutfitCategorySetting();

  // 키오스크를 바꾸면 편집 중이던 내용은 버린다(다른 단말의 값이 섞이면 안 된다).
  useEffect(() => {
    setEditingCategoryId(null);
    setDraft(emptyDraft());
  }, [kioskId]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(t);
  }, [notice]);

  const openEditor = useCallback((row: KioskOutfitCategorySetting) => {
    setErrorText(null);
    setEditingCategoryId(row.categoryId);
    setDraft(draftFrom(row));
  }, []);

  const closeEditor = useCallback(() => {
    setEditingCategoryId(null);
    setDraft(emptyDraft());
  }, []);

  const changeDraft = useCallback((key: OutfitCategoryLabelKey, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const submit = useCallback(
    async (row: KioskOutfitCategorySetting, body: KioskOutfitCategoryOverrideBody, done: string) => {
      if (kioskId == null) return;
      setErrorText(null);
      try {
        await updateSettingAsync({ kioskId, categoryId: row.categoryId, body });
        setNotice(`${row.base?.labelKr ?? row.categoryName} — ${done}`);
      } catch (e) {
        setErrorText(errorMessageOf(e, '설정을 저장하지 못했습니다.'));
      }
    },
    [kioskId, updateSettingAsync],
  );

  /** 숨김 토글. PUT 이 전체 치환이라 지금 라벨을 함께 보내야 라벨이 날아가지 않는다. */
  const toggleHidden = useCallback(
    async (row: KioskOutfitCategorySetting) => {
      const next = !row.hidden;
      await submit(
        row,
        { hidden: next, ...labelsFromDraft(draftFrom(row)) },
        next ? '이 키오스크에서 숨김' : '숨김 해제',
      );
    },
    [submit],
  );

  /** 편집기의 라벨 저장. 숨김 상태는 그대로 유지한다. */
  const saveLabels = useCallback(
    async (row: KioskOutfitCategorySetting) => {
      await submit(row, { hidden: row.hidden, ...labelsFromDraft(draft) }, '표시 이름 저장');
      closeEditor();
    },
    [draft, submit, closeEditor],
  );

  /** 기본값으로 되돌리기 — 오버라이드 행 자체를 지운다. */
  const resetRow = useCallback(
    async (row: KioskOutfitCategorySetting) => {
      if (kioskId == null) return;
      setErrorText(null);
      try {
        await deleteSettingAsync({ kioskId, categoryId: row.categoryId });
        setNotice(`${row.base?.labelKr ?? row.categoryName} — 기본값으로 되돌림`);
        if (editingCategoryId === row.categoryId) closeEditor();
      } catch (e) {
        setErrorText(errorMessageOf(e, '설정을 되돌리지 못했습니다.'));
      }
    },
    [kioskId, deleteSettingAsync, editingCategoryId, closeEditor],
  );

  const overrideCount = useMemo(() => settings.filter(hasOverride).length, [settings]);
  const visibleCount = useMemo(() => settings.filter((s) => s.visible).length, [settings]);

  return {
    kiosks,
    kiosksLoading,
    kioskId,
    setKioskId,
    kioskName: kiosks.find((k) => k.id === kioskId)?.name ?? '',

    settings,
    isLoading,
    errorMessage: error ? '설정을 불러오지 못했습니다.' : '',
    refetch,

    overrideCount,
    visibleCount,

    editingCategoryId,
    draft,
    openEditor,
    closeEditor,
    changeDraft,

    toggleHidden,
    saveLabels,
    resetRow,
    busy: saving || resetting,

    notice,
    setNotice,
    errorText,
  };
}
