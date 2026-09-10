import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TripForm from './components/TripForm';
import TripSummary from './components/TripSummary';
import RouteMap from './components/RouteMap';
import LogSheet from './components/LogSheet';
import { planTrip } from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

const LOADING_STEPS = [
  { icon: '📍', text: 'Geocoding locations...' },
  { icon: '🗺️', text: 'Calculating optimal route...' },
  { icon: '⏱️', text: 'Running HOS simulation...' },
  { icon: '📋', text: 'Generating daily log sheets...' },
  { icon: '✅', text: 'Finalizing trip plan...' },
];

function LoadingOverlay() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner-ring">
          <div className="loading-spinner-inner" />
        </div>
        <h2 className="loading-title">Preparing Your Trip</h2>
        <p className="loading-subtitle">This may take a few seconds...</p>
        <div className="loading-steps">
          {LOADING_STEPS.map((step, i) => (
            <div
              key={i}
              className={`loading-step ${i < activeStep ? 'step-done' : ''} ${i === activeStep ? 'step-active' : ''} ${i > activeStep ? 'step-pending' : ''}`}
            >
              <span className="loading-step-icon">{i < activeStep ? '✓' : step.icon}</span>
              <span className="loading-step-text">{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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




  return (
    <div className="app-container">
      <div className="max-w-container">
        <Header />

        {isLoading && <LoadingOverlay />}

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
