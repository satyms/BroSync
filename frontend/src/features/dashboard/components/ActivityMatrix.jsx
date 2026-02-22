import { useMemo, useState, useCallback } from 'react';
import { format, subDays, eachDayOfInterval, getDay } from 'date-fns';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Cell size + gap in px (must match the Tailwind classes below)
const CELL = 13; // w-3 = 12px + gap-1 = 4px → 12+4 = 16... we use 13 for label offset math

function getColor(count) {
  if (!count || count === 0) return 'bg-[#E2E8F0] dark:bg-[#1E293B] border border-[#CBD5E1]/40 dark:border-[#334155]/40';
  if (count === 1)            return 'bg-blue-500/25 border border-blue-500/30';
  if (count === 2)            return 'bg-blue-500/45 border border-blue-500/50';
  if (count === 3)            return 'bg-blue-500/65 border border-blue-500/70';
  if (count <= 5)             return 'bg-blue-500/85 border border-blue-500/90';
  return                             'bg-blue-500 border border-blue-600 shadow-sm shadow-blue-500/30';
}

/**
 * ActivityMatrix - GitHub-style contribution heatmap.
 * Props:
 *   data    – { "2025-01-15": 3, ... }  (real API data, keyed by yyyy-MM-dd)
 *   loading – boolean
 */
export default function ActivityMatrix({ data = {}, loading = false }) {
  const today = new Date();
  const startDate = subDays(today, 364);

  // tooltip state: { day, x, y } or null
  const [tooltip, setTooltip] = useState(null);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: today }).map((date) => {
      const key = format(date, 'yyyy-MM-dd');
      return { date, key, count: data[key] ?? 0 };
    });
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pad so the first column starts on Sunday
  const startDow = getDay(days[0].date);
  const padded = [...Array(startDow).fill(null), ...days];

  // Split into 7-row columns (weeks)
  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  // Month labels: find the first week index where each month starts
  const monthLabels = useMemo(() => {
    const seen = new Set();
    const labels = [];
    weeks.forEach((week, wi) => {
      const firstReal = week.find(Boolean);
      if (!firstReal) return;
      const m = firstReal.date.getMonth();
      const y = firstReal.date.getFullYear();
      const key = `${y}-${m}`;
      if (!seen.has(key)) {
        seen.add(key);
        labels.push({ wi, label: MONTHS[m] });
      }
    });
    return labels;
  }, [weeks]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSubmissions = Object.values(data).reduce((s, v) => s + v, 0);
  const activeDays = Object.values(data).filter((v) => v > 0).length;

  // Calculate current streak
  const streak = useMemo(() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) s++;
      else break;
    }
    return s;
  }, [days]);

  const handleMouseEnter = useCallback((e, day) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const gridRect = e.currentTarget.closest('.activity-grid-root').getBoundingClientRect();
    setTooltip({
      day,
      // position relative to the grid container
      x: rect.left - gridRect.left + rect.width / 2,
      y: rect.top - gridRect.top,
    });
  }, []);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-28 bg-[#E2E8F0] dark:bg-[#0F172A] rounded-lg" />
        <div className="h-3 w-48 bg-[#E2E8F0] dark:bg-[#0F172A] rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="flex items-center gap-4 text-xs text-[#64748B] mb-1">
        <span><span className="text-[#0F172A] dark:text-[#E2E8F0] font-semibold">{totalSubmissions}</span> submissions in the last year</span>
        <span className="text-[#CBD5E1] dark:text-[#334155]">·</span>
        <span><span className="text-[#0F172A] dark:text-[#E2E8F0] font-semibold">{activeDays}</span> active days</span>
        {streak > 0 && (
          <>
            <span className="text-[#CBD5E1] dark:text-[#334155]">·</span>
            <span className="text-blue-500 font-semibold">{streak}🔥 day streak</span>
          </>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-1">
        {/* activity-grid-root: anchor for tooltip absolute positioning */}
        <div className="relative activity-grid-root">

          {/* Month labels — absolutely positioned so they span freely over columns */}
          <div className="relative min-w-max h-4 mb-1">
            {monthLabels.map(({ wi, label }) => (
              <span
                key={`${wi}-${label}`}
                className="absolute text-[10px] text-[#64748B] select-none whitespace-nowrap"
                style={{ left: wi * (12 + 4) }}  /* cell 12px + gap 4px = 16px per column */
              >
                {label}
              </span>
            ))}
          </div>

          {/* Cells */}
          <div className="flex gap-1 min-w-max">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) =>
                  day === null ? (
                    <div key={di} className="w-3 h-3" />
                  ) : (
                    <div
                      key={di}
                      onMouseEnter={(e) => handleMouseEnter(e, day)}
                      onMouseLeave={handleMouseLeave}
                      className={`w-3 h-3 rounded-sm ${getColor(day.count)} transition-colors cursor-pointer`}
                    />
                  )
                )}
              </div>
            ))}
          </div>

          {/* Floating tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-full"
              style={{ left: tooltip.x, top: tooltip.y - 6 }}
            >
              <div className="bg-[#0F172A] dark:bg-[#E2E8F0] text-[#E2E8F0] dark:text-[#0F172A] text-[11px] font-medium rounded-md px-2.5 py-1.5 shadow-xl whitespace-nowrap flex flex-col items-center gap-0.5">
                <span className="font-bold">
                  {tooltip.day.count === 0
                    ? 'No submissions'
                    : `${tooltip.day.count} submission${tooltip.day.count !== 1 ? 's' : ''}`}
                </span>
                <span className="opacity-70 text-[10px]">
                  {format(tooltip.day.date, 'MMM d, yyyy')}
                </span>
              </div>
              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-2 h-2 bg-[#0F172A] dark:bg-[#E2E8F0] rotate-45 -mt-1" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-[#64748B]">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4, 6].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-sm ${getColor(c)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
