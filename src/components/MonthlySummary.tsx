import React, { useState, useMemo } from 'react';
import { MealTime } from '../types';
import { useTiffin } from '../context/TiffinContext';
import { 
  formatCurrency, 
  formatDate, 
  formatDayAndDate, 
  getTodayString, 
  exportToCSV 
} from '../utils/formatters';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  TrendingUp, 
  Utensils, 
  CreditCard, 
  AlertCircle, 
  PieChart, 
  Users, 
  ChevronDown 
} from 'lucide-react';

export const MonthlySummary: React.FC = () => {
  const { customers, bills, payments, settings } = useTiffin();

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Unique list of available months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    bills.forEach(b => {
      if (b.date) set.add(b.date.substring(0, 7));
    });
    payments.forEach(p => {
      if (p.date) set.add(p.date.substring(0, 7));
    });
    set.add(getTodayString().substring(0, 7));
    return Array.from(set).sort().reverse();
  }, [bills, payments]);

  // Bills & payments for selected month
  const monthBills = useMemo(() => {
    return bills.filter(b => b.date.startsWith(selectedMonth));
  }, [bills, selectedMonth]);

  const monthPayments = useMemo(() => {
    return payments.filter(p => p.date.startsWith(selectedMonth));
  }, [payments, selectedMonth]);

  // Aggregate metrics
  const totalTiffinsMonth = useMemo(() => {
    return monthBills.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  }, [monthBills]);

  const totalBilledMonth = useMemo(() => {
    return monthBills.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  }, [monthBills]);

  const totalCollectedMonth = useMemo(() => {
    return monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [monthPayments]);

  const unpaidBilledMonth = useMemo(() => {
    return monthBills.filter(b => !b.paidStatus).reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  }, [monthBills]);

  // Meal breakdown
  const mealBreakdown = useMemo(() => {
    const map: Record<MealTime, { count: number; amount: number }> = {
      Breakfast: { count: 0, amount: 0 },
      Lunch: { count: 0, amount: 0 },
      Dinner: { count: 0, amount: 0 },
      'Evening Snacks': { count: 0, amount: 0 },
    };

    monthBills.forEach(b => {
      if (map[b.mealTime]) {
        map[b.mealTime].count += b.quantity;
        map[b.mealTime].amount += b.total;
      }
    });

    return map;
  }, [monthBills]);

  // Daily breakdown rows (Day by day)
  const dailyData = useMemo(() => {
    // Get all days in the month
    const parts = selectedMonth.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const daysInMonth = new Date(year, month, 0).getDate();

    const daysList = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const dayBills = monthBills.filter(b => b.date === dayStr);
      const dayPayments = monthPayments.filter(p => p.date === dayStr);

      const breakfast = dayBills.filter(b => b.mealTime === 'Breakfast').reduce((s, b) => s + b.quantity, 0);
      const lunch = dayBills.filter(b => b.mealTime === 'Lunch').reduce((s, b) => s + b.quantity, 0);
      const dinner = dayBills.filter(b => b.mealTime === 'Dinner').reduce((s, b) => s + b.quantity, 0);
      const snacks = dayBills.filter(b => b.mealTime === 'Evening Snacks').reduce((s, b) => s + b.quantity, 0);

      const totalTiffins = dayBills.reduce((s, b) => s + b.quantity, 0);
      const billedAmount = dayBills.reduce((s, b) => s + b.total, 0);
      const collectedAmount = dayPayments.reduce((s, p) => s + p.amount, 0);

      // Only show days that have past or have data, or all
      daysList.push({
        date: dayStr,
        dayNum: d,
        breakfast,
        lunch,
        dinner,
        snacks,
        totalTiffins,
        billedAmount,
        collectedAmount,
      });
    }

    return daysList;
  }, [selectedMonth, monthBills, monthPayments]);

  // Max tiffins in a day for chart scaling
  const maxDayTiffins = useMemo(() => {
    const max = Math.max(...dailyData.map(d => d.totalTiffins), 10);
    return max;
  }, [dailyData]);

  // Top customers for this month
  const customerRankings = useMemo(() => {
    const map = new Map<string, { customerId: string; name: string; number: string; tiffins: number; billed: number; paid: number }>();

    customers.forEach(c => {
      map.set(c.id, {
        customerId: c.id,
        name: c.name,
        number: c.number,
        tiffins: 0,
        billed: 0,
        paid: 0,
      });
    });

    monthBills.forEach(b => {
      const item = map.get(b.customerId);
      if (item) {
        item.tiffins += b.quantity;
        item.billed += b.total;
      }
    });

    monthPayments.forEach(p => {
      const item = map.get(p.customerId);
      if (item) {
        item.paid += p.amount;
      }
    });

    return Array.from(map.values())
      .filter(item => item.tiffins > 0 || item.paid > 0)
      .sort((a, b) => b.tiffins - a.tiffins);
  }, [customers, monthBills, monthPayments]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Day', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Total Tiffins', 'Billed Amount (₹)', 'Collected Amount (₹)'];
    const rows = dailyData
      .filter(d => d.totalTiffins > 0 || d.collectedAmount > 0)
      .map(d => {
        const { day } = formatDayAndDate(d.date);
        return [
          d.date,
          day,
          d.breakfast,
          d.lunch,
          d.dinner,
          d.snacks,
          d.totalTiffins,
          d.billedAmount,
          d.collectedAmount,
        ];
      });

    exportToCSV(`Monthly_Summary_${selectedMonth}.csv`, headers, rows);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
      {/* Month Selector & Export Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Monthly Analytics & Reports
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deliveries, revenue breakdown, and payment collections
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Month Select */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tiffins */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tiffins Delivered
          </span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
            {totalTiffinsMonth} <span className="text-xs font-normal text-slate-500">meals</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across {monthBills.length} recorded entries
          </p>
        </div>

        {/* Total Billed */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Billed Revenue
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(totalBilledMonth, settings.currencySymbol)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total value of meals delivered
          </p>
        </div>

        {/* Total Collected */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Collected
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {formatCurrency(totalCollectedMonth, settings.currencySymbol)}
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {monthPayments.length} payment receipts
          </p>
        </div>

        {/* Net Pending for Month */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Month Unpaid Tab
          </span>
          <div className="text-2xl font-bold text-red-600 dark:text-red-500 mt-1 font-mono">
            {formatCurrency(unpaidBilledMonth, settings.currencySymbol)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unsettled tiffin bills this month
          </p>
        </div>
      </div>

      {/* Visual Chart: Daily Deliveries Bar Visualizer */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Daily Delivery Trend ({selectedMonth})</span>
          </h3>
          <span className="text-xs text-slate-400">Hover or tap on bar to inspect day</span>
        </div>

        {/* Bar Visualizer */}
        <div className="pt-6 pb-2 overflow-x-auto no-scrollbar">
          <div className="flex items-end space-x-2 min-w-[700px] h-48 border-b border-slate-200 dark:border-slate-800 pb-2 px-2">
            {dailyData.map(d => {
              const heightPercent = maxDayTiffins > 0 ? (d.totalTiffins / maxDayTiffins) * 100 : 0;
              const hasActivity = d.totalTiffins > 0 || d.collectedAmount > 0;

              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center group relative cursor-pointer min-w-[20px]"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-900 text-white text-[11px] font-semibold py-1.5 px-2.5 rounded-lg shadow-xl z-20 whitespace-nowrap border border-slate-700">
                    <p className="font-bold">{d.date}</p>
                    <p className="text-blue-300">{d.totalTiffins} Tiffins ({formatCurrency(d.billedAmount, settings.currencySymbol)})</p>
                    {d.collectedAmount > 0 && (
                      <p className="text-emerald-300">Paid: {formatCurrency(d.collectedAmount, settings.currencySymbol)}</p>
                    )}
                  </div>

                  {/* Bar */}
                  <div className="w-full flex items-end justify-center h-36">
                    <div
                      style={{ height: `${Math.max(hasActivity ? 8 : 2, heightPercent)}%` }}
                      className={`w-full max-w-[24px] rounded-t-sm transition-all ${
                        d.totalTiffins > 0
                          ? 'bg-blue-600 group-hover:bg-blue-500 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    />
                  </div>

                  {/* Day number label */}
                  <span className={`text-[10px] mt-2 font-mono ${
                    d.totalTiffins > 0
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {d.dayNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Meal Time Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meal Distribution Cards */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Meals Distribution</span>
          </h3>

          <div className="space-y-3">
            {(['Lunch', 'Dinner', 'Breakfast', 'Evening Snacks'] as MealTime[]).map(meal => {
              const data = mealBreakdown[meal];
              const pct = totalTiffinsMonth > 0 ? Math.round((data.count / totalTiffinsMonth) * 100) : 0;

              return (
                <div key={meal} className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>
                      {meal === 'Breakfast' && 'Breakfast'}
                      {meal === 'Lunch' && 'Lunch'}
                      {meal === 'Dinner' && 'Dinner'}
                      {meal === 'Evening Snacks' && 'Evening Snacks'}
                    </span>
                    <span className="font-mono">{data.count} meals ({pct}%)</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-blue-600 h-full rounded-full transition-all"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 text-right font-mono font-semibold">
                    {formatCurrency(data.amount, settings.currencySymbol)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Consumption Leaderboard */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Customer Subscription Activity</span>
          </h3>

          {customerRankings.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No customer activity for this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3 text-center">Tiffins</th>
                    <th className="py-2.5 px-3 text-right">Billed</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerRankings.map(c => {
                    const balance = c.billed - c.paid;
                    return (
                      <tr key={c.customerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          <div>{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{c.number}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white font-mono">
                          {c.tiffins}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300 font-mono">
                          {formatCurrency(c.billed, settings.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(c.paid, settings.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono">
                          <span className={balance > 0 ? 'text-red-600 dark:text-red-500' : 'text-slate-400'}>
                            {balance > 0 ? formatCurrency(balance, settings.currencySymbol) : '₹0'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Day-by-Day Delivery & Collection Sheet
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Breakfast</th>
                <th className="py-3 px-4 text-center">Lunch</th>
                <th className="py-3 px-4 text-center">Dinner</th>
                <th className="py-3 px-4 text-center">Snacks</th>
                <th className="py-3 px-4 text-center font-bold">Total Tiffins</th>
                <th className="py-3 px-4 text-right">Billed (₹)</th>
                <th className="py-3 px-4 text-right">Collected (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {dailyData
                .filter(d => d.totalTiffins > 0 || d.collectedAmount > 0)
                .map(d => {
                  const { day, date } = formatDayAndDate(d.date);
                  return (
                    <tr key={d.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white font-sans">
                        {date} <span className="font-normal text-slate-400">({day})</span>
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-600 dark:text-slate-400">
                        {d.breakfast || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                        {d.lunch || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                        {d.dinner || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-600 dark:text-slate-400">
                        {d.snacks || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                        {d.totalTiffins}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(d.billedAmount, settings.currencySymbol)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {d.collectedAmount > 0 ? formatCurrency(d.collectedAmount, settings.currencySymbol) : '-'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
