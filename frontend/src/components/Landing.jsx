import React from 'react';
import '../landing.css';

// One example day, as the planner would log it: [status row, start hour, end hour]
const DAY = [
  [1, 0, 5.5],    // sleeper
  [3, 5.5, 7],    // on duty: pre-trip + pickup
  [2, 7, 15],     // driving
  [0, 15, 15.5],  // off duty: 30-min break
  [3, 15.5, 16],  // on duty: fuel
  [2, 16, 19],    // driving
  [3, 19, 19.5],  // on duty: post-trip
  [1, 19.5, 24],  // sleeper: 10-hour reset
];

const ROWS = ['Off duty', 'Sleeper berth', 'Driving', 'On duty (not driving)'];
const TOTALS = ['0.5', '10', '11', '2.5'];

const NOTES = [
  { at: 6, row: 3, text: 'Pickup, Indianapolis' },
  { at: 15, row: 0, text: '30-min break' },
  { at: 15.75, row: 3, text: 'Fuel' },
  { at: 19.5, row: 1, text: '10-hour reset' },
];

const GRID_X = 168;
const HOUR_W = 40;
const ROW_TOP = 44;
const ROW_H = 46;
const x = (h) => GRID_X + h * HOUR_W;
const y = (row) => ROW_TOP + row * ROW_H + ROW_H / 2;

const LINE = DAY.map(([row, start, end], i) =>
  `${i === 0 ? `M${x(start)} ${y(row)}` : `V${y(row)}`} H${x(end)}`
).join(' ');

const DRAW_SECONDS = 2.6;

function hourLabel(h) {
  if (h === 0 || h === 24) return 'Mid';
  if (h === 12) return 'Noon';
  return String(h % 12);
}

function LogGrid() {
  const gridRight = x(24);
  const gridBottom = ROW_TOP + ROWS.length * ROW_H;

  return (
    <svg
      className="lp-grid"
      viewBox={`0 0 1240 ${gridBottom + 64}`}
      role="img"
      aria-label="Example daily log: 10 hours sleeper berth, 11 hours driving, 2.5 hours on duty, half an hour off duty for a break."
    >
      {Array.from({ length: 25 }, (_, h) => (
        <text key={`h${h}`} className="lp-grid-hour" x={x(h)} y={ROW_TOP - 14} textAnchor="middle">
          {hourLabel(h)}
        </text>
      ))}
      <text className="lp-grid-hour" x={gridRight + 44} y={ROW_TOP - 14} textAnchor="middle">Total</text>

      {ROWS.map((label, r) => (
        <g key={label}>
          <rect className="lp-grid-row" x={GRID_X} y={ROW_TOP + r * ROW_H} width={24 * HOUR_W} height={ROW_H} />
          <text className="lp-grid-label" x={GRID_X - 14} y={y(r) + 5} textAnchor="end">{label}</text>
          <text className="lp-grid-total" x={gridRight + 44} y={y(r) + 6} textAnchor="middle">{TOTALS[r]}</text>
        </g>
      ))}

      {Array.from({ length: 24 * 4 + 1 }, (_, q) => {
        const qx = GRID_X + q * (HOUR_W / 4);
        const isHour = q % 4 === 0;
        return ROWS.map((_, r) => {
          const top = ROW_TOP + r * ROW_H;
          return isHour ? (
            <line key={`q${q}r${r}`} className="lp-grid-hourline" x1={qx} x2={qx} y1={top} y2={top + ROW_H} />
          ) : (
            <line key={`q${q}r${r}`} className="lp-grid-tick" x1={qx} x2={qx} y1={top} y2={top + (q % 2 === 0 ? 14 : 8)} />
          );
        });
      })}

      <path className="lp-grid-line" d={LINE} pathLength="1" style={{ animationDuration: `${DRAW_SECONDS}s` }} />

      {NOTES.map((n, i) => (
        <g
          key={n.text}
          className="lp-grid-note"
          style={{ animationDelay: `${(n.at / 24) * DRAW_SECONDS + 0.2}s` }}
        >
          <line x1={x(n.at)} x2={x(n.at)} y1={y(n.row)} y2={gridBottom + 18 + (i % 2) * 22} />
          <circle cx={x(n.at)} cy={y(n.row)} r="5" />
          <text x={x(n.at) + 8} y={gridBottom + 23 + (i % 2) * 22}>{n.text}</text>
        </g>
      ))}
    </svg>
  );
}

const RULES = [
  { value: '11 h', title: 'Driving per shift', text: 'Driving stops at 11 hours and a 10-hour reset is put on the route.' },
  { value: '14 h', title: 'On-duty window', text: 'No driving after the 14th hour since you came on duty, even with drive time left.' },
  { value: '30 min', title: 'Break after 8 hours driving', text: 'Placed on the route at the point your 8th hour of driving runs out.' },
  { value: '10 h', title: 'Off between shifts', text: 'Logged in the sleeper berth. It resets your 11 and 14-hour clocks.' },
  { value: '70 h', title: 'In 8 days', text: 'The hours you have already used count. When the cycle runs out, a 34-hour restart is added.' },
  { value: '1,000 mi', title: 'Between fuel stops', text: 'A 30-minute on-duty fuel stop is added before you reach 1,000 miles.' },
  { value: '1 h', title: 'At pickup and dropoff', text: 'Logged as on duty, not driving, and counted against your window.' },
];

const STEPS = [
  { title: 'Enter the trip', text: 'Where you are now, where you pick up, where you drop off, and the hours already used in your 70-hour cycle.' },
  { title: 'Check the route', text: 'The map shows every stop on the way: pickup, dropoff, breaks, fuel and overnight resets, with their times.' },
  { title: 'Read your log sheets', text: 'One sheet per day, with the duty-status graph drawn and each row totalled to 24 hours.' },
];

export default function Landing({ onStart }) {
  return (
    <div className="lp">
      <nav className="lp-nav lp-wrap" aria-label="Main">
        <a className="lp-brand" href="#">
          <svg viewBox="0 0 28 28" aria-hidden="true" className="lp-brand-mark">
            <rect x="1" y="1" width="26" height="26" rx="5" />
            <path d="M5 9 H11 V19 H17 V13 H23" />
          </svg>
          ELD Trip Planner
        </a>
        <div className="lp-nav-links">
          <a href="#rules">Rules</a>
          <a href="#how">How it works</a>
          <button className="lp-btn lp-btn-small" onClick={onStart}>Plan a trip</button>
        </div>
      </nav>

      <header className="lp-hero lp-wrap">
        <h1 className="lp-title">Your logbook, filled in before you leave the yard.</h1>
        <p className="lp-lede">
          Enter where you are, where you pick up and where you drop off. ELD Trip Planner maps the route,
          places every break, fuel stop and reset the Hours of Service rules require, and draws your daily log sheets.
        </p>
        <div className="lp-actions">
          <button className="lp-btn" onClick={onStart}>Plan a trip</button>
          <a className="lp-link" href="#rules">See the rules it follows</a>
        </div>
      </header>

      <figure className="lp-figure lp-wrap">
        <div className="lp-sheet">
          <LogGrid />
        </div>
        <figcaption>
          An example day from a Chicago to Dallas run, picking up in Indianapolis.
          <span className="lp-scroll-hint"> Swipe the sheet to see the whole day.</span>
        </figcaption>
      </figure>

      <section id="rules" className="lp-section lp-wrap">
        <div className="lp-section-head">
          <h2>The rules it plans around</h2>
          <p>Property-carrying FMCSA Hours of Service, checked against every mile of the route.</p>
        </div>
        <dl className="lp-rules">
          {RULES.map((r) => (
            <div className="lp-rule" key={r.title}>
              <dt>
                <span className="lp-rule-value">{r.value}</span>
                <span className="lp-rule-title">{r.title}</span>
              </dt>
              <dd>{r.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="how" className="lp-section lp-wrap">
        <div className="lp-section-head">
          <h2>How it works</h2>
          <p>One form in, a full trip plan out.</p>
        </div>
        <ol className="lp-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="lp-step-num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-closing">
        <div className="lp-wrap lp-closing-inner">
          <h2>Plan the next load before you start the engine.</h2>
          <button className="lp-btn lp-btn-inverse" onClick={onStart}>Plan a trip</button>
        </div>
      </section>

      <footer className="lp-footer lp-wrap">
        <p>ELD Trip Planner</p>
        <p>Plans are a guide. Your ELD record and company policy are what count.</p>
      </footer>
    </div>
  );
}
