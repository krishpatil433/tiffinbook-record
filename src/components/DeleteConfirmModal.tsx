import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  message = 'Are you sure you want to delete this customer and all associated meal and payment records? This action cannot be undone.',
  itemName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-red-600 dark:bg-red-700 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              {itemName && (
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Customer: <span className="text-red-600 dark:text-red-400">{itemName}</span>
                </p>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
            ⚠️ <strong>Warning:</strong> All tiffin delivery records, meal history, and payment transactions for this customer will be permanently removed.
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md shadow-red-600/25 transition active:scale-95 flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>YES, DELETE PERMANENTLY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
