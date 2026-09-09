/**
 * 배경 사진 API 타입.
 *
 * 배경은 의상·키오스크와 무관한 독립 소재다(2026-09-09 개편). 등록에 필요한 것은
 * 사진 · 고유 번호 · 이름뿐이며, 예전의 배경 코드(`14.1.1-2-CB`)와 의상 연결은 없어졌다.
 */

export type BackgroundStatus = 'ACTIVE' | 'INACTIVE';

/** 배경 이름 8개 언어. 한국어만 채워도 되고, 앱은 미번역 언어를 한국어로 대체한다. */
export type BackgroundNames = {
  nameKr?: string;
  nameEn?: string;
  nameJp?: string;
  nameCh?: string;
  nameVn?: string;
  nameId?: string;
  nameTh?: string;
  nameRu?: string;
};

export type Background = BackgroundNames & {
  /** 서버가 매기는 식별자. 수정·삭제 호출에 쓴다. */
  id: number;
  /** 사람이 정하는 고유 번호(1,2,3…). 노출 순서이자 AR 합성에 넘어가는 값이다. */
  backgroundNo: number;
  imageUrl: string;
  status: BackgroundStatus;
};

/** 등록·수정 요청의 JSON 파트. 수정에서는 보낸 항목만 바뀐다. */
export type BackgroundWriteBody = BackgroundNames & {
  backgroundNo?: number;
  status?: BackgroundStatus;
};

/** 이름 입력칸 — 화면과 요청 본문이 같은 순서를 쓰도록 한곳에 둔다. */
export const NAME_FIELDS: { key: keyof BackgroundNames; label: string }[] = [
  { key: 'nameKr', label: '한국어' },
  { key: 'nameEn', label: '영어' },
  { key: 'nameJp', label: '일본어' },
  { key: 'nameCh', label: '중국어' },
  { key: 'nameVn', label: '베트남어' },
  { key: 'nameId', label: '인도네시아어' },
  { key: 'nameTh', label: '태국어' },
  { key: 'nameRu', label: '러시아어' },
];
