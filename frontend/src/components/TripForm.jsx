import React, { useState } from 'react';
import { MapPin, Clock, Play, AlertTriangle, Zap, ArrowDown, HelpCircle } from 'lucide-react';

export default function TripForm({ onSubmit, isLoading, initialValues }) {
  const [currentLocation, setCurrentLocation] = useState(initialValues?.current_location || 'Chicago, IL');
  const [pickupLocation, setPickupLocation] = useState(initialValues?.pickup_location || 'Indianapolis, IN');
  const [dropoffLocation, setDropoffLocation] = useState(initialValues?.dropoff_location || 'Dallas, TX');
  const [cycleHours, setCycleHours] = useState(initialValues?.cycle_hours_used || 24.5);
  
  const nowIso = new Date().toISOString().slice(0, 16);
  const [startTime, setStartTime] = useState(nowIso);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      cycle_hours_used: parseFloat(cycleHours) || 0.0,
      start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString()
    });
  };

  const applyPreset = (current, pickup, dropoff, hours) => {
    setCurrentLocation(current);
    setPickupLocation(pickup);
    setDropoffLocation(dropoff);
    setCycleHours(hours);
  };

  const cycleRemaining = Math.max(0, 70 - cycleHours);

  return (
    <div className="glass-card p-6 shadow-2xl">
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">Plan Your Trip</h2>
        <p className="text-sm text-gray-400">
          Enter your locations and we'll calculate the best route with all required stops.
        </p>
      </div>

      {/* Quick Fill Presets */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">Try an example route:</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-preset"
            onClick={() => applyPreset('Chicago, IL', 'Indianapolis, IN', 'Columbus, OH', 12.0)}
          >
            🚐 Short Trip (~350 mi)
          </button>
          <button
            type="button"
            className="btn-preset"
            onClick={() => applyPreset('Atlanta, GA', 'Nashville, TN', 'Dallas, TX', 24.5)}
          >
            🚛 Medium Trip (~850 mi)
          </button>
          <button
            type="button"
            className="btn-preset"
            onClick={() => applyPreset('Chicago, IL', 'St. Louis, MO', 'Los Angeles, CA', 62.0)}
          >
            🏗️ Long Haul (2,000+ mi)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Location Inputs with visual flow */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Route Locations</p>
          
          {/* Current Location */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1.5">
              📍 Where are you now?
            </label>
            <input
              type="text"
              required
              className="glass-input"
              placeholder="City, State — e.g. Chicago, IL"
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
            />
            <p className="helper-text">Your current truck location or starting point</p>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-cyan-400" />
            </div>
          </div>

          {/* Pickup */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1.5">
              📦 Pickup Location
            </label>
            <input
              type="text"
              required
              className="glass-input"
              placeholder="City, State — e.g. Indianapolis, IN"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
            />
            <p className="helper-text">Where you'll load cargo (1 hour on-duty time added)</p>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          {/* Dropoff */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1.5">
              🏁 Dropoff Location
            </label>
            <input
              type="text"
              required
              className="glass-input"
              placeholder="City, State — e.g. Dallas, TX"
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
            />
            <p className="helper-text">Final delivery destination (1 hour on-duty time added)</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* Cycle Hours */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <label className="text-sm font-medium text-gray-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                Current Cycle Hours Used
              </label>
              <p className="helper-text mt-0.5">How many hours you've been on-duty in the last 8 days</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-mono font-bold text-emerald-400">{cycleHours}h</span>
              <span className="text-xs text-gray-500 block">{cycleRemaining}h remaining</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="70"
              step="0.5"
              className="w-full accent-emerald-500 h-2 rounded-lg cursor-pointer"
              style={{ background: `linear-gradient(to right, #10b981 ${(cycleHours/70)*100}%, #1e293b ${(cycleHours/70)*100}%)` }}
              value={cycleHours}
              onChange={(e) => setCycleHours(parseFloat(e.target.value))}
            />
            <input
              type="number"
              min="0"
              max="70"
              step="0.5"
              className="glass-input w-20 text-center font-mono text-sm"
              value={cycleHours}
              onChange={(e) => setCycleHours(Math.max(0, Math.min(70, parseFloat(e.target.value) || 0)))}
            />
          </div>

          {cycleHours > 55 && (
            <div className="mt-3 text-xs text-amber-300 flex items-start gap-2 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Heads up:</span> With {cycleHours}h used, you only have {cycleRemaining}h left before a mandatory 34-hour restart is required.
              </div>
            </div>
          )}
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1.5">
            🕐 When do you want to depart?
          </label>
          <input
            type="datetime-local"
            className="glass-input font-mono text-sm"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <p className="helper-text">The log sheets will start from this date and time</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-4 text-base font-bold mt-2"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Calculating route & generating logs...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-white" />
              <span>Plan Trip & Generate Logs</span>
            </div>
          )}
        </button>
      </form>
    </div>
  );
}
