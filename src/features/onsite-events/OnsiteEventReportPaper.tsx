import type { OnsiteEventDayCount, OnsiteEventStatsDto } from '../../hooks/onsite-event-api/onsiteEventTypes';
import {
  formatAverage,
  formatCount,
  formatDateWithWeekday,
  formatMonthDay,
  weekdayOf,
} from './onsiteEventFormat';
import s from './OnsiteEvents.module.css';

function DayKpi({ label, day }: { label: string; day: OnsiteEventDayCount | null }) {
  return (
    <div className={s.kpi}>
      <small>{label}</small>
      {day ? (
        <>
          <b>
            {formatMonthDay(day.date)}
            <em>({weekdayOf(day.date)})</em>
          </b>
          <span>{formatCount(day.count)}건</span>
        </>
      ) : (
        <>
          <b>—</b>
          <span>촬영 없음</span>
        </>
      )}
    </div>
  );
}

/**
 * 행사 촬영 리포트 한 장 — 화면에 보이는 이 종이가 그대로 PDF 가 된다.
 * `data-report-root` 는 통계 리포트와 같은 내보내기(reportExport.exportReportPdf)가 찾는 표식이다.
 * 드롭다운·버튼은 이 종이 밖에 두어 PDF 에 들어가지 않는다.
 */
export function OnsiteEventReportPaper({ stats }: { stats: OnsiteEventStatsDto }) {
  const { event, days } = stats;
  const memo = event.memo?.trim();

  return (
    <div className={s.paper} data-report-root data-report-title='행사촬영리포트'>
      <div data-report-keep>
        <div className={s.eyebrow}>행사 촬영 리포트</div>
        <div className={s.title}>{event.name}</div>
        <div className={s.sub}>
          {event.startDate} ~ {event.endDate} · {event.dayCount}일
        </div>
      </div>

      <div className={s.info} data-report-keep>
        <div>
          <small>행사 지점</small>
          <b>{event.venue}</b>
        </div>
        <div>
          <small>사용 콘텐츠</small>
          <b>{event.contentLabel}</b>
        </div>
        <div>
          <small>기간</small>
          <b>{event.dayCount}일</b>
        </div>
      </div>

      <div className={s.kpis} data-report-keep>
        <div className={`${s.kpi} ${s.kpiLead}`}>
          <small>총 촬영</small>
          <b>
            {formatCount(stats.totalShots)}
            <em>건</em>
          </b>
          <span>{stats.elapsedDays}일 합계</span>
        </div>
        <div className={s.kpi}>
          <small>일평균</small>
          <b>
            {formatAverage(stats.dailyAverage)}
            <em>건</em>
          </b>
          <span>운영 {stats.elapsedDays}일 기준</span>
        </div>
        <DayKpi label='최다 촬영일' day={stats.peakDay} />
        <DayKpi label='최소 촬영일' day={stats.lowestDay} />
      </div>

      <div className={s.sectionHead}>일별 촬영</div>
      <table className={s.dayTable}>
        <thead>
          <tr>
            <th>날짜</th>
            <th className={s.r}>촬영</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <td>{formatDateWithWeekday(d.date)}</td>
              <td className={s.r}>{formatCount(d.count)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>합계</td>
            <td className={s.r}>{formatCount(stats.totalShots)}</td>
          </tr>
        </tfoot>
      </table>

      {memo ? (
        <div className={s.memo} data-report-keep>
          <small>메모</small>
          {memo}
        </div>
      ) : null}
    </div>
  );
}
