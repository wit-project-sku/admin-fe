# Wit Global Admin — Redesign

## 설치 및 실행

```bash
npm install
npm run dev
```

## 환경변수 (.env)
기존 admin-frontend의 .env 파일을 그대로 사용합니다.

```
VITE_API_BASE_URL=https://your-api-server.com/api
VITE_APP_API_URL=https://your-api-server.com/api
```

## 변경 사항
- 전체 UI 0.8× 스케일 적용
- 상단 헤더: 로고 + 로그인 계정 표시만 (메뉴 제거)
- 좌측 사이드바: MAIN (대시보드, 리포트) / MANAGEMENT (상품, 결제, 배송, 환불, 의상) 그룹
- 신규 기능: 통계 대시보드 (recharts), 상세 분석 리포트, 의상 관리 및 등록
- 상품 관리: 테이블에서 이미지 컬럼 제거
- 환불 관리: 모달을 별도 파일(RefundManageModal.jsx)로 분리
- 상태 배지 색상 유지 (초록/빨강/주황/파랑/회색)

## 신규 패키지
- recharts ^2.13.3
- lucide-react ^0.462.0
