import React from 'react';
import { Truck, MapPin, FileText, Clock } from 'lucide-react';

export default function Header() {
  return (
    <header className="glass-card mb-6">
      <div className="header-top">
        <div className="flex items-center gap-4">
          <div className="icon-container">
            <Truck className="w-full h-full p-2" />
          </div>
          <div>
            <h1 className="text-h1">
              ELD Trip Planner
            </h1>
            <p className="text-sm text-muted mt-1">
              Enter your route — get optimized stops and compliant daily log sheets automatically.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="badge badge-accent">
            <MapPin size={14} className="mr-1" />
            <span>Route Mapping</span>
          </div>
          <div className="badge badge-accent">
            <Clock size={14} className="mr-1" />
            <span>HOS Compliant</span>
          </div>
          <div className="badge badge-accent">
            <FileText size={14} className="mr-1" />
            <span>Daily Log Sheets</span>
          </div>
        </div>
      </div>
    </header>
  );
}
