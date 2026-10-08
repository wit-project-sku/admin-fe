import { fetchBodyMeasurementExport } from '../../hooks/body-measurement-api/useBodyMeasurements';
import type {
  BodyMeasurementExportRow,
  BodyMeasurementFilterParams,
} from '../../hooks/body-measurement-api/bodyMeasurementTypes';
import { downloadXlsx, type XlsxColumn } from '../../utils/xlsxExport';
import { fmtFullDateTime, GENDER_LABEL, SHOT_TYPE_LABEL } from './bodyMeasurementFormat';

/** 숫자는 받은 그대로 숫자 셀로, 없으면 빈 칸. */
const num = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : '');

/** 명세 6 의 열 순서 그대로. 사진·주소 열은 없다. */
const COLUMNS: XlsxColumn<BodyMeasurementExportRow>[] = [
  { header: 'eventId', value: (r) => r.eventId, width: 38 },
  { header: '촬영 시각', value: (r) => fmtFullDateTime(r.shotAt), width: 20 },
  { header: '지점', value: (r) => r.kioskName ?? '', width: 28 },
  { header: '측정 시각', value: (r) => fmtFullDateTime(r.measuredAt), width: 20 },
  { header: '측정 키', value: (r) => num(r.heightCm), width: 10 },
  { header: '어깨 폭', value: (r) => num(r.shoulderWidthCm), width: 10 },
  { header: '가슴 폭', value: (r) => num(r.chestWidthCm), width: 10 },
  { header: '허리 폭', value: (r) => num(r.waistWidthCm), width: 10 },
  { header: '엉덩이 폭', value: (r) => num(r.hipWidthCm), width: 10 },
  { header: '신뢰도', value: (r) => num(r.confidence), width: 10 },
  { header: '측정 방식 버전', value: (r) => num(r.version), width: 14 },
  { header: '의상 코드', value: (r) => r.outfitCode ?? '', width: 10 },
  { header: '촬영 유형', value: (r) => (r.shotType ? (SHOT_TYPE_LABEL[r.shotType] ?? r.shotType) : ''), width: 10 },
  { header: '합성 성공', value: (r) => (r.isSuccess == null ? '' : r.isSuccess ? '성공' : '실패'), width: 10 },
  { header: '입력 키', value: (r) => num(r.shooter?.heightCm), width: 10 },
  {
    header: '성별',
    value: (r) => (r.shooter?.gender ? (GENDER_LABEL[r.shooter.gender] ?? r.shooter.gender) : ''),
    width: 8,
  },
  { header: '국적', value: (r) => r.shooter?.nationality ?? '', width: 8 },
  { header: '촬영자 정보 입력 시각', value: (r) => fmtFullDateTime(r.shooter?.submittedAt), width: 20 },
];

/**
 * 현재 필터로 `/export` 를 불러 `.xlsx` 로 내려받는다. 내려받은 행 수를 돌려준다(0 이면 파일을 만들지 않음).
 * 50,000행을 넘으면 서버가 400 을 내므로 호출부가 그 문구를 그대로 보여 준다.
 */
export async function downloadBodyMeasurementXlsx(
  filters: BodyMeasurementFilterParams,
  fileName: string,
): Promise<number> {
  const rows = await fetchBodyMeasurementExport(filters);
  if (rows.length === 0) return 0;
  downloadXlsx(fileName, '체형 측정', COLUMNS, rows);
  return rows.length;
}
