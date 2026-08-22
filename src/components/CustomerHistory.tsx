import React, { useState, useMemo } from 'react';
import { Customer, TiffinBill, Payment } from '../types';
import { useTiffin } from '../context/TiffinContext';
import { 
  formatCurrency, 
  formatDate, 
  formatDayAndDate, 
  generateWhatsAppBillText, 
  openWhatsApp 
} from '../utils/formatters';
import confetti from 'canvas-confetti';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { 
  ArrowLeft, 
  Plus, 
  CreditCard, 
  FileText, 
  Share2, 
  Phone, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Clock, 
  Calendar, 
  CheckCheck, 
  AlertCircle,
  Receipt,
  User,
  MapPin,
  Settings2
} from 'lucide-react';

interface CustomerHistoryProps {
  customerId: string;
  onBack: () => void;
  onOpenAddTiffin: (customer: Customer) => void;
  onOpenEditTiffin: (bill: TiffinBill) => void;
  onOpenPaymentModal: (customer: Customer) => void;
  onOpenInvoice: (customer: Customer) => void;
  onOpenEditCustomer: (customer: Customer) => void;
}

export const CustomerHistory: React.FC<CustomerHistoryProps> = ({
  customerId,
  onBack,
  onOpenAddTiffin,
  onOpenEditTiffin,
  onOpenPaymentModal,
  onOpenInvoice,
  onOpenEditCustomer,
}) => {
  const {
    customers,
    bills,
    payments,
    settings,
    deleteTiffin,
    toggleTiffinPaidStatus,
    deletePayment,
    markCustomerAllPaid,
    deleteCustomer,
  } = useTiffin();

  const customer = customers.find(c => c.id === customerId);
  const [activeTab, setActiveTab] = useState<'tiffins' | 'payments'>('tiffins');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [paidFilter, setPaidFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const [showMarkAllPaidModal, setShowMarkAllPaidModal] = useState<boolean>(false);
  const [billToDelete, setBillToDelete] = useState<TiffinBill | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  // Get customer specific bills and payments
  const customerBills = useMemo(() => {
    return customer ? bills.filter(b => b.customerId === customer.id) : [];
  }, [bills, customer]);

  const customerPayments = useMemo(() => {
    return customer ? payments.filter(p => p.customerId === customer.id) : [];
  }, [payments, customer]);

  // Calculations
  const totalTiffinsCount = useMemo(() => {
    return customerBills.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  }, [customerBills]);

  const totalBilled = useMemo(() => {
    return customerBills.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  }, [customerBills]);

  const totalPaid = useMemo(() => {
    return customerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [customerPayments]);

  const unpaidBillsTotal = useMemo(() => {
    return customerBills.filter(b => !b.paidStatus).reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  }, [customerBills]);

  const pendingDue = Math.max(0, Math.min(unpaidBillsTotal, totalBilled - totalPaid));

  // Available months from records
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    customerBills.forEach(b => {
      if (b.date) monthsSet.add(b.date.substring(0, 7));
    });
    return Array.from(monthsSet).sort().reverse();
  }, [customerBills]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return customerBills
      .filter(b => {
        if (selectedMonth !== 'all' && !b.date.startsWith(selectedMonth)) return false;
        if (paidFilter === 'unpaid' && b.paidStatus) return false;
        if (paidFilter === 'paid' && !b.paidStatus) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [customerBills, selectedMonth, paidFilter]);

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-slate-500">Customer not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleMarkAllPaid = () => {
    setShowMarkAllPaidModal(true);
  };

  const handleConfirmMarkAllPaid = () => {
    markCustomerAllPaid(customer.id);
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handleShareWhatsApp = () => {
    const monthLabel = selectedMonth !== 'all' ? selectedMonth : undefined;
    const text = generateWhatsAppBillText(customer, bills, payments, settings, monthLabel);
    openWhatsApp(customer.number, text);
  };

  const handleDeleteCustomerConfirm = () => {
    deleteCustomer(customer.id);
    onBack();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCustomerConfirm}
        itemName={customer.name}
      />

      {/* Top Back Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenEditCustomer(customer)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center space-x-1.5"
            title="Edit Customer Profile"
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Profile</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-xl text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 hover:bg-red-50 text-xs font-semibold"
            title="Delete Customer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prominent Pending Amount & Customer Hero Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Customer Profile Left */}
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-600 text-white text-lg font-bold flex items-center justify-center shadow-md shadow-blue-600/30">
              {customer.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Statement: {customer.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <a href={`tel:${customer.number}`} className="flex items-center space-x-1 hover:text-blue-600 font-mono font-semibold">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.number}</span>
                </a>
                {customer.address && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.address}</span>
                  </span>
                )}
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                  Rate: {formatCurrency(customer.defaultPrice || settings.defaultPrice, settings.currencySymbol)}/tiffin
                </span>
              </div>
              {customer.notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <strong>Preference:</strong> {customer.notes}
                </p>
              )}
            </div>
          </div>

          {/* Pending Due Box Right */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 text-right min-w-[240px]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Pending Due
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-500 mt-1 tracking-tight font-mono">
              {formatCurrency(pendingDue, settings.currencySymbol)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex justify-between font-mono">
              <span>Billed: {formatCurrency(totalBilled, settings.currencySymbol)}</span>
              <span>Paid: {formatCurrency(totalPaid, settings.currencySymbol)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          {/* Add Tiffin */}
          <button
            onClick={() => onOpenAddTiffin(customer)}
            className="py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 flex items-center justify-center space-x-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Tiffin</span>
          </button>

          {/* Record Payment */}
          <button
            onClick={() => onOpenPaymentModal(customer)}
            className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </button>

          {/* View Invoice */}
          <button
            onClick={() => onOpenInvoice(customer)}
            className="py-2.5 px-3 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center space-x-1.5 transition active:scale-95 border border-slate-800 dark:border-slate-600"
          >
            <FileText className="w-4 h-4" />
            <span>View Invoice</span>
          </button>

          {/* Share on WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-green-600/20 flex items-center justify-center space-x-1.5 transition active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Bill</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs: Tiffin Entries vs Payments History */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('tiffins')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'tiffins'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Tiffin Records ({customerBills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'payments'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments Made ({customerPayments.length})</span>
          </button>
        </div>

        {/* Quick Settle All Button */}
        {pendingDue > 0 && (
          <button
            onClick={handleMarkAllPaid}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto transition border border-emerald-300 dark:border-emerald-800"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Paid (Clear Dues)</span>
          </button>
        )}
      </div>

      {/* TAB 1: Tiffin Entries Table */}
      {activeTab === 'tiffins' && (
        <div className="space-y-4">
          {/* Filters Bar for Tiffins */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Filter Month:</span>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="all">All Months</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setPaidFilter('all')}
                className={`px-2.5 py-1 rounded-lg ${paidFilter === 'all' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                All
              </button>
              <button
                onClick={() => setPaidFilter('unpaid')}
                className={`px-2.5 py-1 rounded-lg ${paidFilter === 'unpaid' ? 'bg-red-500 text-white' : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'}`}
              >
                Unpaid Only
              </button>
              <button
                onClick={() => setPaidFilter('paid')}
                className={`px-2.5 py-1 rounded-lg ${paidFilter === 'paid' ? 'bg-emerald-600 text-white' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'}`}
              >
                Paid Only
              </button>
            </div>
          </div>

          {/* Table of Tiffin Records */}
          {filteredBills.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
              <p className="text-sm font-semibold text-slate-500">No tiffin entries found for this filter.</p>
              <button
                onClick={() => onOpenAddTiffin(customer)}
                className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600"
              >
                + Add Tiffin for {customer.name}
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3.5 px-4">Date & Day</th>
                      <th className="py-3.5 px-4">Meal Time</th>
                      <th className="py-3.5 px-4 text-center">Quantity</th>
                      <th className="py-3.5 px-4 text-right">Tiffin Price</th>
                      <th className="py-3.5 px-4 text-right">Total Price</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {filteredBills.map(bill => {
                      const { day, date } = formatDayAndDate(bill.date);
                      return (
                        <tr key={bill.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                          {/* Date */}
                          <td className="py-3 px-4 font-semibold">
                            <div>
                              <span className="text-slate-900 dark:text-white font-bold">{date}</span>
                              <span className="ml-1.5 text-[11px] text-slate-400">({day})</span>
                            </div>
                            {bill.note && (
                              <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5 font-normal">
                                💬 {bill.note}
                              </p>
                            )}
                          </td>

                          {/* Meal Time */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {bill.mealTime === 'Lunch' && '🍱 Lunch'}
                              {bill.mealTime === 'Dinner' && '🌙 Dinner'}
                              {bill.mealTime === 'Breakfast' && '🌅 Breakfast'}
                              {bill.mealTime === 'Evening Snacks' && '☕ Snacks'}
                            </span>
                          </td>

                          {/* Quantity */}
                          <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                            {bill.quantity}
                          </td>

                          {/* Tiffin Price */}
                          <td className="py-3 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                            {formatCurrency(bill.price, settings.currencySymbol)}
                          </td>

                          {/* Total Price */}
                          <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                            {formatCurrency(bill.total, settings.currencySymbol)}
                          </td>

                          {/* Paid Status Toggle */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => toggleTiffinPaidStatus(bill.id)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center space-x-1 cursor-pointer transition ${
                                bill.paidStatus
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              }`}
                              title="Click to toggle Paid/Unpaid"
                            >
                              {bill.paidStatus ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>PAID</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>DUE</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => onOpenEditTiffin(bill)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 transition"
                                title="Edit Record"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setBillToDelete(bill)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Payment Records Table */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Payment Receipts ({customerPayments.length})
            </h3>
            <button
              onClick={() => onOpenPaymentModal(customer)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
            >
              + Record New Payment
            </button>
          </div>

          {customerPayments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
              <p className="text-sm font-semibold text-slate-500">No payment records logged yet.</p>
              <button
                onClick={() => onOpenPaymentModal(customer)}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Record First Payment
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Ref / Note</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {customerPayments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {formatDate(p.date, { showDay: true })}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(p.amount, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-medium text-[11px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {p.referenceNumber && <span className="font-mono block">{p.referenceNumber}</span>}
                        {p.note && <span>{p.note}</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setPaymentToDelete(p)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-slate-800"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bill Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!billToDelete}
        onClose={() => setBillToDelete(null)}
        onConfirm={() => {
          if (billToDelete) {
            deleteTiffin(billToDelete.id);
            setBillToDelete(null);
          }
        }}
        title="Delete Tiffin Entry"
        message={`Are you sure you want to delete this ${billToDelete?.mealTime} tiffin entry for ${formatDate(billToDelete?.date || '', { showDay: true })}?`}
        itemName={`${billToDelete?.quantity}x ${billToDelete?.mealTime}`}
      />

      {/* Payment Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={() => {
          if (paymentToDelete) {
            deletePayment(paymentToDelete.id);
            setPaymentToDelete(null);
          }
        }}
        title="Delete Payment Record"
        message={`Are you sure you want to delete this payment record of ${formatCurrency(paymentToDelete?.amount || 0, settings.currencySymbol)}?`}
        itemName={`${formatCurrency(paymentToDelete?.amount || 0, settings.currencySymbol)} (${paymentToDelete?.paymentMethod})`}
      />

      {/* Mark All Paid Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showMarkAllPaidModal}
        onClose={() => setShowMarkAllPaidModal(false)}
        onConfirm={() => {
          handleConfirmMarkAllPaid();
          setShowMarkAllPaidModal(false);
        }}
        title="Settle All Pending Bills"
        message={`Are you sure you want to mark all pending tiffin bills as PAID for ${customer.name}?`}
        itemName={customer.name}
      />
    </div>
  );
};
