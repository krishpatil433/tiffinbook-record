import React from 'react';
import { useTiffin } from '../context/TiffinContext';
import { 
  UtensilsCrossed, 
  Users, 
  CalendarCheck, 
  BarChart3, 
  FileText, 
  Settings, 
  Sun, 
  Moon, 
  PlusCircle,
  PhoneCall,
  UserPlus
} from 'lucide-react';

interface NavbarProps {
  onOpenAddCustomer: () => void;
  onOpenQuickAddTiffin: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddCustomer,
  onOpenQuickAddTiffin,
  onOpenSettings,
}) => {
  const { activeTab, setActiveTab, settings, darkMode, setDarkMode, totalDueOverall } = useTiffin();

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 transition-colors shadow-md">
      {/* Top Banner / Branding Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Business Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">
                  TIFFIN<span className="text-blue-400">BOOK</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  SYSTEM
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                {settings.businessName}
              </p>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Contact badge */}
            <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Quick Contact</span>
              <a
                href={`tel:${settings.primaryPhone}`}
                className="text-slate-300 hover:text-white font-mono flex items-center space-x-1"
                title="Call Primary Business Number"
              >
                <PhoneCall className="w-3 h-3 text-blue-400" />
                <span>{settings.primaryPhone}</span>
              </a>
            </div>

            {/* Quick Add Tiffin Button */}
            <button
              onClick={onOpenQuickAddTiffin}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-700/50 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Add Tiffin</span>
            </button>

            {/* Add Customer Button */}
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Customer</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(prev => !prev)}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              aria-label="Settings"
              className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-t border-slate-800 bg-slate-950/60 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 py-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'dashboard' || activeTab === 'customer_history'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers</span>
              {totalDueOverall > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  DUE
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('daily_register')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'daily_register'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Daily Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('monthly_summary')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'monthly_summary'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Monthly Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('invoice')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'invoice'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Invoice Generator</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
