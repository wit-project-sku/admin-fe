# 키오스크 관리자 API 명세 · Kiosk Admin API Specification

> **한국어 / English** — 백엔드 연동 시 이 문서의 타입·쿼리·응답을 기준으로 맞추면 됩니다.  
> Use this document as the contract when wiring real APIs (paths are suggestions; align with your gateway).

---

## 공통 · Common

### 인증 · Authentication

| KO | EN |
|----|-----|
| 모든 엔드포인트는 관리자 세션/JWT 등 기존 `private` API 규칙을 따릅니다. | All endpoints follow the same auth rules as other admin `private` routes (session/JWT). |

### 공통 쿼리 · Common query parameters (목록 API)

| Param | Type | KO | EN |
|-------|------|----|-----|
| `page` | `number` | 1부터 페이지 번호 | Page number (1-based) |
| `size` / `pageSize` | `number` | 페이지 크기 (예: 20, 100) | Page size |
| `sort` | `string` | 정렬 필드, 예: `name,asc` | Sort, e.g. `name,asc` |

### 공통 응답 (페이지네이션) · Paginated response

```ts
type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;        // current page (0-based or 1-based — 명시 필요)
  size: number;
};
```

---

## 1. 키오스크 분석 대시보드 (`/admin/kiosk-analytics`)

### 1.1 위치 목록 · List locations

**KO:** 필터 드롭다운 · 지역/매장 단위  
**EN:** Filter dropdown — locations/branches.

```
GET /admin/kiosk/locations
```

**Response**

```ts
type KioskLocationDto = {
  id: string;
  name: string;       // 표시명 · Display name
  region?: string;    // 지역(선택) · Region (optional)
};
```

---

### 1.2 키오스크 목록 (검색/필터) · List kiosks

**KO:** 검색 가능 드롭다운, 위치 필터 연동, 대량(100+) 지원  
**EN:** Searchable dropdown; optional location filter; scalable to 100+ kiosks.

```
GET /admin/kiosk/devices
```

**Query**

| Param | Type | Required | KO | EN |
|-------|------|----------|----|-----|
| `locationId` | `string` | no | 위치로 제한 | Restrict by location |
| `q` / `keyword` | `string` | no | 이름·ID 검색 | Search by name/id |
| `page` | `number` | no | 대량 시 페이지 | Pagination for large sets |
| `size` | `number` | no | 페이지 크기 | Page size |

**Response:** `PageResponse<KioskDeviceDto>` 또는 전체 배열(소규모면)  
**Response:** `PageResponse<KioskDeviceDto>` or plain array if small.

```ts
type KioskDeviceDto = {
  id: string;
  name: string;         // 예: 키오스크 001
  locationId: string;
};
```

---

### 1.3 앱 목록 (분석 필터용) · App catalog for analytics filter

**KO:** 분석 화면의 “앱” 필터 옵션  
**EN:** Options for the analytics “App” filter.

```
GET /admin/kiosk/apps/catalog
```

**Response:** `KioskAppCatalogItemDto[]`

```ts
type KioskAppCatalogItemDto = {
  id: string;
  name: string;
  category?: string;
};
```

---

### 1.4 분석 집계 (대시보드 본문) · Analytics aggregate (main dashboard)

**KO:** KPI, 차트, 앱 상세 테이블에 필요한 데이터를 한 번에 또는 분리 API로 제공  
**EN:** Provide KPIs, chart series, and app table rows in one or multiple endpoints.

**옵션 A — 단일 요약 (권장 UI 연동)**  
**Option A — Single summary (recommended for the current UI)**

```
GET /admin/kiosk/analytics/summary
```

**Query (필터와 동일 의미)**  
**Query (same semantics as UI filters)**

| Param | Type | KO | EN |
|-------|------|----|-----|
| `datePreset` | `'today' \| '7d' \| '30d' \| 'custom'` | 기간 프리셋 | Date preset |
| `startDate` | `string (YYYY-MM-DD)` | custom 시 시작일 | Start (custom range) |
| `endDate` | `string (YYYY-MM-DD)` | custom 시 종료일 | End (custom range) |
| `locationId` | `string` | 빈 문자열 = 전체 | Empty = all locations |
| `kioskId` | `string` | 빈 문자열 = 전체 키오스크 | Empty = all kiosks |
| `appId` | `string` | 빈 문자열 = 전체 앱 | Empty = all apps |
| `trendGranularity` | `'daily' \| 'weekly' \| 'monthly'` | 사용 추이 차트 단위 | Trend chart bucket size |

**Response**

```ts
type KioskAnalyticsSummaryDto = {
  // KPI 카드
  totalClicks: number;
  totalUsageMs: number;
  totalSessions: number;
  avgSessionMs: number;
  activeKioskCount: number;

  // 앱 클릭 분포 · 가로 막대(앱별 사용 시간)용
  byApp: Array<{
    appId: string;
    appName: string;
    themeColor?: string;   // 차트 색(선택) · Optional chart color
    clicks: number;
    usageMs: number;
    sessions: number;
  }>;

  // 키오스크별 / 위치별
  byKiosk: Array<{
    kioskId: string;
    kioskName: string;
    locationId: string;
    locationName: string;
    clicks: number;
    usageMs: number;
    sessions: number;
  }>;

  byLocation: Array<{
    locationId: string;
    locationName: string;
    clicks: number;
    usageMs: number;
    sessions: number;
  }>;

  // 사용 추이 (선택한 granularity에 맞춘 버킷)
  trend: Array<{
    label: string;       // 축 라벨 · Axis label (e.g. "04-16" or "2026-04")
    clicks: number;
    usageMs: number;
  }>;

  // 앱 상세 테이블 (정렬/검색/페이지는 클라이언트 또는 별도 API)
  appTableRows: Array<{
    appId: string;
    appName: string;
    category?: string;
    clicks: number;
    usageMs: number;
    avgSessionMs: number;
    topLocationId: string;
    topLocationName: string;
    topKioskId: string;
    topKioskName: string;
  }>;
};
```

**옵션 B — 테이블만 서버 페이지네이션**  
**Option B — Server-side pagination for app table only**

```
GET /admin/kiosk/analytics/app-rows
```

**Query:** 위 필터 + `page`, `size`, `sort`, `q` (앱 이름 검색)  
**Query:** Same filters + `page`, `size`, `sort`, `q` (app name search)

**Response:** `PageResponse<AppAnalyticsRowDto>` (위 `appTableRows` 한 행 타입과 동일)

---

## 2. 키오스크 앱 관리 (`/admin/kiosk-apps`)

### 2.1 앱 유형 목록 (백엔드) · App types (dropdown)

**KO:** “유형(백엔드)” 드롭다운 — 프론트 하드코딩 아님  
**EN:** “Type (from backend)” dropdown — not hardcoded on FE.

```
GET /admin/kiosk/app-types
```

**Response:** `KioskAppTypeDto[]`

```ts
type KioskAppTypeDto = {
  id: string;
  name: string;    // 표시명 · Label
  code?: string;   // 코드(선택) · Optional code e.g. MAP
};
```

---

### 2.2 앱 목록 (관리 화면 “전체 앱” 탭) · List managed apps

```
GET /admin/kiosk/apps
```

**Query:** `q` (이름 검색), `status`, `page`, `size` (선택)

**Response:** `PageResponse<KioskManagedAppDto>` 또는 배열

```ts
type KioskManagedAppDto = {
  id: string;
  name: string;
  description: string;
  typeId: string;              // KioskAppTypeDto.id
  iconKey: string;             // 프론트 프리셋 키 · FE preset key (e.g. map, shop)
  status: 'active' | 'disabled';
  totalClicks: number;         // 통계(선택) · Analytics (optional)
  kioskCount?: number;         // 배치된 키오스크 수 · # kiosks using app (optional, or join)
};
```

---

### 2.3 앱 생성 · Create app

```
POST /admin/kiosk/apps
```

**Request body**

```ts
type CreateKioskAppRequest = {
  name: string;
  description?: string;
  typeId: string;
  iconKey: string;             // 프론트와 동일한 키 집합 · Same key set as FE presets
  status?: 'active' | 'disabled';

  // 생성과 동시에 키오스크에 배치할 때 (UI “앱 생성 및 배치”)
  placements?: Array<{
    kioskId: string;
    position: number;          // 1–9
  }>;
};
```

**Response:** `KioskManagedAppDto`

---

### 2.4 앱 수정 · Update app

```
PATCH /admin/kiosk/apps/{appId}
```

**Request body (부분 갱신)**  
**Request body (partial)**

```ts
type UpdateKioskAppRequest = {
  name?: string;
  description?: string;
  typeId?: string;
  iconKey?: string;
  status?: 'active' | 'disabled';
};
```

**Response:** `KioskManagedAppDto`

---

### 2.5 앱 삭제 · Delete app

```
DELETE /admin/kiosk/apps/{appId}
```

**KO:** 모든 키오스크 배치에서도 제거(정책에 따라 cascade)  
**EN:** Cascade remove placements per policy.

---

### 2.6 키오스크별 배치 목록 (“키오스크별” 탭) · Placements by kiosk

```
GET /admin/kiosk/devices/{kioskId}/placements
```

**Response:** `KioskPlacementDto[]` (position 오름차순 권장)  
**Response:** Sorted by `position` ascending recommended.

```ts
type KioskPlacementDto = {
  appId: string;
  position: number;            // 1–9, 키오스크 내 유일 · Unique per kiosk
  iconKey?: string;            // 이 키오스크 전용 덮어쓰기(선택) · Per-kiosk icon override
};
```

---

### 2.7 배치 추가 (기존 앱을 키오스크에 올리기) · Add placement

```
POST /admin/kiosk/devices/{kioskId}/placements
```

**Request**

```ts
type AddPlacementRequest = {
  appId: string;
  position: number;            // 1–9
  iconKey?: string;            // 앱 기본과 다를 때만 · Only if different from app default
};
```

**KO:** 비즈니스 규칙 — 키오스크당 최대 9개, 동일 `position` 불가  
**EN:** Max 9 apps per kiosk; `position` must be unique.

**Response:** `KioskPlacementDto`

---

### 2.8 배치 위치 변경 · Update placement position

```
PATCH /admin/kiosk/devices/{kioskId}/placements/{appId}/position
```

**Request**

```ts
type UpdatePlacementPositionRequest = {
  position: number;            // 1–9; 충돌 시 스왑 등 서버 정책
};
```

**KO:** 다른 앱이 같은 자리를 쓰면 스왑 가능(현재 UI 동작)  
**EN:** May swap with occupying app (matches current UI).

---

### 2.9 배치 제거 · Remove placement

```
DELETE /admin/kiosk/devices/{kioskId}/placements/{appId}
```

---

## 3. 프론트엔드 전용 상수 (백엔드와 맞출 값) · FE-only constants (align with BE)

| 항목 · Item | KO | EN |
|-------------|----|-----|
| `iconKey` | Lucide 프리셋 키 (`map`, `shop`, …). 서버는 문자열로 저장·검증 가능. | Preset string keys; server may validate against allowlist. |
| `position` | 정수 1~9 | Integer 1–9 |
| 날짜 | `YYYY-MM-DD` (필터/커스텀 범위) | ISO date strings for custom range |

---

## 4. 요약 표 · Quick reference

| 화면 · Screen | 주요 API · Main APIs |
|---------------|----------------------|
| 키오스크 분석 | `GET .../locations`, `GET .../devices`, `GET .../apps/catalog`, `GET .../analytics/summary` |
| 키오스크 앱 관리 | `GET .../app-types`, `GET/POST/PATCH/DELETE .../apps`, `GET/POST/PATCH/DELETE .../devices/{id}/placements` |

---

*이 파일은 UI 요구사항에 맞춘 계약 초안입니다. 실제 경로·필드명은 백엔드 표준에 맞게 조정하세요.*  
*This file is a contract draft aligned to the UI; adjust paths and field names to your backend standards.*
