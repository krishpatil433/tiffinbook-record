import React, { useState, useRef } from 'react';
import { useTiffin } from '../context/TiffinContext';
import { 
  Database, 
  Download, 
  Upload, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  X, 
  AlertCircle,
  FileCheck,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { 
    customers, 
    bills, 
    payments, 
    settings, 
    exportBackupJSON, 
    importBackupJSON,
    totalDueOverall 
  } = useTiffin();

  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pasteCodeMode, setPasteCodeMode] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 3500);
  };

  const handleDownload = () => {
    try {
      const jsonStr = exportBackupJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `TiffinBook_Data_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Backup file downloaded successfully!');
    } catch {
      showNotification('Failed to download backup file.', 'error');
    }
  };

  const handleCopyCode = async () => {
    try {
      const jsonStr = exportBackupJSON();
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      showNotification('Backup data copied to clipboard! You can paste it into notes or WhatsApp.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showNotification('Could not copy automatically. You can download the file instead.', 'error');
    }
  };

  const handleShareMobile = async () => {
    try {
      const jsonStr = exportBackupJSON();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `TiffinBook_Backup_${dateStr}.json`;
      
      const file = new File([jsonStr], filename, { type: 'application/json' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `TiffinBook Data Backup (${dateStr})`,
          text: `Backup of ${customers.length} customers and ${bills.length} meal records from TiffinBook.`,
          files: [file],
        });
        showNotification('Backup shared successfully!');
      } else if (navigator.share) {
        // Fallback to text share if file sharing is not supported by the browser
        await navigator.share({
          title: 'TiffinBook Backup Data',
          text: jsonStr,
        });
        showNotification('Backup text shared successfully!');
      } else {
        handleDownload();
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        handleDownload();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (!content) {
        showNotification('File was empty.', 'error');
        return;
      }
      processImport(content);
    };
    reader.onerror = () => {
      showNotification('Error reading selected file.', 'error');
    };
    reader.readAsText(file);
    // Reset file input so user can pick again if needed
    e.target.value = '';
  };

  const processImport = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || (!parsed.customers && !parsed.bills)) {
        showNotification('Invalid backup file. Must contain customer or billing records.', 'error');
        return;
      }

      const custCount = Array.isArray(parsed.customers) ? parsed.customers.length : 0;
      const billCount = Array.isArray(parsed.bills) ? parsed.bills.length : 0;

      const confirmMsg = `Found backup containing:\n• ${custCount} Customers\n• ${billCount} Meal Records\n\nDo you want to restore this data into your app?`;
      if (window.confirm(confirmMsg)) {
        const ok = importBackupJSON(jsonStr);
        if (ok) {
          showNotification(`Restored successfully! Loaded ${custCount} customers.`, 'success');
          setPasteCodeMode(false);
          setPastedJson('');
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          showNotification('Failed to import backup data.', 'error');
        }
      }
    } catch {
      showNotification('Could not read JSON. Please make sure the code or file is valid.', 'error');
    }
  };

  const handlePasteRestore = () => {
    if (!pastedJson.trim()) {
      showNotification('Please paste your backup JSON code first.', 'error');
      return;
    }
    processImport(pastedJson.trim());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                Customer Data Backup & Storage
              </h2>
              <p className="text-[11px] text-slate-400">
                Safely save, export, or restore your records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Notification Banner */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
            }`}>
              {statusMessage.type === 'success' ? (
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Current Database Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Currently Stored in Your App</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active & Protected</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/50">
                <p className="text-lg font-black text-slate-900 dark:text-white">{customers.length}</p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Customers</p>
              </div>

              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/50">
                <p className="text-lg font-black text-slate-900 dark:text-white">{bills.length}</p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Meal Logs</p>
              </div>

              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/50">
                <p className="text-lg font-black text-slate-900 dark:text-white">{payments.length}</p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Payments</p>
              </div>

              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/50">
                <p className="text-sm font-black text-red-600 dark:text-red-400 truncate mt-1">
                  {formatCurrency(totalDueOverall)}
                </p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Due</p>
              </div>
            </div>

            {/* List of customer names preview */}
            {customers.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="truncate max-w-[280px] sm:max-w-sm">
                  Includes: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{customers.slice(0, 3).map(c => c.name).join(', ')}</strong>
                  {customers.length > 3 && ` +${customers.length - 3} more`}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                  {settings.businessName}
                </span>
              </div>
            )}
          </div>

          {/* Backup Options Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>Step 1: Save / Export Your Data</span>
            </h3>

            {/* Primary Action Button */}
            <button
              onClick={handleDownload}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/25 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Complete Backup (.json)</span>
            </button>

            {/* Secondary mobile options */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleShareMobile}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Share / WhatsApp</span>
              </button>

              <button
                onClick={handleCopyCode}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Copy Backup Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Restore / Import Section */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              <span>Step 2: Restore / Load Data on Any Device</span>
            </h3>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Opening the app on a new phone, Vercel, or Netlify? Upload your saved backup file or paste your code to bring all your customers and dues right back.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Backup File</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".json"
                className="hidden"
              />

              <button
                onClick={() => setPasteCodeMode(!pasteCodeMode)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{pasteCodeMode ? 'Close Paste Box' : 'Paste Code'}</span>
              </button>
            </div>

            {/* Paste Code Box */}
            {pasteCodeMode && (
              <div className="space-y-2 pt-2 animate-fadeIn">
                <textarea
                  value={pastedJson}
                  onChange={e => setPastedJson(e.target.value)}
                  placeholder="Paste your backup JSON code here..."
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handlePasteRestore}
                  disabled={!pastedJson.trim()}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center space-x-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore from Pasted Code</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Migration Tip */}
          <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-[11px] text-blue-900 dark:text-blue-300 space-y-1">
            <p className="font-bold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span>How to switch to your Vercel deployment safely:</span>
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-600 dark:text-slate-400 pl-1">
              <li>Tap <strong>Download Complete Backup</strong> right now.</li>
              <li>Open your deployed <strong>Vercel link</strong>.</li>
              <li>Tap <strong>Backup Data</strong> &gt; <strong>Upload Backup File</strong>.</li>
              <li>All your customers (e.g. Krishgen, Vilas) and records will be instantly loaded!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
