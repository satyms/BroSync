import { useSelector } from 'react-redux';

/**
 * StatsDonut - Circular progress chart showing solved problems breakdown.
 * Pure CSS/SVG implementation matching the landing page style.
 */
export default function StatsDonut({ easy, medium, hard, total }) {
  const theme = useSelector((s) => s.ui.theme);
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const grandTotal = 680 + 1350 + 420; // total problems available
  const easyPct = easy / grandTotal;
  const mediumPct = medium / grandTotal;
  const hardPct = hard / grandTotal;

  // Offsets (stacked)
  const easyDash = circumference * easyPct;
  const mediumDash = circumference * mediumPct;
  const hardDash = circumference * hardPct;

  const easyOffset = 0;
  const mediumOffset = -(easyDash);
  const hardOffset = -(easyDash + mediumDash);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={theme === 'dark' ? '#253347' : '#E2E8F0'}
            strokeWidth={strokeWidth}
          />
          {/* Easy - green */}
          {easy > 0 && (
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke="#27ae60"
              strokeWidth={strokeWidth}
              strokeDasharray={`${easyDash} ${circumference - easyDash}`}
              strokeDashoffset={easyOffset}
              strokeLinecap="round"
            />
          )}
          {/* Medium - orange */}
          {medium > 0 && (
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke="#f39c12"
              strokeWidth={strokeWidth}
              strokeDasharray={`${mediumDash} ${circumference - mediumDash}`}
              strokeDashoffset={mediumOffset}
              strokeLinecap="round"
            />
          )}
          {/* Hard - red */}
          {hard > 0 && (
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke="#e74c3c"
              strokeWidth={strokeWidth}
              strokeDasharray={`${hardDash} ${circumference - hardDash}`}
              strokeDashoffset={hardOffset}
              strokeLinecap="round"
            />
          )}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#0F172A] dark:text-[#E2E8F0] font-mono">{total}</span>
          <span className="text-[#64748B] text-xs tracking-widest">SOLVED</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-[#64748B]">Easy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-[#64748B]">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-[#64748B]">Hard</span>
        </div>
      </div>
    </div>
  );
}
