// 통계 리포트 홈 미러의 버튼 그림 — Figma 홈 프레임(2160×3840)을 1:1 로 내보내 버튼 자리대로 잘라 둔 것(src/assets/report-home).
//   인사동 7574:68827(기부판)·7516:63421(지도판) · 오색시장 7812:106458 · 화성휴게소 7904:104580
// 칸 그림은 판(배경색 둥근 사각형)까지 포함한 300×300 이다. 글자는 넣지 않았다 — 앱이 고쳐 그리는 문구를 미러가 따로 쓴다.
// 디자인이 바뀌면 같은 좌표로 다시 잘라 덮어쓴다(파일 이름 = 버튼 슬롯).
const files = import.meta.glob('../../../assets/report-home/**/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export type ReportHomeSite = 'insadong' | 'osaek' | 'hwaseong';

/** 지점의 버튼 그림 주소. 없으면 undefined — 미러는 DB 이미지·아이콘으로 대신 그린다. */
export function reportHomeArt(site: ReportHomeSite, name: string): string | undefined {
  return files[`../../../assets/report-home/${site}/${name}.webp`];
}
