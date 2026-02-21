import { useMemo } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';

/**
 * ActivityMatrix - GitHub-style contribution heatmap for the last 52 weeks.
 * Uses mock data; in production, replace with real API data.
 */
export default function ActivityMatrix({ data = {} }) {
  const today = new Date();
  const startDate = subDays(today, 364);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: today }).map((date) => {
      const key = format(date, 'yyyy-MM-dd');
      const count = data[key] ?? Math.random() < 0.4 ? Math.floor(Math.random() * 5) : 0;
      return { date, key, count };
    });
  }, [data]);

  // Pad to start on Sunday
  const startDow = days[0]?.date.getDay() ?? 0;
  const padded = [...Array(startDow).fill(null), ...days];

  // Split into weeks
  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const getColor = (count) => {
    if (count === 0 || count == null) return 'bg-[#E2E8F0] dark:bg-[#253347]';
    if (count === 1) return 'bg-blue-500/30';
    if (count === 2) return 'bg-blue-500/50';
    if (count === 3) return 'bg-blue-500/70';
    return 'bg-blue-500';
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-3">
      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) =>
                day === null ? (
                  <div key={di} className="w-3 h-3" />
                ) : (
                  <div
                    key={di}
                    title={`${day.key}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
                    className={`w-3 h-3 rounded-sm ${getColor(day.count)} transition-colors cursor-default`}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-[#64748B]">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-sm ${getColor(c)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
