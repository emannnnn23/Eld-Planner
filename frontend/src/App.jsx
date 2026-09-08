import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TripForm from './components/TripForm';
import TripSummary from './components/TripSummary';
import RouteMap from './components/RouteMap';
import LogSheet from './components/LogSheet';
import { planTrip } from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [tripData, setTripData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const initialFormValues = {
    current_location: 'Chicago, IL',
    pickup_location: 'Indianapolis, IN',
    dropoff_location: 'Dallas, TX',
    cycle_hours_used: 24.5
  };

  const handlePlanTrip = async (formValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await planTrip(formValues);
      setTripData(data);
    } catch (err) {
      console.error('Failed to plan trip:', err);
      setError(err.message || 'Failed to communicate with trip planning backend.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load trigger with default parameters
  useEffect(() => {
    handlePlanTrip(initialFormValues);
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />

        {error && (
          <div className="glass-card p-4 border border-rose-500/40 bg-rose-500/10 text-rose-300 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-semibold">Calculation Error:</span> {error}
              </div>
            </div>
            <button
              onClick={() => handlePlanTrip(initialFormValues)}
              className="text-xs bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-200 transition"
            >
              Retry Default Trip
            </button>
          </div>
        )}

        {/* Top Control Panel & Interactive Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <TripForm
              onSubmit={handlePlanTrip}
              isLoading={isLoading}
              initialValues={initialFormValues}
            />
          </div>

          <div className="lg:col-span-7 space-y-6">
            {tripData && (
              <TripSummary summary={tripData.summary} routeInfo={tripData.route} />
            )}

            <RouteMap
              route={tripData?.route}
              stops={tripData?.stops}
            />
          </div>
        </div>

        {/* Daily FMCSA ELD Log Sheets Section */}
        {tripData && (
          <div className="pt-2">
            <LogSheet
              dailyLogs={tripData.daily_logs}
              tripInputs={tripData.inputs}
              summary={tripData.summary}
            />
          </div>
        )}
      </div>
    </div>
  );
}
