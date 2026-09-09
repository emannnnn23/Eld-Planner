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
    <div className="glass-card animate-fade-in-delay-2">
      {/* Header */}
      <div className="header-top mb-6">
        <div>
          <h2 className="text-h2 flex items-center gap-2">
            <FileText size={20} className="text-warning" />
            Daily ELD Log Sheets
          </h2>
          <p className="text-sm text-muted mt-1">
            Each day of your trip gets its own 24-hour log — just like the official FMCSA paper form.
          </p>
        </div>

        {/* Day Navigation */}
        <div className="flex items-center gap-2 p-2" style={{ background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            disabled={selectedDayIndex === 0}
            onClick={() => setSelectedDayIndex((prev) => Math.max(0, prev - 1))}
            style={{ padding: '6px', borderRadius: '8px', cursor: selectedDayIndex === 0 ? 'not-allowed' : 'pointer', opacity: selectedDayIndex === 0 ? 0.3 : 1, background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1" style={{ overflowX: 'auto' }}>
            {dailyLogs.map((log, idx) => (
              <button
                key={log.date}
                onClick={() => setSelectedDayIndex(idx)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: selectedDayIndex === idx ? 'bold' : '500',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: 'none',
                  background: selectedDayIndex === idx ? 'var(--accent)' : 'transparent',
                  color: selectedDayIndex === idx ? '#fff' : 'var(--text-muted)'
                }}
              >
                Day {log.day_number}
              </button>
            ))}
          </div>

          <button
            disabled={selectedDayIndex === dailyLogs.length - 1}
            onClick={() => setSelectedDayIndex((prev) => Math.min(dailyLogs.length - 1, prev + 1))}
            style={{ padding: '6px', borderRadius: '8px', cursor: selectedDayIndex === dailyLogs.length - 1 ? 'not-allowed' : 'pointer', opacity: selectedDayIndex === dailyLogs.length - 1 ? 0.3 : 1, background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* How to Read button */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="mb-4 text-xs flex items-center gap-1"
        style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <HelpCircle size={14} />
        {showHelp ? 'Hide guide' : 'How to read this chart'}
      </button>

      {showHelp && (
        <div className="mb-4 text-xs space-y-2 p-4" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)' }}>
          <p className="font-bold">Reading the Log Grid:</p>
          <p className="mt-1 mb-2">The chart shows 24 hours (midnight to midnight) across the top. The <span style={{ color: 'var(--accent-light)', fontWeight: 'bold' }}>green line</span> moves between four rows to show what the driver was doing at each hour:</p>
          <div className="grid-3 mt-2">
            <div className="flex items-center gap-2"><span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.4)' }}></span> <span><strong style={{ color: '#60a5fa' }}>Off Duty</strong> — Not working, resting</span></div>
            <div className="flex items-center gap-2"><span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(139,92,246,0.3)', border: '1px solid rgba(139,92,246,0.4)' }}></span> <span><strong style={{ color: '#c084fc' }}>Sleeper</strong> — In sleeper berth</span></div>
            <div className="flex items-center gap-2"><span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--accent-dim)', border: '1px solid var(--accent)' }}></span> <span><strong style={{ color: 'var(--accent-light)' }}>Driving</strong> — Behind the wheel</span></div>
            <div className="flex items-center gap-2"><span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(245,158,11,0.3)', border: '1px solid rgba(245,158,11,0.4)' }}></span> <span><strong style={{ color: '#fbbf24' }}>On Duty</strong> — Working but not driving</span></div>
          </div>
          <p className="mt-2">The <strong>TOTAL</strong> column on the right shows how many hours were spent in each status. All four rows always add up to exactly <strong>24.0 hours</strong>.</p>
        </div>
      )}

      {/* Day Metadata Bar */}
      <div className="flex flex-wrap items-center gap-5 p-4 mb-4 text-sm" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <div>
          <span className="text-xs text-muted">Date</span>
          <div className="font-mono font-bold text-accent">{date}</div>
        </div>
        <div>
          <span className="text-xs text-muted">Day</span>
          <div className="font-bold">{day_number} of {dailyLogs.length}</div>
        </div>
        <div>
          <span className="text-xs text-muted">Cycle Hours Used</span>
          <div className="font-mono font-bold" style={{ color: '#06b6d4' }}>{cycle_hours_end_of_day} / 70.0h</div>
        </div>
      </div>

      {/* SVG 24-Hour FMCSA Grid */}
      <div className="mb-6 p-4" style={{ overflowX: 'auto', background: 'var(--bg-base)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <svg viewBox="0 0 790 230" style={{ width: '100%', minWidth: '700px', height: 'auto', userSelect: 'none' }}>
          <rect x="0" y="0" width="790" height="230" fill="var(--bg-base)" rx="8" />

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
            <line key={idx} x1={gridLeft} y1={y} x2={gridLeft + gridWidth} y2={y} stroke="var(--bg-hover)" strokeWidth="1" />
          ))}
          {/* Top and bottom borders */}
          <line x1={gridLeft} y1="20" x2={gridLeft + gridWidth} y2="20" stroke="var(--bg-hover)" strokeWidth="1" />
          <line x1={gridLeft} y1="195" x2={gridLeft + gridWidth} y2="195" stroke="var(--bg-hover)" strokeWidth="1" />

          {/* Hour Labels & Vertical Grid Lines */}
          {Array.from({ length: 25 }).map((_, i) => {
            const x = gridLeft + i * hourWidth;
            let label = i;
            if (i === 0 || i === 24) label = 'M';
            else if (i === 12) label = 'N';
            else if (i > 12) label = i - 12;

            return (
              <g key={i}>
                <line x1={x} y1="20" x2={x} y2="195" stroke={i % 6 === 0 ? "rgba(255,255,255,0.2)" : "var(--bg-hover)"} strokeWidth={i % 6 === 0 ? "1.5" : "0.8"} />
                <text x={x} y="14" textAnchor="middle" fill={i % 6 === 0 ? "var(--text-main)" : "var(--text-muted)"} fontSize="9" fontWeight={i % 6 === 0 ? "700" : "500"} fontFamily="Inter, sans-serif">
                  {label}
                </text>
                {/* 15-min ticks */}
                {i < 24 && [1, 2, 3].map((t) => {
                  const tickX = x + (t * (hourWidth / 4));
                  return (
                    <line key={t} x1={tickX} y1="20" x2={tickX} y2="195" stroke="var(--bg-hover)" strokeWidth="0.5" strokeDasharray="2 3" />
                  );
                })}
              </g>
            );
          })}

          {/* Stepped Duty Status Line */}
          {dutyPathD && (
            <>
              <path d={dutyPathD} fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
              <path d={dutyPathD} fill="none" stroke="var(--accent-light)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {/* Right Summary Total Box */}
          <g transform={`translate(${gridLeft + gridWidth + 12}, 0)`}>
            <rect x="0" y="20" width="55" height="175" fill="var(--bg-input)" stroke="var(--border-color)" rx="6" />
            <text x="27.5" y="14" textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontWeight="bold" fontFamily="Inter, sans-serif">TOTAL</text>
            
            <text x="27.5" y="45" textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">{totals.off_duty || 0}</text>
            <text x="27.5" y="90" textAnchor="middle" fill="#c084fc" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">{totals.sleeper || 0}</text>
            <text x="27.5" y="135" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">{totals.driving || 0}</text>
            <text x="27.5" y="180" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">{totals.on_duty_not_driving || 0}</text>
            
            <line x1="8" y1="195" x2="47" y2="195" stroke="var(--border-color)" strokeWidth="1.5" />
            <text x="27.5" y="212" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="JetBrains Mono, monospace">24.0</text>
          </g>
        </svg>
      </div>

      {/* Daily Hours Summary Cards */}
      <div className="grid-3 mb-6">
        {Object.entries(STATUS_COLORS).map(([key, config]) => {
          const hours = totals[key] || 0;
          return (
            <div key={key} className="text-center p-3" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <div className="mb-1" style={{ fontSize: '1.25rem' }}>{config.emoji}</div>
              <div className="font-bold font-mono" style={{ color: config.line, fontSize: '1.25rem' }}>{hours}h</div>
              <div className="text-xs text-muted mt-1">{config.label}</div>
            </div>
          );
        })}
      </div>

      {/* Activity Timeline Table */}
      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Info size={16} className="text-accent" />
          Day {day_number} Activity Timeline
        </h3>
        
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <tr>
                <th style={{ padding: '12px', fontWeight: '500', borderBottom: '1px solid var(--border-color)' }}>Time</th>
                <th style={{ padding: '12px', fontWeight: '500', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                <th style={{ padding: '12px', fontWeight: '500', borderBottom: '1px solid var(--border-color)' }}>Duration</th>
                <th style={{ padding: '12px', fontWeight: '500', borderBottom: '1px solid var(--border-color)' }}>Activity</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg, i) => {
                let badgeStyle = { background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' };
                if (seg.status === 'driving') badgeStyle = { background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid var(--accent-dim)' };
                if (seg.status === 'on_duty_not_driving') badgeStyle = { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' };
                if (seg.status === 'sleeper') badgeStyle = { background: 'rgba(139,92,246,0.15)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.25)' };

                const config = STATUS_COLORS[seg.status] || STATUS_COLORS.off_duty;

                return (
                  <tr key={i} style={{ borderBottom: i === segments.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                    <td className="font-mono text-xs" style={{ padding: '12px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      {seg.start_time} – {seg.end_time}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge" style={badgeStyle}>
                        {config.emoji} <span style={{ marginLeft: '4px' }}>{config.label}</span>
                      </span>
                    </td>
                    <td className="font-mono text-sm font-bold" style={{ padding: '12px', color: config.line }}>
                      {seg.duration_hrs}h
                    </td>
                    <td className="text-xs" style={{ padding: '12px', color: 'var(--text-main)' }}>
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
