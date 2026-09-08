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
    <div className="animate-fade-in">
      {/* Main Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {/* Total Distance */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Navigation className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Total Distance</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {summary.total_distance_miles.toLocaleString()}
            <span className="text-sm text-gray-400 font-sans font-normal ml-1">miles</span>
          </div>
        </div>

        {/* Trip Duration (Total elapsed time including rests) */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Trip Duration</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatDuration(summary.total_duration_hrs)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Across {summary.days_count} {summary.days_count === 1 ? 'day' : 'days'}
          </div>
        </div>

        {/* Driving Time */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Time Behind Wheel</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatDuration(summary.driving_hrs)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {summary.off_duty_hrs ? formatDuration(summary.off_duty_hrs) + ' resting' : ''}
          </div>
        </div>
      </div>

      {/* Stops & Cycle Bar */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          {summary.fuel_stops > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center">
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">{summary.fuel_stops}</span>
                <span className="text-xs text-gray-400 ml-1">fuel {summary.fuel_stops === 1 ? 'stop' : 'stops'}</span>
              </div>
            </div>
          )}
          {summary.reset_stops > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-purple-500/15 flex items-center justify-center">
                <Moon className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">{summary.reset_stops}</span>
                <span className="text-xs text-gray-400 ml-1">mandatory {summary.reset_stops === 1 ? 'rest' : 'rests'}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <span className="text-sm font-bold text-white">{summary.days_count}</span>
              <span className="text-xs text-gray-400 ml-1">daily {summary.days_count === 1 ? 'log' : 'logs'}</span>
            </div>
          </div>
        </div>

        {/* 70-Hour Cycle Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-gray-400">70-Hour Cycle Usage</span>
            <span className="text-xs font-mono font-semibold text-emerald-400">
              {summary.cycle_hours_end} / 70h used
            </span>
          </div>
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${Math.min(100, (summary.cycle_hours_end / 70) * 100)}%`,
                background: summary.cycle_hours_end > 60 
                  ? 'linear-gradient(90deg, #f59e0b, #ef4444)' 
                  : 'linear-gradient(90deg, #10b981, #06b6d4)'
              }}
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {Math.max(0, 70 - summary.cycle_hours_end).toFixed(1)}h remaining before a 34-hour restart is needed
          </p>
        </div>
      </div>
    </div>
  );
}
