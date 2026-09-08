import React from 'react';
import { Truck, MapPin, FileText, Clock } from 'lucide-react';

export default function Header() {
  return (
    <header className="glass-card p-6 mb-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 shadow-lg shadow-emerald-500/5">
            <Truck className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              ELD Trip Planner
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Enter your route — get optimized stops and compliant daily log sheets automatically.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
            <MapPin className="w-3.5 h-3.5" />
            <span>Route Mapping</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>HOS Compliant</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
            <FileText className="w-3.5 h-3.5" />
            <span>Daily Log Sheets</span>
          </div>
        </div>
      </div>
    </header>
  );
}
