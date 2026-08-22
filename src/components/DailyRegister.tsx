import React, { useState, useMemo } from 'react';
import { MealTime } from '../types';
import { useTiffin } from '../context/TiffinContext';
import { getTodayString, formatCurrency } from '../utils/formatters';
import confetti from 'canvas-confetti';
import { 
  CalendarCheck, 
  Calendar, 
  Clock, 
  Check, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Save, 
  Users, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const DailyRegister: React.FC = () => {
  const { customers, bills, addBatchTiffins, settings } = useTiffin();

  const [date, setDate] = useState<string>(getTodayString());
  const [mealTime, setMealTime] = useState<MealTime>('Lunch');
  const [successMessage, setSuccessMessage] = useState<string>('');

  interface CustomerEntryState {
    selected: boolean;
    quantity: number;
    price: number;
    note: string;
  }

  // Track quantities and delivery status for each customer for this session
  const [entriesState, setEntriesState] = useState<Record<string, CustomerEntryState>>({});

  // Reset or initialize state whenever customers change or user changes meal
  const activeCustomers = useMemo(() => {
    return customers.filter(c => c.status === 'active');
  }, [customers]);

  // Check which customers already have an entry for this date & meal
  const existingEntriesMap = useMemo(() => {
    const map = new Map<string, number>();
    bills.forEach(b => {
      if (b.date === date && b.mealTime === mealTime) {
        map.set(b.customerId, (map.get(b.customerId) || 0) + b.quantity);
      }
    });
    return map;
  }, [bills, date, mealTime]);

  const toggleSelect = (customerId: string) => {
    setEntriesState(prev => {
      const current = prev[customerId] || {
        selected: false,
        quantity: 1,
        price: customers.find(c => c.id === customerId)?.defaultPrice || settings.defaultPrice || 70,
        note: '',
      };
      return {
        ...prev,
        [customerId]: {
          ...current,
          selected: !current.selected,
        },
      };
    });
  };

  const updateQuantity = (customerId: string, delta: number) => {
    setEntriesState(prev => {
      const current = prev[customerId] || {
        selected: true,
        quantity: 1,
        price: customers.find(c => c.id === customerId)?.defaultPrice || settings.defaultPrice || 70,
        note: '',
      };
      const newQty = Math.max(1, current.quantity + delta);
      return {
        ...prev,
        [customerId]: {
          ...current,
          selected: true,
          quantity: newQty,
        },
      };
    });
  };

  const selectAll = () => {
    const newState: Record<string, CustomerEntryState> = {};
    activeCustomers.forEach(c => {
      newState[c.id] = {
        selected: true,
        quantity: entriesState[c.id]?.quantity || 1,
        price: c.defaultPrice || settings.defaultPrice || 70,
        note: entriesState[c.id]?.note || '',
      };
    });
    setEntriesState(newState);
  };

  const selectRegulars = () => {
    const newState: Record<string, CustomerEntryState> = {};
    activeCustomers.forEach(c => {
      const isRegular = c.defaultMeals?.includes(mealTime) ?? true;
      newState[c.id] = {
        selected: isRegular,
        quantity: 1,
        price: c.defaultPrice || settings.defaultPrice || 70,
        note: '',
      };
    });
    setEntriesState(newState);
  };

  const clearAll = () => {
    setEntriesState({});
  };

  const selectedCount = useMemo(() => {
    const values = Object.values(entriesState) as CustomerEntryState[];
    return values.filter(e => e.selected).length;
  }, [entriesState]);

  const totalTiffinsToSave = useMemo(() => {
    const values = Object.values(entriesState) as CustomerEntryState[];
    return values
      .filter(e => e.selected)
      .reduce((sum, e) => sum + e.quantity, 0);
  }, [entriesState]);

  const handleSaveBatch = () => {
    const entriesList = Object.entries(entriesState) as [string, CustomerEntryState][];
    const toSave = entriesList
      .filter(([_, data]) => data.selected && data.quantity > 0)
      .map(([custId, data]) => ({
        customerId: custId,
        date,
        mealTime,
        price: data.price,
        quantity: data.quantity,
        paidStatus: false,
        note: data.note || undefined,
      }));

    if (toSave.length === 0) {
      alert('Please select at least one customer to record tiffins.');
      return;
    }

    const count = addBatchTiffins(toSave);
    setSuccessMessage(`Successfully logged ${count} tiffin deliveries for ${mealTime} (${date})!`);
    setEntriesState({});

    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (e) {
      console.log(e);
    }

    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
      {/* Header */}
      <div className="bg-slate-900 rounded-xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <CalendarCheck className="w-5 h-5 text-blue-400" />
              <h1 className="text-xl font-bold">Daily Attendance & Batch Register</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Mark tiffins for regular subscribers with a single click.
            </p>
          </div>

          {/* Date & Meal Selectors Header */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950/80 rounded-lg px-3 py-1.5 flex items-center space-x-2 border border-slate-800">
              <Calendar className="w-4 h-4 text-blue-400" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer font-mono"
              />
            </div>

            <div className="bg-slate-950/80 rounded-lg px-3 py-1.5 flex items-center space-x-2 border border-slate-800">
              <Clock className="w-4 h-4 text-blue-400" />
              <select
                value={mealTime}
                onChange={e => setMealTime(e.target.value as MealTime)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="Breakfast" className="text-slate-900">Breakfast</option>
                <option value="Lunch" className="text-slate-900">Lunch</option>
                <option value="Dinner" className="text-slate-900">Dinner</option>
                <option value="Evening Snacks" className="text-slate-900">Evening Snacks</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Action Controls & Presets */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={selectRegulars}
            className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition flex items-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Select Regulars ({mealTime})</span>
          </button>
          <button
            onClick={selectAll}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold transition border border-slate-200 dark:border-slate-700"
          >
            Select All ({activeCustomers.length})
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium transition"
          >
            Clear Selection
          </button>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Selected: <strong className="text-blue-600 dark:text-blue-400">{selectedCount} customers</strong> ({totalTiffinsToSave} tiffins)
        </div>
      </div>

      {/* Customer Attendance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeCustomers.map(customer => {
          const entry = entriesState[customer.id] || {
            selected: false,
            quantity: 1,
            price: customer.defaultPrice || settings.defaultPrice || 70,
            note: '',
          };
          const alreadyLoggedCount = existingEntriesMap.get(customer.id) || 0;
          const isSelected = entry.selected;

          return (
            <div
              key={customer.id}
              onClick={() => toggleSelect(customer.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 dark:border-blue-600 shadow-sm border-l-4 border-l-blue-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Top Row: Name, Checkbox, Rate */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'border-2 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {customer.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {customer.number}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    {formatCurrency(customer.defaultPrice || settings.defaultPrice, settings.currencySymbol)}
                  </span>
                </div>

                {customer.address && (
                  <p className="text-[10px] text-slate-400 mt-2 truncate">
                    📍 {customer.address}
                  </p>
                )}

                {alreadyLoggedCount > 0 && (
                  <div className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded inline-block border border-emerald-200 dark:border-emerald-800/50">
                    ✓ {alreadyLoggedCount} logged for {mealTime} today
                  </div>
                )}
              </div>

              {/* Quantity Stepper (if selected) */}
              {isSelected && (
                <div
                  className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-900/40 flex items-center justify-between"
                  onClick={e => e.stopPropagation()}
                >
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Tiffins:
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(customer.id, -1)}
                      className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 flex items-center justify-center font-bold text-xs hover:bg-blue-200"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-black text-sm text-slate-900 dark:text-white font-mono">
                      {entry.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(customer.id, 1)}
                      className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 flex items-center justify-center font-bold text-xs hover:bg-blue-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Save Batch Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-30 px-4">
          <div className="max-w-md mx-auto bg-slate-900 dark:bg-slate-950 text-white p-3.5 rounded-xl shadow-2xl flex items-center justify-between border border-slate-800">
            <div>
              <p className="text-xs font-bold">
                {selectedCount} Customers ({totalTiffinsToSave} meals)
              </p>
              <p className="text-[10px] text-slate-400">
                {date} • {mealTime}
              </p>
            </div>

            <button
              onClick={handleSaveBatch}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/30 flex items-center space-x-1.5 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>SAVE ATTENDANCE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
