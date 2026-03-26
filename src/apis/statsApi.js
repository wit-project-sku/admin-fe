import { APIService } from './axios';

// Unity → 촬영 기록 전송
export const recordShot = async (payload) => {
  try {
    const res = await APIService.public.post('/stats/shots', payload);
    return res;
  } catch (err) {
    console.error('촬영 기록 실패:', err);
    throw err;
  }
};

// 관리자 → 통계 요약 조회
export const getStatsSummary = async () => {
  try {
    const res = await APIService.private.get('/admin/stats/summary');
    return res;
  } catch (err) {
    console.error('통계 요약 조회 실패:', err);
    throw err;
  }
};

// 관리자 → 월별 통계 조회
export const getStatsMonthly = async () => {
  try {
    const res = await APIService.private.get('/admin/stats/monthly');
    return res;
  } catch (err) {
    console.error('월별 통계 조회 실패:', err);
    throw err;
  }
};

// 관리자 → 일별 통계 조회
export const getStatsDaily = async (start, end) => {
  try {
    const res = await APIService.private.get('/admin/stats/daily', {
      params: { start, end },
    });
    return res;
  } catch (err) {
    console.error('일별 통계 조회 실패:', err);
    throw err;
  }
};
