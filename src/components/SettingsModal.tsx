import React, { useState, useEffect, useRef } from 'react';
import { useTiffin } from '../context/TiffinContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { 
  X, 
  Settings, 
  Building2, 
  Phone, 
  MapPin, 
  IndianRupee, 
  QrCode, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  Trash2,
  FileText
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    settings, 
    updateSettings, 
    resetToSampleData, 
    clearAllData, 
    exportBackupJSON, 
    importBackupJSON 
  } = useTiffin();

  const [formData, setFormData] = useState({ ...settings });
  const [success, setSuccess] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
      setSuccess('');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSuccess('Business settings updated successfully!');
    setTimeout(() => {
      setSuccess('');
      onClose();
    }, 1200);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tiffinbook_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setSuccess('Backup downloaded successfully!');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importBackupJSON(content);
        if (ok) {
          setSuccess('Database restored successfully from backup file!');
          setTimeout(() => onClose(), 1200);
        } else {
          setSuccess('Invalid backup JSON format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    resetToSampleData();
    setSuccess('Sample data loaded successfully!');
    setTimeout(() => onClose(), 1200);
  };

  const handleConfirmClear = () => {
    clearAllData();
    setSuccess('All records cleared successfully.');
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold">Business & App Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center space-x-2 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Business Profile */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4" />
              <span>Business Profile & Invoicing Details</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Name (Printed on Invoices)
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone Numbers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Contact Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.primaryPhone}
                    onChange={e => setFormData({ ...formData, primaryPhone: e.target.value })}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Secondary Contact Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.secondaryPhone}
                    onChange={e => setFormData({ ...formData, secondaryPhone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Kitchen / Office Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* UPI ID & Default Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  UPI ID (For Payment QR Code)
                </label>
                <div className="relative">
                  <QrCode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. 7798719246@upi"
                    value={formData.upiId}
                    onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Standard Default Rate
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.defaultPrice === 0 ? '' : formData.defaultPrice}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, defaultPrice: val === '' ? 0 : parseFloat(val) || 0 });
                    }}
                    placeholder="e.g. 70, 73, 82.50"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Footer Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Footer Notice / Payment Terms
              </label>
              <textarea
                rows={2}
                value={formData.invoiceNote}
                onChange={e => setFormData({ ...formData, invoiceNote: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Database Backup & Restore Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Download className="w-4 h-4 text-blue-500" />
              <span>Data Management & Backup</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700 transition"
              >
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Export Backup (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700 transition"
              >
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Import Backup File</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Load Sample Demo Data</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="text-xs text-red-500 hover:text-red-700 flex items-center space-x-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Records</span>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
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
              <Save className="w-4 h-4" />
              <span>SAVE SETTINGS</span>
            </button>
          </div>
        </form>
      </div>

      {/* Reset to Sample Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleConfirmReset}
        title="Load Sample Demo Data"
        message="Are you sure you want to reset the database to sample customers, meal logs, and payment records?"
      />

      {/* Clear All Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClear}
        title="Clear All Records"
        message="Warning: This will permanently delete all customers, tiffin logs, invoices, and payment receipts. Are you sure you want to start fresh?"
      />
    </div>
  );
};
