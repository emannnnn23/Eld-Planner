import React from 'react';
import { Navigation, Clock, Fuel, Moon, Calendar, Truck } from 'lucide-react';

export default function TripSummary({ summary, routeInfo }) {
  if (!summary) return null;

  const formatDuration = (hrs) => {
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div>
      {/* Main Stats Row */}
      <div className="grid-3 mb-4">
        {/* Total Distance */}
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="icon-container icon-small">
              <Navigation size={16} />
            </div>
            <span className="text-xs text-muted font-medium">Total Distance</span>
          </div>
          <div className="text-h1 font-mono">
            {summary.total_distance_miles.toLocaleString()}
            <span className="text-sm text-muted font-sans font-medium ml-1">miles</span>
          </div>
        </div>

        {/* Trip Duration */}
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="icon-container icon-small">
              <Clock size={16} />
            </div>
            <span className="text-xs text-muted font-medium">Trip Duration</span>
          </div>
          <div className="text-h1 font-mono">
            {formatDuration(summary.total_duration_hrs)}
          </div>
          <div className="text-xs text-dim mt-1">
            Across {summary.days_count} {summary.days_count === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Driving Time */}
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="icon-container icon-small">
              <Truck size={16} />
            </div>
            <span className="text-xs text-muted font-medium">Time Behind Wheel</span>
          </div>
          <div className="text-h1 font-mono">
            {formatDuration(summary.driving_hrs)}
          </div>
          <div className="text-xs text-dim mt-1">
            {summary.off_duty_hrs ? formatDuration(summary.off_duty_hrs) + ' resting' : ''}
          </div>
        </div>
      </div>

      {/* Stops & Cycle Bar */}
      <div className="glass-card">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          {summary.fuel_stops > 0 && (
            <div className="flex items-center gap-2">
              <div className="icon-container icon-small" style={{ background: 'var(--warning-dim)', color: 'var(--warning)' }}>
                <Fuel size={14} />
              </div>
              <div>
                <span className="text-sm font-bold">{summary.fuel_stops}</span>
                <span className="text-xs text-muted ml-1">fuel {summary.fuel_stops === 1 ? 'stop' : 'stops'}</span>
              </div>
            </div>
          )}
          {summary.reset_stops > 0 && (
            <div className="flex items-center gap-2">
              <div className="icon-container icon-small" style={{ background: 'var(--error-dim)', color: 'var(--error)' }}>
                <Moon size={14} />
              </div>
              <div>
                <span className="text-sm font-bold">{summary.reset_stops}</span>
                <span className="text-xs text-muted ml-1">mandatory {summary.reset_stops === 1 ? 'rest' : 'rests'}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="icon-container icon-small">
              <Calendar size={14} />
            </div>
            <div>
              <span className="text-sm font-bold">{summary.days_count}</span>
              <span className="text-xs text-muted ml-1">daily {summary.days_count === 1 ? 'log' : 'logs'}</span>
            </div>
          </div>
        </div>

        {/* 70-Hour Cycle Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted">70-Hour Cycle Usage</span>
            <span className="text-xs font-mono font-bold text-accent">
              {summary.cycle_hours_end} / 70h used
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%',
                borderRadius: '4px',
                transition: 'width 0.5s',
                width: `${Math.min(100, (summary.cycle_hours_end / 70) * 100)}%`,
                background: summary.cycle_hours_end > 60 ? 'var(--warning)' : 'var(--accent)'
              }}
            />
          </div>
          <p className="text-xs text-dim mt-1">
            {Math.max(0, 70 - summary.cycle_hours_end).toFixed(1)}h remaining before a 34-hour restart is needed
          </p>
        </div>
      </div>
    </div>
  );
}
