import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { useTiffin } from '../context/TiffinContext';
import { formatCurrency, generateWhatsAppBillText, openWhatsApp, formatDate } from '../utils/formatters';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { 
  Search, 
  UserPlus, 
  UtensilsCrossed, 
  Phone, 
  MessageCircle, 
  CreditCard, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle, 
  Plus, 
  TrendingUp, 
  Users, 
  Receipt,
  Sparkles,
  CalendarCheck,
  Trash2
} from 'lucide-react';

interface DashboardProps {
  onOpenAddCustomer: () => void;
  onOpenAddTiffin: (customer: Customer) => void;
  onOpenPaymentModal: (customer: Customer) => void;
  onSelectCustomer: (customerId: string) => void;
  onOpenBatchRegister: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenAddCustomer,
  onOpenAddTiffin,
  onOpenPaymentModal,
  onSelectCustomer,
  onOpenBatchRegister,
}) => {
  const {
    customers,
    bills,
    payments,
    settings,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    allCustomerSummaries,
    totalDueOverall,
    totalCollectedOverall,
    totalTiffinsThisMonth,
    totalBilledThisMonth,
    deleteCustomer,
  } = useTiffin();

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Filter customers based on search and status tabs
  const filteredSummaries = useMemo(() => {
    return allCustomerSummaries.filter(item => {
      const { customer, dueAmount } = item;
      const matchSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.number.includes(searchQuery) ||
        (customer.address && customer.address.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (filterStatus === 'due') return dueAmount > 0;
      if (filterStatus === 'settled') return dueAmount === 0;
      return true;
    });
  }, [allCustomerSummaries, searchQuery, filterStatus]);

  const customersWithDueCount = useMemo(() => {
    return allCustomerSummaries.filter(s => s.dueAmount > 0).length;
  }, [allCustomerSummaries]);

  const handleShareWhatsApp = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    const text = generateWhatsAppBillText(customer, bills, payments, settings);
    openWhatsApp(customer.number, text);
  };

  const handleCall = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.open(`tel:${phone}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
      {/* Top Banner / Metrics Summary Header Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Total Due Amount (Primary Focus) */}
          <div className="pt-2 md:pt-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
              <span>Total Due Amount</span>
              {customersWithDueCount > 0 && (
                <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold px-1.5 py-0.5 rounded">
                  {customersWithDueCount} Pending
                </span>
              )}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-500 mt-1 tracking-tight">
              {formatCurrency(totalDueOverall, settings.currencySymbol)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Outstanding customer balance</p>
          </div>

          {/* Active Customers */}
          <div className="pt-2 md:pt-0 md:pl-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
              Active Customers
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1 tracking-tight">
              {customers.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Registered accounts</p>
          </div>

          {/* Tiffins Delivered This Month */}
          <div className="pt-4 md:pt-0 md:pl-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
              Tiffins This Month
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1 tracking-tight">
              {totalTiffinsThisMonth} <span className="text-xs font-semibold text-slate-500">meals</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Billed: {formatCurrency(totalBilledThisMonth, settings.currencySymbol)}
            </p>
          </div>

          {/* Total Collections Received */}
          <div className="pt-4 md:pt-0 md:pl-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
              Total Collected
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
              {formatCurrency(totalCollectedOverall, settings.currencySymbol)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">All-time received payments</p>
          </div>
        </div>
      </div>

      {/* Action Bar: Search, Filters, Quick Daily Attendance Callout */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name, number, or room..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterStatus('due')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
                filterStatus === 'due'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-50/50'
              }`}
            >
              <span>Due Only</span>
              <span className="text-[10px] bg-red-800/80 text-white px-1.5 py-0.2 rounded">
                {customersWithDueCount}
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('settled')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                filterStatus === 'settled'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Settled
            </button>
          </div>
        </div>
      </div>

      {/* Customer List Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
            <span>Customer Accounts</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 lowercase">
              ({filteredSummaries.length} found)
            </span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Select a customer to view statement & records
          </span>
        </div>

        {filteredSummaries.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 mx-auto flex items-center justify-center mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {searchQuery ? 'No customers matching your search' : 'No customers in this filter'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try searching with a different name or mobile number.'
                : 'Click the button below to add your first customer and start managing tiffin records.'}
            </p>
            <button
              onClick={onOpenAddCustomer}
              className="mt-4 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
            >
              + ADD CUSTOMER
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSummaries.map(({ customer, totalTiffins, dueAmount, lastTiffinDate }) => {
              const hasDue = dueAmount > 0;
              const initials = customer.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              return (
                <div
                  key={customer.id}
                  onClick={() => onSelectCustomer(customer.id)}
                  className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all cursor-pointer group flex flex-col justify-between hover:shadow-md ${
                    hasDue
                      ? 'border-l-4 border-l-red-600'
                      : 'border-l-4 border-l-blue-600'
                  }`}
                >
                  {/* Top Customer Info */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Avatar / Badge */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                          hasDue
                            ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {initials}
                        </div>

                        {/* Name & Phone */}
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition flex items-center space-x-1.5">
                            <span>{customer.name}</span>
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {customer.number}
                          </p>
                        </div>
                      </div>

                      {/* Pending Due Badge */}
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">
                          {hasDue ? 'Due Amount' : 'Status'}
                        </span>
                        <span className={`text-sm font-bold tracking-tight ${
                          hasDue
                            ? 'text-red-600 dark:text-red-500'
                            : 'text-slate-400'
                        }`}>
                          {hasDue ? formatCurrency(dueAmount, settings.currencySymbol) : '₹0.00'}
                        </span>
                      </div>
                    </div>

                    {/* Address & Meal Preference Info */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      {customer.address && (
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          📍 {customer.address}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          Total: <strong className="text-slate-800 dark:text-slate-200">{totalTiffins} meals</strong>
                        </span>
                        {lastTiffinDate && (
                          <span className="text-slate-400">
                            Last: {formatDate(lastTiffinDate, { shortMonth: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons on Card */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                    {/* Add Tiffin */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddTiffin(customer);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-semibold flex items-center justify-center space-x-1 transition"
                      title="Add Tiffin Entry"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>+ Tiffin</span>
                    </button>

                    {/* Record Payment */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPaymentModal(customer);
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold flex items-center justify-center space-x-1 transition"
                      title="Record Payment"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pay</span>
                    </button>

                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={(e) => handleShareWhatsApp(e, customer)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                      title="Send Bill via WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    {/* Call */}
                    <button
                      type="button"
                      onClick={(e) => handleCall(e, customer.number)}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                      title="Call Customer"
                    >
                      <Phone className="w-4 h-4" />
                    </button>

                    {/* Delete Customer */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomerToDelete(customer);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Details Arrow */}
                    <div className="p-1 text-slate-400 group-hover:text-blue-600 transition">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={() => {
          if (customerToDelete) {
            deleteCustomer(customerToDelete.id);
            setCustomerToDelete(null);
          }
        }}
        itemName={customerToDelete?.name}
      />

      {/* Floating Bottom Bar: Prominent "+ ADD CUSTOMER" and "DAILY REGISTER" */}
      <div className="fixed bottom-4 left-0 right-0 z-20 px-4 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center justify-center gap-3 pointer-events-auto">
          <button
            onClick={onOpenAddCustomer}
            className="flex-1 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 flex items-center justify-center space-x-2 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ADD CUSTOMER</span>
          </button>

          <button
            onClick={onOpenBatchRegister}
            className="py-2.5 px-4 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-sm shadow-lg shadow-slate-900/20 flex items-center justify-center space-x-1.5 transition active:scale-95 border border-slate-700 dark:border-slate-200"
            title="Daily Attendance Batch Entry"
          >
            <CalendarCheck className="w-4 h-4 text-blue-400 dark:text-blue-600" />
            <span className="hidden sm:inline">Daily Attendance</span>
          </button>
        </div>
      </div>
    </div>
  );
};
