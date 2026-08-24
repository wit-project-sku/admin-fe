/** 배경 사진 API 타입. 배경은 의상에 딸리며, 한 배경을 여러 의상이 공용할 수 있다. */

export type BackgroundStatus = 'ACTIVE' | 'INACTIVE';

/** 배경이 어느 의상에 몇 번으로 걸려 있는지. */
export type LinkedOutfit = {
  outfitId: number;
  outfitCode: string;
  /** 그 의상 안에서의 번호(1~5). 노출 순서이자 AR 호출 파라미터. */
  backgroundIndex: number;
};

export type Background = {
  id: number;
  /** 파일명과 같은 코드. `14.1.1-2-CB` */
  code: string;
  serialNo: number;
  imageUrl: string;
  status: BackgroundStatus;
  outfits: LinkedOutfit[];
  nameKr?: string;
  nameEn?: string;
  nameJp?: string;
  nameCh?: string;
  nameVn?: string;
  nameId?: string;
  nameTh?: string;
  nameRu?: string;
};

/** 등록·수정 요청의 JSON 파트. 등록에서는 의상 연결을 파일명에서 서버가 만든다. */
export type BackgroundWriteBody = {
  status?: BackgroundStatus;
  outfits?: { outfitId: number; backgroundIndex: number }[];
  nameKr?: string;
  nameEn?: string;
  nameJp?: string;
  nameCh?: string;
  nameVn?: string;
  nameId?: string;
  nameTh?: string;
  nameRu?: string;
};
