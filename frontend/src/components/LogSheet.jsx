import React, { useState } from 'react';
import { FileText, ChevronLeft, ChevronRight, Info, HelpCircle } from 'lucide-react';

const STATUS_Y_MAP = {
  off_duty: 40,
  sleeper: 85,
  driving: 130,
  on_duty_not_driving: 175
};

const STATUS_COLORS = {
  off_duty: { line: '#60a5fa', fill: 'rgba(59,130,246,0.08)', label: 'Off Duty', emoji: '🏠' },
  sleeper: { line: '#c084fc', fill: 'rgba(139,92,246,0.08)', label: 'Sleeper Berth', emoji: '🛏️' },
  driving: { line: '#34d399', fill: 'rgba(16,185,129,0.08)', label: 'Driving', emoji: '🚛' },
  on_duty_not_driving: { line: '#fbbf24', fill: 'rgba(245,158,11,0.08)', label: 'On Duty (Not Driving)', emoji: '📋' }
};

export default function LogSheet({ dailyLogs, tripInputs, summary }) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  if (!dailyLogs || dailyLogs.length === 0) return null;

  const currentLog = dailyLogs[selectedDayIndex] || dailyLogs[0];
  const { date, day_number, segments, totals, cycle_hours_end_of_day } = currentLog;

  // Grid SVG parameters
  const gridLeft = 120;
  const gridWidth = 600;
  const hourWidth = 25;

  // Calculate SVG stepped path
  const generateDutyPath = () => {
    if (!segments || segments.length === 0) return '';
    let path = '';
    let lastY = null;

    segments.forEach((seg, idx) => {
      const startX = gridLeft + (seg.start_decimal * hourWidth);
      const endX = gridLeft + (seg.end_decimal * hourWidth);
      const targetY = STATUS_Y_MAP[seg.status] || STATUS_Y_MAP.off_duty;

      if (idx === 0) {
        path += `M ${startX} ${targetY} L ${endX} ${targetY}`;
      } else {
        if (lastY !== targetY) {
          path += ` L ${startX} ${targetY}`;
        }
        path += ` L ${endX} ${targetY}`;
      }
      lastY = targetY;
    });
    return path;
  };

  const dutyPathD = generateDutyPath();

  // Format segment name to be friendlier
  const friendlyName = (seg) => {
    if (seg.name === 'Off Duty') return 'Off Duty / Resting';
    return seg.name;
  };

  return (
    <div className="glass-card p-6 shadow-2xl animate-fade-in-delay-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Daily ELD Log Sheets
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Each day of your trip gets its own 24-hour log — just like the official FMCSA paper form.
          </p>
        </div>

        {/* Day Navigation */}
        <div className="flex items-center gap-2 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800">
          <button
            disabled={selectedDayIndex === 0}
            onClick={() => setSelectedDayIndex((prev) => Math.max(0, prev - 1))}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 overflow-x-auto">
            {dailyLogs.map((log, idx) => (
              <button
                key={log.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  selectedDayIndex === idx
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Day {log.day_number}
              </button>
            ))}
          </div>

          <button
            disabled={selectedDayIndex === dailyLogs.length - 1}
            onClick={() => setSelectedDayIndex((prev) => Math.min(dailyLogs.length - 1, prev + 1))}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* How to Read button */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="mb-4 text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        {showHelp ? 'Hide guide' : 'How to read this chart'}
      </button>

      {showHelp && (
        <div className="mb-4 bg-gray-900/80 border border-gray-700 rounded-xl p-4 text-xs text-gray-300 space-y-2">
          <p className="font-semibold text-white">Reading the Log Grid:</p>
          <p>The chart shows 24 hours (midnight to midnight) across the top. The <span className="text-emerald-400 font-semibold">green line</span> moves between four rows to show what the driver was doing at each hour:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-blue-500/30 border border-blue-500/40"></span> <span><strong className="text-blue-400">Off Duty</strong> — Not working, resting</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-purple-500/30 border border-purple-500/40"></span> <span><strong className="text-purple-400">Sleeper</strong> — In sleeper berth</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/40"></span> <span><strong className="text-emerald-400">Driving</strong> — Behind the wheel</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/40"></span> <span><strong className="text-amber-400">On Duty</strong> — Working but not driving (loading, fueling, etc.)</span></div>
          </div>
          <p className="mt-2">The <strong>TOTAL</strong> column on the right shows how many hours were spent in each status. All four rows always add up to exactly <strong>24.0 hours</strong>.</p>
        </div>
      )}

      {/* Day Metadata Bar */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
        <div>
          <span className="text-gray-500 text-xs">Date</span>
          <div className="font-mono font-bold text-emerald-400">{date}</div>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Day</span>
          <div className="font-bold text-white">{day_number} of {dailyLogs.length}</div>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Cycle Hours Used</span>
          <div className="font-mono font-bold text-cyan-400">{cycle_hours_end_of_day} / 70.0h</div>
        </div>
      </div>

      {/* SVG 24-Hour FMCSA Grid */}
      <div className="overflow-x-auto bg-gray-950/80 p-4 rounded-xl border border-gray-800 mb-6">
        <svg viewBox="0 0 790 230" className="w-full min-w-[700px] h-auto select-none">
          <rect x="0" y="0" width="790" height="230" fill="#0a0f1a" rx="8" />

          {/* Row Labels */}
          <g>
            <text x="12" y="44" fill="#60a5fa" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">OFF DUTY</text>
            <text x="12" y="89" fill="#c084fc" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">SLEEPER</text>
            <text x="12" y="134" fill="#34d399" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">DRIVING</text>
            <text x="12" y="179" fill="#fbbf24" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">ON DUTY</text>
          </g>

          {/* Row background shading */}
          <rect x={gridLeft} y="20" width={gridWidth} height="22.5" fill="rgba(59,130,246,0.04)" />
          <rect x={gridLeft} y="62.5" width={gridWidth} height="22.5" fill="rgba(139,92,246,0.04)" />
          <rect x={gridLeft} y="107.5" width={gridWidth} height="22.5" fill="rgba(16,185,129,0.04)" />
          <rect x={gridLeft} y="152.5" width={gridWidth} height="22.5" fill="rgba(245,158,11,0.04)" />

          {/* Horizontal Grid Rows */}
          {[40, 85, 130, 175].map((y, idx) => (
            <line key={idx} x1={gridLeft} y1={y} x2={gridLeft + gridWidth} y2={y} stroke="#1e293b" strokeWidth="1" />
          ))}
          {/* Top and bottom borders */}
          <line x1={gridLeft} y1="20" x2={gridLeft + gridWidth} y2="20" stroke="#1e293b" strokeWidth="1" />
          <line x1={gridLeft} y1="195" x2={gridLeft + gridWidth} y2="195" stroke="#1e293b" strokeWidth="1" />

          {/* Hour Labels & Vertical Grid Lines */}
          {Array.from({ length: 25 }).map((_, i) => {
            const x = gridLeft + i * hourWidth;
            let label = i;
            if (i === 0 || i === 24) label = 'M';
            else if (i === 12) label = 'N';
            else if (i > 12) label = i - 12;

            return (
              <g key={i}>
                <line x1={x} y1="20" x2={x} y2="195" stroke={i % 6 === 0 ? "#334155" : "#1e293b"} strokeWidth={i % 6 === 0 ? "1.5" : "0.8"} />
                <text x={x} y="14" textAnchor="middle" fill={i % 6 === 0 ? "#e2e8f0" : "#64748b"} fontSize="9" fontWeight={i % 6 === 0 ? "700" : "500"} fontFamily="Inter, sans-serif">
                  {label}
                </text>
                {/* 15-min ticks */}
                {i < 24 && [1, 2, 3].map((t) => {
                  const tickX = x + (t * (hourWidth / 4));
                  return (
                    <line key={t} x1={tickX} y1="20" x2={tickX} y2="195" stroke="#111827" strokeWidth="0.5" strokeDasharray="2 3" />
                  );
                })}
              </g>
            );
          })}

          {/* Stepped Duty Status Line */}
          {dutyPathD && (
            <>
              <path d={dutyPathD} fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
              <path d={dutyPathD} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {/* Right Summary Total Box */}
          <g transform={`translate(${gridLeft + gridWidth + 12}, 0)`}>
            <rect x="0" y="20" width="55" height="175" fill="#111827" stroke="#1e293b" rx="6" />
            <text x="27.5" y="14" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="Inter, sans-serif">TOTAL</text>
            
            <text x="27.5" y="45" textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">{totals.off_duty || 0}</text>
            <text x="27.5" y="90" textAnchor="middle" fill="#c084fc" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">{totals.sleeper || 0}</text>
            <text x="27.5" y="135" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">{totals.driving || 0}</text>
            <text x="27.5" y="180" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">{totals.on_duty_not_driving || 0}</text>
            
            <line x1="8" y1="195" x2="47" y2="195" stroke="#374151" strokeWidth="1.5" />
            <text x="27.5" y="212" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">24.0</text>
          </g>
        </svg>
      </div>

      {/* Daily Hours Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUS_COLORS).map(([key, config]) => {
          const hours = totals[key] || 0;
          return (
            <div key={key} className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-lg mb-0.5">{config.emoji}</div>
              <div className="text-xl font-bold font-mono" style={{ color: config.line }}>{hours}h</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{config.label}</div>
            </div>
          );
        })}
      </div>

      {/* Activity Timeline Table */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          Day {day_number} Activity Timeline
        </h3>
        
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900/90 text-gray-400 border-b border-gray-800 text-xs">
              <tr>
                <th className="p-3 font-medium">Time</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Duration</th>
                <th className="p-3 font-medium">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {segments.map((seg, i) => {
                let badgeClass = 'badge-off-duty';
                if (seg.status === 'driving') badgeClass = 'badge-driving';
                if (seg.status === 'on_duty_not_driving') badgeClass = 'badge-on-duty';
                if (seg.status === 'sleeper') badgeClass = 'badge-sleeper';

                const config = STATUS_COLORS[seg.status] || STATUS_COLORS.off_duty;

                return (
                  <tr key={i} className="hover:bg-gray-800/30 transition">
                    <td className="p-3 text-gray-300 font-mono text-xs whitespace-nowrap">
                      {seg.start_time} – {seg.end_time}
                    </td>
                    <td className="p-3">
                      <span className={badgeClass}>
                        {config.emoji} {config.label}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-sm font-semibold" style={{ color: config.line }}>
                      {seg.duration_hrs}h
                    </td>
                    <td className="p-3 text-gray-300 text-xs">
                      {friendlyName(seg)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
