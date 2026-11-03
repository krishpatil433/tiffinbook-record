import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  IndianRupee, 
  QrCode, 
  Smartphone, 
  Share2, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatCurrency, openWhatsApp } from '../utils/formatters';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  upiId: string;
  payeeName: string;
  amount: number;
  note?: string;
  currencySymbol?: string;
  customerName?: string;
  invoiceNumber?: string;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  isOpen,
  onClose,
  upiId,
  payeeName,
  amount,
  note = 'Tiffin bill payment',
  currencySymbol = '₹',
  customerName = '',
  invoiceNumber = '',
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const cleanUpi = upiId.trim() || '7798719246@upi';
  const cleanPayee = encodeURIComponent(payeeName.trim() || 'Krish Tiffin Service');
  const cleanNote = encodeURIComponent(note.trim() || 'Tiffin bill');
  const amtStr = amount > 0 ? `&am=${amount.toFixed(2)}` : '';

  // Standard UPI URI
  const upiUri = `upi://pay?pa=${cleanUpi}&pn=${cleanPayee}${amtStr}&cu=INR&tn=${cleanNote}`;

  // App-specific deep links
  const gpayUri = `gpay://upi/pay?pa=${cleanUpi}&pn=${cleanPayee}${amtStr}&cu=INR&tn=${cleanNote}`;
  const phonepeUri = `phonepe://pay?pa=${cleanUpi}&pn=${cleanPayee}${amtStr}&cu=INR&tn=${cleanNote}`;
  const paytmUri = `paytmmp://pay?pa=${cleanUpi}&pn=${cleanPayee}${amtStr}&cu=INR&tn=${cleanNote}`;
  const bhimUri = `bhim://pay?pa=${cleanUpi}&pn=${cleanPayee}${amtStr}&cu=INR&tn=${cleanNote}`;

  // Universal Web Payment URL (always works in PDFs, web views, and shares)
  const webPayUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?pay=1&pa=${encodeURIComponent(cleanUpi)}&pn=${cleanPayee}&am=${amount > 0 ? amount.toFixed(2) : ''}&tn=${cleanNote}`
    : '';

  // Generate QR Code
  useEffect(() => {
    if (!isOpen || !upiUri) return;
    QRCode.toDataURL(upiUri, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR code in modal:', err));
  }, [isOpen, upiUri]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(cleanUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyPayLink = () => {
    if (!webPayUrl) return;
    navigator.clipboard.writeText(webPayUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAppLaunch = (uri: string, fallbackUri: string) => {
    // Attempt app-specific scheme first, fallback to standard UPI
    const start = Date.now();
    window.location.href = uri;
    setTimeout(() => {
      if (Date.now() - start < 1500) {
        window.location.href = fallbackUri;
      }
    }, 600);
  };

  const handleShareWhatsAppPay = () => {
    const text = `🍱 *${payeeName || 'KRISH TIFFIN SERVICE'}* - Payment Request\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      (customerName ? `👤 *Customer:* ${customerName}\n` : '') +
      (invoiceNumber ? `📄 *Invoice:* ${invoiceNumber}\n` : '') +
      `💰 *Total Amount Payable:* *${currencySymbol}${amount}*\n\n` +
      `💳 *UPI ID:* \`${cleanUpi}\`\n\n` +
      `📲 *Click to Pay directly via any UPI App:*\n${webPayUrl || upiUri}\n\n` +
      `_Scan QR or tap link to open Google Pay, PhonePe, Paytm, or BHIM._`;
    openWhatsApp('', text);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-blue-200 text-xs uppercase font-bold tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Instant UPI Payment Checkout</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {formatCurrency(amount, currencySymbol)}
          </h2>

          <p className="text-xs text-blue-100 font-medium truncate mt-0.5">
            Paying to: <span className="font-bold text-white">{payeeName || 'Krish Tiffin Service'}</span>
          </p>
          {customerName && (
            <p className="text-[11px] text-blue-200 truncate mt-0.5">
              Customer: {customerName} {invoiceNumber ? `• ${invoiceNumber}` : ''}
            </p>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Main Direct 1-Tap UPI Launch Button */}
          <div>
            <a
              href={upiUri}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition text-center no-underline"
            >
              <Smartphone className="w-5 h-5" />
              <span>⚡ OPEN IN ANY UPI APP (AUTO-PAY)</span>
            </a>
            <p className="text-[10px] text-slate-500 text-center mt-1">
              Works directly on Android &amp; iOS devices with Google Pay, PhonePe, or Paytm
            </p>
          </div>

          {/* Quick Individual App Buttons */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Or Choose Your Favorite App:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* Google Pay */}
              <button
                type="button"
                onClick={() => handleAppLaunch(gpayUri, upiUri)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center space-x-2 transition active:scale-95 shadow-xs"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Google Pay</span>
              </button>

              {/* PhonePe */}
              <button
                type="button"
                onClick={() => handleAppLaunch(phonepeUri, upiUri)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-purple-50/50 dark:hover:bg-purple-950/40 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center space-x-2 transition active:scale-95 shadow-xs"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <span>PhonePe</span>
              </button>

              {/* Paytm */}
              <button
                type="button"
                onClick={() => handleAppLaunch(paytmUri, upiUri)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50/50 dark:hover:bg-sky-950/40 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center space-x-2 transition active:scale-95 shadow-xs"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span>Paytm</span>
              </button>

              {/* BHIM / Others */}
              <button
                type="button"
                onClick={() => handleAppLaunch(bhimUri, upiUri)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center space-x-2 transition active:scale-95 shadow-xs"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>BHIM / CRED</span>
              </button>
            </div>
          </div>

          {/* QR Code Section (Guaranteed for Desktop, PDF & Print) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col items-center text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>Scan QR Code with Any Phone</span>
            </span>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`UPI QR for ${cleanUpi}`}
                  className="w-44 h-44 object-contain"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Open your camera or any UPI app to scan and pay directly.
            </p>
          </div>

          {/* Copy UPI ID Box */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-700">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                Official Business UPI ID:
              </span>
              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate block">
                {cleanUpi}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyUpi}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 flex items-center space-x-1 shrink-0 transition active:scale-95 shadow-xs"
            >
              {copiedUpi ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy UPI</span>
                </>
              )}
            </button>
          </div>

          {/* Share / Copy Payment Link for Customers */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleShareWhatsAppPay}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition active:scale-95 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyPayLink}
              className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-slate-700 transition active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Link Copied!</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  <span>Copy Pay Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            100% Safe &amp; Direct UPI Transfer
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
