import React, { useState } from 'react';
import { FileText, ChevronLeft, ChevronRight, Info } from 'lucide-react';

// ─── Grid constants matching official FMCSA form layout ───
const GRID_LEFT = 110;
const HOUR_WIDTH = 28;
const GRID_WIDTH = HOUR_WIDTH * 24; // 672
const GRID_TOP = 38;
const ROW_HEIGHT = 36;
const GRID_HEIGHT = ROW_HEIGHT * 4; // 144

// Duty line Y positions (vertical center of each row)
const STATUS_Y = {
  off_duty: GRID_TOP + ROW_HEIGHT * 0.5,          // 56
  sleeper: GRID_TOP + ROW_HEIGHT * 1.5,            // 92
  driving: GRID_TOP + ROW_HEIGHT * 2.5,            // 128
  on_duty_not_driving: GRID_TOP + ROW_HEIGHT * 3.5 // 164
};

const STATUS_META = {
  off_duty: { label: 'Off Duty', shortLabel: 'Off Duty' },
  sleeper: { label: 'Sleeper Berth', shortLabel: 'Sleeper' },
  driving: { label: 'Driving', shortLabel: 'Driving' },
  on_duty_not_driving: { label: 'On Duty (Not Driving)', shortLabel: 'On Duty' }
};

// ─── Paper form inline style (always looks like a printed form) ───
const paperStyle = {
  background: '#ffffff',
  color: '#000000',
  border: '2px solid #222',
  borderRadius: '2px',
  padding: '18px 22px 14px',
  fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
  fontSize: '11px',
  lineHeight: '1.4',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
};

export default function LogSheet({ dailyLogs, tripInputs, summary }) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  if (!dailyLogs || dailyLogs.length === 0) return null;

  const currentLog = dailyLogs[selectedDayIndex] || dailyLogs[0];
  const { date, day_number, segments, totals, cycle_hours_end_of_day } = currentLog;

  // Parse date
  const dateObj = new Date(date + 'T00:00:00');
  const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dayStr = String(dateObj.getDate()).padStart(2, '0');
  const yearStr = String(dateObj.getFullYear());

  // Estimate daily miles from driving hours
  const dailyMiles = totals.driving ? Math.round(totals.driving * 55) : 0;

  // ─── SVG duty-status stepped path ───
  const generateDutyPath = () => {
    if (!segments || segments.length === 0) return '';
    let path = '';
    let lastY = null;

    segments.forEach((seg, idx) => {
      const startX = GRID_LEFT + seg.start_decimal * HOUR_WIDTH;
      const endX = GRID_LEFT + seg.end_decimal * HOUR_WIDTH;
      const targetY = STATUS_Y[seg.status] || STATUS_Y.off_duty;

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

  // Hour label helper (matches paper form: Mid-night, 1-11, Noon, 1-11, Mid-night)
  const getHourLabel = (i) => {
    if (i === 0 || i === 24) return null; // "Mid-night" handled separately
    if (i === 12) return 'Noon';
    if (i > 12) return String(i - 12);
    return String(i);
  };

  // Total column X position
  const totalColX = GRID_LEFT + GRID_WIDTH + 10;
  const totalColW = 52;
  const svgWidth = totalColX + totalColW + 10;
  const svgHeight = GRID_TOP + GRID_HEIGHT + 30;

  return (
    <div className="glass-card animate-fade-in-delay-2">
      {/* ─── Section Header + Day Navigation ─── */}
      <div className="header-top mb-4">
        <div>
          <h2 className="text-h2 flex items-center gap-2">
            <FileText size={20} className="text-warning" />
            Driver's Daily Log
          </h2>
          <p className="text-sm text-muted mt-1">
            Official FMCSA-format log — one 24-hour sheet per calendar day.
          </p>
        </div>

        {/* Day tabs */}
        <div className="flex items-center gap-2 p-2" style={{ background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <button
            disabled={selectedDayIndex === 0}
            onClick={() => setSelectedDayIndex(prev => Math.max(0, prev - 1))}
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
                  padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem',
                  fontWeight: selectedDayIndex === idx ? 'bold' : '500',
                  whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
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
            onClick={() => setSelectedDayIndex(prev => Math.min(dailyLogs.length - 1, prev + 1))}
            style={{ padding: '6px', borderRadius: '8px', cursor: selectedDayIndex === dailyLogs.length - 1 ? 'not-allowed' : 'pointer', opacity: selectedDayIndex === dailyLogs.length - 1 ? 0.3 : 1, background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          PAPER FORM — always white/black like the real thing
         ════════════════════════════════════════════════════════ */}
      <div style={paperStyle}>

        {/* ─── Form Title Row ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.3px' }}>Driver's Daily Log</div>
            <div style={{ fontSize: '9px', color: '#444', marginTop: '1px' }}>(24 hours)</div>
          </div>

          {/* Date fields */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', fontSize: '13px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '1px 14px', fontWeight: 'bold', fontFamily: 'monospace' }}>{monthStr}</div>
              <div style={{ fontSize: '8px', color: '#666', marginTop: '1px' }}>(month)</div>
            </div>
            <span>/</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '1px 14px', fontWeight: 'bold', fontFamily: 'monospace' }}>{dayStr}</div>
              <div style={{ fontSize: '8px', color: '#666', marginTop: '1px' }}>(day)</div>
            </div>
            <span>/</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #000', padding: '1px 14px', fontWeight: 'bold', fontFamily: 'monospace' }}>{yearStr}</div>
              <div style={{ fontSize: '8px', color: '#666', marginTop: '1px' }}>(year)</div>
            </div>
          </div>

          {/* Filing instructions */}
          <div style={{ fontSize: '8px', textAlign: 'right', maxWidth: '190px', lineHeight: '1.35', color: '#333' }}>
            <div><strong>Original</strong> — File at home terminal.</div>
            <div><strong>Duplicate</strong> — Driver retains in his/her possession for 8 days.</div>
          </div>
        </div>

        {/* ─── From / To ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderBottom: '1px solid #000', paddingBottom: '6px', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px' }}>
            <strong>From:</strong>{' '}
            <span style={{ borderBottom: '1px solid #aaa', paddingBottom: '1px', marginLeft: '4px' }}>
              {tripInputs?.current_location || '—'}
            </span>
          </div>
          <div style={{ fontSize: '11px' }}>
            <strong>To:</strong>{' '}
            <span style={{ borderBottom: '1px solid #aaa', paddingBottom: '1px', marginLeft: '4px' }}>
              {tripInputs?.dropoff_location || '—'}
            </span>
          </div>
        </div>

        {/* ─── Info field grid ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', border: '1px solid #000', marginBottom: '14px' }}>
          <div style={{ borderRight: '1px solid #000', padding: '5px 8px' }}>
            <div style={{ fontSize: '8px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Total Miles Driving Today</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace' }}>{dailyMiles || '—'}</div>
          </div>
          <div style={{ borderRight: '1px solid #000', padding: '5px 8px' }}>
            <div style={{ fontSize: '8px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Total Mileage Today</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {summary?.total_distance_miles ? Math.round(summary.total_distance_miles).toLocaleString() : '—'}
            </div>
          </div>
          <div style={{ padding: '5px 8px' }}>
            <div style={{ fontSize: '8px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Name of Carrier or Carriers</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>ELD Trip Planner</div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            24-HOUR FMCSA GRID (SVG) — matches paper form
           ═══════════════════════════════════════════════ */}
        <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', minWidth: '720px', height: 'auto' }}>
            {/* Background */}
            <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#ffffff" />

            {/* ─── Row labels (numbered like the paper form) ─── */}
            <text x="6" y={STATUS_Y.off_duty - 4} fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">1. Off Duty</text>
            <text x="6" y={STATUS_Y.sleeper - 7} fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">2. Sleeper</text>
            <text x="18" y={STATUS_Y.sleeper + 5} fontSize="9" fontFamily="Arial, sans-serif" fill="#000">Berth</text>
            <text x="6" y={STATUS_Y.driving + 1} fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">3. Driving</text>
            <text x="6" y={STATUS_Y.on_duty_not_driving - 7} fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">4. On Duty</text>
            <text x="18" y={STATUS_Y.on_duty_not_driving + 5} fontSize="9" fontFamily="Arial, sans-serif" fill="#000">(not driving)</text>

            {/* ─── Grid outer border (thick) ─── */}
            <rect x={GRID_LEFT} y={GRID_TOP} width={GRID_WIDTH} height={GRID_HEIGHT} fill="none" stroke="#000" strokeWidth="2" />

            {/* ─── Horizontal row dividers ─── */}
            {[1, 2, 3].map(i => (
              <line
                key={`row-${i}`}
                x1={GRID_LEFT} y1={GRID_TOP + i * ROW_HEIGHT}
                x2={GRID_LEFT + GRID_WIDTH} y2={GRID_TOP + i * ROW_HEIGHT}
                stroke="#000" strokeWidth="1"
              />
            ))}

            {/* ─── "Mid-night" labels (stacked, at 0h and 24h) ─── */}
            <text x={GRID_LEFT} y={GRID_TOP - 16} textAnchor="middle" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">Mid-</text>
            <text x={GRID_LEFT} y={GRID_TOP - 7} textAnchor="middle" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">night</text>

            <text x={GRID_LEFT + GRID_WIDTH} y={GRID_TOP - 16} textAnchor="middle" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">Mid-</text>
            <text x={GRID_LEFT + GRID_WIDTH} y={GRID_TOP - 7} textAnchor="middle" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">night</text>

            {/* ─── Hour lines, labels, and 15-min ticks ─── */}
            {Array.from({ length: 25 }).map((_, i) => {
              const x = GRID_LEFT + i * HOUR_WIDTH;
              const isMajor = i === 0 || i === 6 || i === 12 || i === 18 || i === 24;
              const label = getHourLabel(i);

              return (
                <g key={`h-${i}`}>
                  {/* Vertical hour line */}
                  <line
                    x1={x} y1={GRID_TOP}
                    x2={x} y2={GRID_TOP + GRID_HEIGHT}
                    stroke="#000"
                    strokeWidth={isMajor ? '1.8' : '0.8'}
                  />

                  {/* Hour number label */}
                  {label && (
                    <text
                      x={x} y={GRID_TOP - 6}
                      textAnchor="middle"
                      fontSize={i === 12 ? '9' : '9'}
                      fontWeight={i === 12 || i === 6 || i === 18 ? 'bold' : 'normal'}
                      fontFamily="Arial, sans-serif"
                      fill="#000"
                    >
                      {label}
                    </text>
                  )}

                  {/* 15-minute tick marks within each hour */}
                  {i < 24 && [1, 2, 3].map(t => {
                    const tickX = x + t * (HOUR_WIDTH / 4);
                    const isHalf = t === 2;
                    return (
                      <line
                        key={`t-${t}`}
                        x1={tickX} y1={GRID_TOP}
                        x2={tickX} y2={GRID_TOP + GRID_HEIGHT}
                        stroke="#000"
                        strokeWidth={isHalf ? '0.4' : '0.25'}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* ─── Stepped duty status line (the main data line) ─── */}
            {dutyPathD && (
              <path
                d={dutyPathD}
                fill="none"
                stroke="#000"
                strokeWidth="2.5"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
            )}

            {/* ─── Total Hours column (right side) ─── */}
            <g>
              {/* Column border */}
              <rect
                x={totalColX} y={GRID_TOP - 20}
                width={totalColW} height={GRID_HEIGHT + 20}
                fill="none" stroke="#000" strokeWidth="2"
              />

              {/* "Total Hours" header */}
              <text x={totalColX + totalColW / 2} y={GRID_TOP - 9} textAnchor="middle" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">Total</text>
              <text x={totalColX + totalColW / 2} y={GRID_TOP - 1} textAnchor="middle" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">Hours</text>

              {/* Row dividers inside total column */}
              {[0, 1, 2, 3].map(i => (
                <line
                  key={`td-${i}`}
                  x1={totalColX} y1={GRID_TOP + i * ROW_HEIGHT}
                  x2={totalColX + totalColW} y2={GRID_TOP + i * ROW_HEIGHT}
                  stroke="#000" strokeWidth={i === 0 ? '2' : '1'}
                />
              ))}

              {/* Hour values */}
              <text x={totalColX + totalColW / 2} y={STATUS_Y.off_duty + 4} textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">
                {totals.off_duty || 0}
              </text>
              <text x={totalColX + totalColW / 2} y={STATUS_Y.sleeper + 4} textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">
                {totals.sleeper || 0}
              </text>
              <text x={totalColX + totalColW / 2} y={STATUS_Y.driving + 4} textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">
                {totals.driving || 0}
              </text>
              <text x={totalColX + totalColW / 2} y={STATUS_Y.on_duty_not_driving + 4} textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000">
                {totals.on_duty_not_driving || 0}
              </text>

              {/* ─── Total sum row below the column ─── */}
              <line
                x1={totalColX} y1={GRID_TOP + GRID_HEIGHT}
                x2={totalColX + totalColW} y2={GRID_TOP + GRID_HEIGHT}
                stroke="#000" strokeWidth="2"
              />
              <rect
                x={totalColX} y={GRID_TOP + GRID_HEIGHT}
                width={totalColW} height={22}
                fill="none" stroke="#000" strokeWidth="2"
              />
              <text
                x={totalColX + totalColW / 2} y={GRID_TOP + GRID_HEIGHT + 15}
                textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000"
              >
                24.0
              </text>
            </g>
          </svg>
        </div>

        {/* ─── Remarks ─── */}
        <div style={{ borderTop: '2px solid #000', paddingTop: '6px', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>Remarks</div>
          <div style={{ minHeight: '50px', fontSize: '10px', lineHeight: '1.7', paddingLeft: '4px' }}>
            {segments
              .filter(s => s.name !== 'Off Duty')
              .map((seg, i) => (
                <div key={i} style={{ borderBottom: '1px solid #ddd', paddingBottom: '1px', marginBottom: '1px' }}>
                  <strong>{seg.start_time} – {seg.end_time}</strong>
                  {' '}{seg.name}
                  {seg.location && seg.location !== 'Off Duty' && seg.location !== seg.name
                    ? ` — ${seg.location}`
                    : ''
                  }
                </div>
              ))}
          </div>
        </div>

        {/* ─── Shipping Documents ─── */}
        <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>Shipping Documents:</div>
          <div style={{ fontSize: '9px', color: '#555', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', paddingLeft: '4px' }}>
            <div><strong>DVL or Manifest No.:</strong> {tripInputs ? 'AUTO-GENERATED' : '—'}</div>
            <div><strong>Shipper & Commodity:</strong> {tripInputs ? `${tripInputs.pickup_location} → ${tripInputs.dropoff_location}` : '—'}</div>
          </div>
        </div>

        {/* ─── Recap: 70 Hour / 8 Day ─── */}
        <div style={{ borderTop: '2px solid #000', paddingTop: '6px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: '0', border: '1px solid #000', fontSize: '9px' }}>
            {/* Label column */}
            <div style={{ borderRight: '1px solid #000', padding: '4px 8px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div>Recap:</div>
              <div style={{ fontSize: '8px', color: '#555' }}>Complete at</div>
              <div style={{ fontSize: '8px', color: '#555' }}>end of day</div>
            </div>

            {/* 70 Hour / 8 Day column */}
            <div style={{ borderRight: '1px solid #000', padding: '4px 8px' }}>
              <div style={{ fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '3px' }}>
                70 Hour / 8 Day
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '9px' }}>
                <div>
                  <div style={{ fontSize: '7px', color: '#555' }}>Hours on duty last 7/8 days</div>
                  <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '12px' }}>{cycle_hours_end_of_day}</div>
                </div>
                <div>
                  <div style={{ fontSize: '7px', color: '#555' }}>Available hours</div>
                  <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '12px' }}>{Math.max(0, 70 - cycle_hours_end_of_day).toFixed(1)}</div>
                </div>
              </div>
            </div>

            {/* On Duty hours column */}
            <div style={{ borderRight: '1px solid #000', padding: '4px 8px' }}>
              <div style={{ fontSize: '7px', color: '#555' }}>On duty hours today</div>
              <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '12px' }}>
                {((totals.driving || 0) + (totals.on_duty_not_driving || 0)).toFixed(1)}
              </div>
              <div style={{ fontSize: '7px', color: '#555', marginTop: '2px' }}>
                Total lines 3 & 4
              </div>
            </div>

            {/* Driving hours column */}
            <div style={{ padding: '4px 8px' }}>
              <div style={{ fontSize: '7px', color: '#555' }}>Driving hours today</div>
              <div style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '12px' }}>
                {totals.driving || 0}
              </div>
              <div style={{ fontSize: '7px', color: '#555', marginTop: '2px' }}>
                Total line 3
              </div>
            </div>
          </div>
        </div>

        {/* ─── Footer instruction text ─── */}
        <div style={{ marginTop: '8px', fontSize: '8px', color: '#555', textAlign: 'center', borderTop: '1px solid #bbb', paddingTop: '5px' }}>
          Enter name of place you reported and where released from work and when and where each change of duty occurred.
          Use time standard of home terminal.
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          ACTIVITY TIMELINE (app-themed, below the form)
         ═══════════════════════════════════════════════ */}
      <div className="mt-6">
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
                const meta = STATUS_META[seg.status] || STATUS_META.off_duty;
                const statusColors = {
                  off_duty: { bg: 'rgba(59,130,246,0.12)', fg: '#3b82f6', border: 'rgba(59,130,246,0.25)' },
                  sleeper: { bg: 'rgba(139,92,246,0.12)', fg: '#8b5cf6', border: 'rgba(139,92,246,0.25)' },
                  driving: { bg: 'rgba(16,185,129,0.12)', fg: '#10b981', border: 'rgba(16,185,129,0.25)' },
                  on_duty_not_driving: { bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b', border: 'rgba(245,158,11,0.25)' }
                };
                const colors = statusColors[seg.status] || statusColors.off_duty;

                return (
                  <tr key={i} style={{ borderBottom: i === segments.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                    <td className="font-mono text-xs" style={{ padding: '12px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      {seg.start_time} – {seg.end_time}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge" style={{ background: colors.bg, color: colors.fg, border: `1px solid ${colors.border}` }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="font-mono text-sm font-bold" style={{ padding: '12px', color: colors.fg }}>
                      {seg.duration_hrs}h
                    </td>
                    <td className="text-xs" style={{ padding: '12px', color: 'var(--text-main)' }}>
                      {seg.name === 'Off Duty' ? 'Off Duty / Resting' : seg.name}
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
