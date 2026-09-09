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
    <div className="app-container">
      <div className="max-w-container">
        <Header />

        {error && (
          <div className="alert alert-error">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="flex-shrink-0" />
              <div className="text-sm">
                <span className="font-bold">Calculation Error:</span> {error}
              </div>
            </div>
            <button
              onClick={() => handlePlanTrip(initialFormValues)}
              className="btn-preset"
            >
              Retry Default
            </button>
          </div>
        )}

        {/* Top Control Panel & Interactive Map Grid */}
        <div className="main-grid items-start">
          <div>
            <TripForm
              onSubmit={handlePlanTrip}
              isLoading={isLoading}
              initialValues={initialFormValues}
            />
          </div>

          <div className="flex flex-col gap-5">
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
          <div className="mt-6">
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
