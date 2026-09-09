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
    <div className="glass-card">
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-h2 mb-1">Plan Your Trip</h2>
        <p className="text-sm text-muted">
          Enter your locations and we'll calculate the best route with all required stops.
        </p>
      </div>

      {/* Quick Fill Presets */}
      <div className="mb-6">
        <p className="form-label tracking-wider uppercase text-xs">Try an example route:</p>
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Location Inputs with visual flow */}
        <div className="flex flex-col gap-3">
          <p className="form-label tracking-wider uppercase text-xs">Route Locations</p>
          
          {/* Current Location */}
          <div>
            <label className="form-label">
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
            <p className="form-helper">Your current truck location or starting point</p>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center">
            <div className="icon-container icon-small">
              <ArrowDown size={16} />
            </div>
          </div>

          {/* Pickup */}
          <div>
            <label className="form-label">
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
            <p className="form-helper">Where you'll load cargo (1 hour on-duty time added)</p>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center">
            <div className="icon-container icon-small">
              <ArrowDown size={16} />
            </div>
          </div>

          {/* Dropoff */}
          <div>
            <label className="form-label">
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
            <p className="form-helper">Final delivery destination (1 hour on-duty time added)</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

        {/* Cycle Hours */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <label className="form-label flex items-center gap-1">
                <Clock size={16} className="text-accent" />
                Current Cycle Hours Used
              </label>
              <p className="form-helper mt-1">How many hours you've been on-duty in the last 8 days</p>
            </div>
            <div className="text-right">
              <span className="text-h1 text-accent font-mono" style={{ fontSize: '1.25rem' }}>{cycleHours}h</span>
              <span className="text-xs text-muted block">{cycleRemaining}h remaining</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="70"
              step="0.5"
              value={cycleHours}
              onChange={(e) => setCycleHours(parseFloat(e.target.value))}
            />
            <input
              type="number"
              min="0"
              max="70"
              step="0.5"
              className="glass-input text-center font-mono text-sm"
              style={{ width: '80px' }}
              value={cycleHours}
              onChange={(e) => setCycleHours(Math.max(0, Math.min(70, parseFloat(e.target.value) || 0)))}
            />
          </div>

          {cycleHours > 55 && (
            <div className="alert alert-warning mt-3">
              <div className="flex gap-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-1" />
                <div>
                  <span className="font-bold">Heads up:</span> With {cycleHours}h used, you only have {cycleRemaining}h left before a mandatory 34-hour restart is required.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Start Time */}
        <div>
          <label className="form-label">
            🕐 When do you want to depart?
          </label>
          <input
            type="datetime-local"
            className="glass-input font-mono text-sm"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <p className="form-helper">The log sheets will start from this date and time</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary mt-2"
          style={{ padding: '16px' }}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="spinner" />
              <span>Calculating route & generating logs...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Play size={20} fill="currentColor" />
              <span>Plan Trip & Generate Logs</span>
            </div>
          )}
        </button>
      </form>
    </div>
  );
}
