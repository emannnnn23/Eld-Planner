import React, { useState, useEffect } from 'react';
import { Truck, MapPin, FileText, Clock, Sun, Moon } from 'lucide-react';

export default function Header() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Default to dark
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  return (
    <header className="glass-card mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
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
        
        <button 
          onClick={toggleTheme} 
          className="theme-toggle ml-2" 
          title="Toggle Light/Dark Mode"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
}
