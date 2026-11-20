# 롯데 건물 이벤트 API 제안

롯데 키오스크(W011~W013) **건물 안내 › 이벤트**에 나갈 이벤트를 관리자 웹 `롯데 키오스크 › 건물 이벤트`(`/admin/lotte/events`)에서 등록합니다.
기능 가이드(2026-11-13) 5절 '이벤트 관리 — 건물 구분 칸'에 해당합니다. 화면은 이 모양으로 먼저 만들었고, 서버에는 아직 없습니다(지금은 404 안내가 나옵니다).

기존 두 이벤트 API는 쓰지 않습니다. `wits-events`는 WITS 앱 이벤트라 키오스크 이벤트를 넣으면 앱에도 나가고, `onsite-events`는 촬영 통계용 행사입니다. 둘 다 키오스크·건물 칸이 없습니다.

## 데이터

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | number | — | |
| `kioskId` | number | ✓ | W011~W013 키오스크 id |
| `building` | string | ✓ | 건물. W011: `롯데월드몰` · `롯데타워` · `롯데백화점` · `롯데월드` / W012: `롯데백화점 청량리점` / W013: `롯데백화점 건대스타시티점` (키오스크 건물 칩 이름과 같음) |
| `kind` | enum | ✓ | `MAIN_EVENT` · `POP_UP` · `ENTERTAINMENT` · `STORE_EVENT` |
| `title` | string(40) | ✓ | |
| `startDate` | `yyyy-MM-dd` | ✓ | KST |
| `endDate` | `yyyy-MM-dd` | ✓ | `startDate` 이상. 이 날이 지나면 키오스크에서 내려감 |
| `timeText` | string(30) | | 시간 안내 — `18:00`, `매일 11:00 · 15:00` |
| `place` | string(30) | | 건물 안 장소 — `1F 아트리움` |
| `createdAt` · `updatedAt` | `yyyy-MM-ddTHH:mm:ss` | — | |
| `updatedBy` | string \| null | — | 마지막으로 고친 관리자 이름(가이드: 누가 언제) |

## 관리자 (ROLE_ADMIN)

```
GET    /api/admin/lotte/events?kioskId&building&status&pageNum&pageSize
         status = ONGOING | UPCOMING | ENDED (오늘 KST 기준, 생략 = 전체)
         정렬 = startDate 내림차순 → Page<Event> (기존 content/totalElements/totalPages/last 모양)
POST   /api/admin/lotte/events            body: kioskId, building, kind, title, startDate, endDate, timeText, place
PUT    /api/admin/lotte/events/{id}       body: 위와 같음 (전체 교체)
DELETE /api/admin/lotte/events/{id}       body: { reason }  — 사유와 삭제한 관리자·시각을 남김
```

검증 실패는 400 + `message`(화면에 그대로 보여 줍니다). 지점에 없는 `building`도 400.

## 키오스크 (공개)

```
GET /api/lotte/events?kioskId=11
  → 오늘 진행 중 + 예정, 종료 제외. 건물별로 묶어 주면 좋음:
  [{ building: '롯데월드몰', events: [{ kind, title, startDate, endDate, timeText, place }] }, …]
```

키오스크는 한 줄로 `11.13 ~ 11.30 · 롯데월드몰 1F 아트리움` 처럼 그립니다(kiosk-app `layouts/lotte/lotteBuildingData.ts`의 예시 데이터를 이 API로 바꿀 예정).
