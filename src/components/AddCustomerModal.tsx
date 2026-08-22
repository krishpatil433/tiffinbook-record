import React, { useState, useEffect } from 'react';
import { Customer, MealTime } from '../types';
import { useTiffin } from '../context/TiffinContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { X, UserPlus, Phone, User, MapPin, IndianRupee, Contact2, Check, Trash2 } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  onCustomerDeleted?: (customerId: string) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  onCustomerDeleted,
}) => {
  const { addCustomer, updateCustomer, deleteCustomer, settings } = useTiffin();

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [address, setAddress] = useState('');
  const [defaultPrice, setDefaultPrice] = useState<number>(settings.defaultPrice || 70);
  const [defaultMeals, setDefaultMeals] = useState<MealTime[]>(['Lunch', 'Dinner']);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [supportsContacts, setSupportsContacts] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // Check Contact Picker API support
    if ('contacts' in navigator && 'ContactsManager' in window) {
      setSupportsContacts(true);
    }
  }, []);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setNumber(customerToEdit.number);
      setAddress(customerToEdit.address || '');
      setDefaultPrice(customerToEdit.defaultPrice || settings.defaultPrice || 70);
      setDefaultMeals(customerToEdit.defaultMeals || ['Lunch', 'Dinner']);
      setNotes(customerToEdit.notes || '');
    } else {
      setName('');
      setNumber('');
      setAddress('');
      setDefaultPrice(settings.defaultPrice || 70);
      setDefaultMeals(['Lunch', 'Dinner']);
      setNotes('');
    }
    setError('');
  }, [customerToEdit, isOpen, settings.defaultPrice]);

  if (!isOpen) return null;

  const handlePickContact = async () => {
    try {
      if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
        const props = ['name', 'tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: false });
        if (contacts && contacts.length > 0) {
          const selected = contacts[0];
          if (selected.name && selected.name[0]) {
            setName(selected.name[0]);
          }
          if (selected.tel && selected.tel[0]) {
            // Clean phone string
            const rawTel = selected.tel[0].replace(/[^0-9+]/g, '');
            setNumber(rawTel);
          }
        }
      } else {
        alert('Device contact picker is not supported on this browser. Please enter details manually.');
      }
    } catch (err) {
      console.log('Contact pick cancelled or error', err);
    }
  };

  const toggleMeal = (meal: MealTime) => {
    setDefaultMeals(prev =>
      prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!number.trim()) {
      setError('Phone number is required');
      return;
    }

    if (customerToEdit) {
      updateCustomer(customerToEdit.id, {
        name: name.trim(),
        number: number.trim(),
        address: address.trim(),
        defaultPrice: Number(defaultPrice) || 70,
        defaultMeals,
        notes: notes.trim(),
      });
    } else {
      addCustomer({
        name: name.trim(),
        number: number.trim(),
        address: address.trim(),
        defaultPrice: Number(defaultPrice) || 70,
        defaultMeals,
        status: 'active',
        notes: notes.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold">
              {customerToEdit ? 'Edit Customer' : 'Add New Customer'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Contact Picker banner if on supported mobile */}
          {supportsContacts && !customerToEdit && (
            <button
              type="button"
              onClick={handlePickContact}
              className="w-full py-2 px-3 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
            >
              <Contact2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Choose from Device Contacts</span>
            </button>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Phone Number Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                placeholder="e.g. 9823412345"
                value={number}
                onChange={e => setNumber(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Default Price & Address Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Rate ({settings.currencySymbol})
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={defaultPrice === 0 ? '' : defaultPrice}
                  onChange={e => {
                    const val = e.target.value;
                    setDefaultPrice(val === '' ? 0 : parseFloat(val) || 0);
                  }}
                  placeholder="e.g. 70, 73, 82.50"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Address / Room No.
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Room 204, Sai PG"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Regular Meals Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Regular Meals Preference
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Breakfast', 'Lunch', 'Dinner', 'Evening Snacks'] as MealTime[]).map(meal => {
                const isSelected = defaultMeals.includes(meal);
                return (
                  <button
                    type="button"
                    key={meal}
                    onClick={() => toggleMeal(meal)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1 transition ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                    <span>{meal === 'Evening Snacks' ? 'Snacks' : meal}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes / Special Preferences */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Notes / Diet Preference (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Jain food, No spicy, Deliver before 8:30 PM..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {customerToEdit ? (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition flex items-center space-x-1 border border-red-200 dark:border-red-900/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Customer</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-600/25 transition active:scale-95"
              >
                {customerToEdit ? 'UPDATE CUSTOMER' : 'SAVE CUSTOMER'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {customerToEdit && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            deleteCustomer(customerToEdit.id);
            if (onCustomerDeleted) {
              onCustomerDeleted(customerToEdit.id);
            }
            onClose();
          }}
          itemName={customerToEdit.name}
        />
      )}
    </div>
  );
};
