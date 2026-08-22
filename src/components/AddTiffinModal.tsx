import React, { useState, useEffect } from 'react';
import { Customer, TiffinBill, MealTime } from '../types';
import { useTiffin } from '../context/TiffinContext';
import { getTodayString, formatCurrency, generateWhatsAppBillText, openWhatsApp } from '../utils/formatters';
import { 
  X, 
  Utensils, 
  Calendar, 
  Clock, 
  IndianRupee, 
  Plus, 
  Minus, 
  Trash2, 
  Share2, 
  CreditCard, 
  FileText, 
  UserCheck, 
  FileEdit 
} from 'lucide-react';

interface AddTiffinModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string | null;
  billToEdit?: TiffinBill | null;
  onOpenPaymentModal?: (customer: Customer) => void;
  onOpenInvoice?: (customer: Customer) => void;
}

export const AddTiffinModal: React.FC<AddTiffinModalProps> = ({
  isOpen,
  onClose,
  customerId,
  billToEdit,
  onOpenPaymentModal,
  onOpenInvoice,
}) => {
  const { customers, addTiffin, updateTiffin, deleteTiffin, settings, bills, payments } = useTiffin();

  const [selectedCustId, setSelectedCustId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayString());
  const [mealTime, setMealTime] = useState<MealTime>('Lunch');
  const [price, setPrice] = useState<number>(settings.defaultPrice || 70);
  const [quantity, setQuantity] = useState<number>(1);
  const [paidStatus, setPaidStatus] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  const targetCustomer = customers.find(c => c.id === (billToEdit ? billToEdit.customerId : selectedCustId));

  useEffect(() => {
    if (billToEdit) {
      setSelectedCustId(billToEdit.customerId);
      setDate(billToEdit.date);
      setMealTime(billToEdit.mealTime);
      setPrice(billToEdit.price);
      setQuantity(billToEdit.quantity);
      setPaidStatus(billToEdit.paidStatus);
      setNote(billToEdit.note || '');
    } else {
      const initialCustId = customerId || (customers.length > 0 ? customers[0].id : '');
      setSelectedCustId(initialCustId);
      setDate(getTodayString());
      setMealTime('Lunch');
      const cust = customers.find(c => c.id === initialCustId);
      setPrice(cust?.defaultPrice || settings.defaultPrice || 70);
      setQuantity(1);
      setPaidStatus(false);
      setNote('');
    }
    setError('');
  }, [billToEdit, customerId, isOpen, customers, settings.defaultPrice]);

  // When customer changes in standalone mode, adjust default price
  const handleCustomerChange = (newCustId: string) => {
    setSelectedCustId(newCustId);
    const cust = customers.find(c => c.id === newCustId);
    if (cust && !billToEdit) {
      setPrice(cust.defaultPrice || settings.defaultPrice || 70);
    }
  };

  if (!isOpen) return null;

  const totalAmount = (quantity || 0) * (price || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustId) {
      setError('Please select a customer');
      return;
    }
    if (!date) {
      setError('Please choose a date');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be at least 1');
      return;
    }
    if (price < 0) {
      setError('Price cannot be negative');
      return;
    }

    if (billToEdit) {
      updateTiffin(billToEdit.id, {
        customerId: selectedCustId,
        date,
        mealTime,
        price: Number(price),
        quantity: Number(quantity),
        paidStatus,
        note: note.trim() || undefined,
      });
    } else {
      addTiffin({
        customerId: selectedCustId,
        date,
        mealTime,
        price: Number(price),
        quantity: Number(quantity),
        paidStatus,
        note: note.trim() || undefined,
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (billToEdit && confirm('Are you sure you want to delete this tiffin record?')) {
      deleteTiffin(billToEdit.id);
      onClose();
    }
  };

  const handleShareWhatsApp = () => {
    if (!targetCustomer) return;
    const text = generateWhatsAppBillText(targetCustomer, bills, payments, settings);
    openWhatsApp(targetCustomer.number, text);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            {billToEdit ? <FileEdit className="w-5 h-5 text-blue-400" /> : <Utensils className="w-5 h-5 text-blue-400" />}
            <div>
              <h2 className="text-base font-bold">
                {billToEdit
                  ? `Edit Tiffin Entry: ${targetCustomer?.name || 'Customer'}`
                  : `Add Tiffin: ${targetCustomer?.name || 'Customer'}`}
              </h2>
              {targetCustomer && (
                <p className="text-xs text-slate-400 font-mono">{targetCustomer.number}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Navigation Options (Delete, Share, Payment, View Bill) */}
        {targetCustomer && (
          <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-around text-xs font-semibold text-slate-700 dark:text-slate-300">
            {billToEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-2 py-1 rounded-lg transition"
                title="Delete this record"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2 py-1 rounded-lg transition"
              title="Share bill on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {onOpenPaymentModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(targetCustomer);
                }}
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2 py-1 rounded-lg transition"
                title="Record payment"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payment</span>
              </button>
            )}

            {onOpenInvoice && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInvoice(targetCustomer);
                }}
                className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded-lg transition"
                title="View detailed bill invoice"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Bill</span>
              </button>
            )}
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Customer Selection (if not locked) */}
          {!billToEdit && !customerId && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Customer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  value={selectedCustId}
                  onChange={e => handleCustomerChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.number})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Choose Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Meal Time Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Meal Time</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Breakfast', 'Lunch', 'Dinner', 'Evening Snacks'] as MealTime[]).map(meal => {
                const isSelected = mealTime === meal;
                return (
                  <button
                    type="button"
                    key={meal}
                    onClick={() => setMealTime(meal)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border transition text-center ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/30'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {meal === 'Breakfast' && 'Breakfast'}
                    {meal === 'Lunch' && 'Lunch'}
                    {meal === 'Dinner' && 'Dinner'}
                    {meal === 'Evening Snacks' && 'Snacks'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price & Quantity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Set Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rate (per Tiffin) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={price === 0 ? '' : price}
                  onChange={e => {
                    const val = e.target.value;
                    setPrice(val === '' ? 0 : parseFloat(val) || 0);
                  }}
                  required
                  placeholder="e.g. 70, 73, 82.50"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Set Quantity with Stepper */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                  required
                  className="flex-1 text-center py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Total Calculation Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Total Amount ({quantity} × {formatCurrency(price, settings.currencySymbol)}):
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">
              {formatCurrency(totalAmount, settings.currencySymbol)}
            </span>
          </div>

          {/* Paid Status Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Payment Status
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {paidStatus ? 'Marked as Paid instantly' : 'Add to customer unpaid tab'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={paidStatus}
                onChange={e => setPaidStatus(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Extra Chapatis, Half meal, Guest tiffin..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Form Submit */}
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
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-600/25 transition active:scale-95 flex items-center space-x-1.5"
            >
              <span>{billToEdit ? 'UPDATE ENTRY' : 'SAVE TIFFIN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
