import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { useTiffin } from '../context/TiffinContext';
import { getTodayString, formatCurrency } from '../utils/formatters';
import confetti from 'canvas-confetti';
import { X, CreditCard, IndianRupee, Calendar, CheckCircle2, QrCode } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const { customers, recordPayment, getCustomerSummary, settings } = useTiffin();

  const [selectedCustId, setSelectedCustId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(getTodayString());
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI/GPay' | 'PhonePe' | 'Paytm' | 'Bank Transfer' | 'Other'>('UPI/GPay');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  const targetCust = customers.find(c => c.id === (customer ? customer.id : selectedCustId));
  const summary = targetCust ? getCustomerSummary(targetCust.id) : null;
  const currentDue = summary?.dueAmount || 0;

  useEffect(() => {
    if (customer) {
      setSelectedCustId(customer.id);
      const custSummary = getCustomerSummary(customer.id);
      const due = custSummary?.dueAmount || 0;
      setAmount(due > 0 ? due : 500);
    } else if (customers.length > 0) {
      setSelectedCustId(customers[0].id);
      const custSummary = getCustomerSummary(customers[0].id);
      const due = custSummary?.dueAmount || 0;
      setAmount(due > 0 ? due : 500);
    }
    setDate(getTodayString());
    setPaymentMethod('UPI/GPay');
    setReferenceNumber('');
    setNote('');
    setError('');
  }, [customer, isOpen, customers]);

  if (!isOpen) return null;

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustId(custId);
    const s = getCustomerSummary(custId);
    if (s && s.dueAmount > 0) {
      setAmount(s.dueAmount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCust) {
      setError('Please select a customer');
      return;
    }
    if (amount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    recordPayment({
      customerId: targetCust.id,
      amount: Number(amount),
      date,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      note: note.trim() || undefined,
    });

    // Celebrate if cleared due
    if (amount >= currentDue && currentDue > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.log(err);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">Record Payment</h2>
              <p className="text-xs text-slate-400">
                {targetCust ? targetCust.name : 'Select Customer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Due Balance Card */}
        {targetCust && (
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Current Pending Due
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {targetCust.name} • {targetCust.number}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-red-600 dark:text-red-500 font-mono">
                {formatCurrency(currentDue, settings.currencySymbol)}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Customer select if standalone */}
          {!customer && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustId}
                onChange={e => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {customers.map(c => {
                  const s = getCustomerSummary(c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} (Due: {formatCurrency(s?.dueAmount || 0, settings.currencySymbol)})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Amount Field with Quick preset buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount ({settings.currencySymbol}) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="0.01"
                step="any"
                value={amount === 0 ? '' : amount}
                onChange={e => {
                  const val = e.target.value;
                  setAmount(val === '' ? 0 : parseFloat(val) || 0);
                }}
                required
                placeholder="e.g. 500, 750.50, 1200"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            {/* Quick preset buttons */}
            {currentDue > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setAmount(currentDue)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 transition border border-emerald-300 dark:border-emerald-800 font-mono"
                >
                  Pay Full Due ({formatCurrency(currentDue, settings.currencySymbol)})
                </button>
                {currentDue > 500 && (
                  <button
                    type="button"
                    onClick={() => setAmount(500)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 font-mono"
                  >
                    {formatCurrency(500, settings.currencySymbol)}
                  </button>
                )}
                {currentDue > 1000 && (
                  <button
                    type="button"
                    onClick={() => setAmount(1000)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 font-mono"
                  >
                    {formatCurrency(1000, settings.currencySymbol)}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['UPI/GPay', 'PhonePe', 'Paytm', 'Cash', 'Bank Transfer', 'Other'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition ${
                    paymentMethod === method
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Reference Number / UPI Txn ID */}
          {paymentMethod !== 'Cash' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction / Reference ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPI/4029102919 or GPay Txn ID"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes / Remark (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Handed cash in person, Advance for next week"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md shadow-emerald-600/25 transition active:scale-95 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>RECORD PAYMENT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
