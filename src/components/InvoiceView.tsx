import React, { useState, useMemo, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Customer, TiffinBill } from '../types';
import { useTiffin } from '../context/TiffinContext';
import { 
  formatCurrency, 
  formatDate, 
  formatDayAndDate, 
  getTodayString, 
  generateWhatsAppBillText, 
  openWhatsApp, 
  exportToCSV 
} from '../utils/formatters';
import { 
  Printer, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Phone, 
  MapPin, 
  Calendar, 
  Receipt, 
  QrCode,
  IndianRupee,
  Edit3,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Building2,
  Sliders,
  CheckCircle2,
  FileSpreadsheet,
  HelpCircle,
  Eye,
  Settings2
} from 'lucide-react';

interface InvoiceViewProps {
  initialCustomerId?: string | null;
}

export interface InvoiceRowItem {
  id: string;
  date: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
  status: 'PAID' | 'DUE' | 'CUSTOM';
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ initialCustomerId }) => {
  const { customers, bills, payments, settings } = useTiffin();

  // Customer & Month Selector State
  const [selectedCustId, setSelectedCustId] = useState<string>(
    initialCustomerId || (customers.length > 0 ? customers[0].id : '')
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [qrCopied, setQrCopied] = useState<boolean>(false);

  const customer = customers.find(c => c.id === selectedCustId);

  // Available months from customer's records
  const availableMonths = useMemo(() => {
    if (!customer) return [];
    const monthsSet = new Set<string>();
    bills.filter(b => b.customerId === customer.id).forEach(b => {
      if (b.date) monthsSet.add(b.date.substring(0, 7));
    });
    const curMonth = getTodayString().substring(0, 7);
    monthsSet.add(curMonth);
    return Array.from(monthsSet).sort().reverse();
  }, [bills, customer]);

  // Calculate Auto Last Month Pending Balance (before selected month)
  const autoLastMonthPending = useMemo(() => {
    if (!customer || selectedMonth === 'all') return 0;

    const startOfSelectedMonth = `${selectedMonth}-01`;

    // Filter prior bills
    const priorBills = bills.filter(
      b => b.customerId === customer.id && b.date < startOfSelectedMonth
    );
    const priorPayments = payments.filter(
      p => p.customerId === customer.id && p.date < startOfSelectedMonth
    );

    const priorBilledTotal = priorBills.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
    const priorPaidTotal = priorPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return Math.max(0, priorBilledTotal - priorPaidTotal);
  }, [bills, payments, customer, selectedMonth]);

  // Auto payments for selected month
  const autoCurrentPayments = useMemo(() => {
    if (!customer) return 0;
    const currentMonthPayments = payments.filter(
      p => p.customerId === customer.id && (selectedMonth === 'all' || p.date.startsWith(selectedMonth))
    );
    return currentMonthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments, customer, selectedMonth]);

  // Generate initial rows from DB bills
  const generateInitialRows = (): InvoiceRowItem[] => {
    if (!customer) return [];
    const currentBills = bills
      .filter(b => b.customerId === customer.id && (selectedMonth === 'all' || b.date.startsWith(selectedMonth)))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by date
    const map = new Map<string, { date: string; items: TiffinBill[]; totalQuantity: number; totalAmount: number; meals: string[] }>();
    
    currentBills.forEach(bill => {
      const existing = map.get(bill.date) || {
        date: bill.date,
        items: [],
        totalQuantity: 0,
        totalAmount: 0,
        meals: [],
      };
      existing.items.push(bill);
      existing.totalQuantity += Number(bill.quantity) || 1;
      existing.totalAmount += Number(bill.total) || 0;
      existing.meals.push(`${bill.quantity} ${bill.mealTime}`);
      map.set(bill.date, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((group, idx) => {
        const avgRate = group.totalQuantity > 0 ? group.totalAmount / group.totalQuantity : customer.defaultPrice || 70;
        return {
          id: `row-${idx}-${group.date}`,
          date: group.date,
          description: group.meals.join(', ') || 'Tiffin Delivery',
          quantity: group.totalQuantity,
          rate: avgRate,
          total: group.totalAmount,
          status: 'DUE',
        };
      });
  };

  // Editable Invoice Form State
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${selectedMonth.replace('-', '')}-001`,
    invoiceDate: getTodayString(),
    billingPeriod: selectedMonth === 'all' ? 'All Records' : `${selectedMonth}`,
    businessName: settings.businessName || 'KRISH TIFFIN SERVICE',
    businessTagline: settings.tagline || 'Pure, Fresh & Hygienic Home Meals',
    businessPhone: settings.primaryPhone || '7798719246',
    businessPhoneSecondary: settings.secondaryPhone || '',
    businessAddress: settings.address || 'Shop No. 4, Shree Krishna Residency, Near Model College',
    customerName: customer?.name || '',
    customerPhone: customer?.number || '',
    customerAddress: customer?.address || '',
    rows: [] as InvoiceRowItem[],
    lastMonthPending: 0,
    notes: settings.invoiceNote || 'Thank you for your business! Please clear monthly dues by the 5th.',
    terms: '1. Food once delivered is non-returnable. 2. Please notify delivery pauses 12 hours in advance.',
    signatoryName: settings.ownerName || 'Authorized Signatory',
  });

  // QR Code Customization State
  const [qrUpiId, setQrUpiId] = useState<string>(settings.upiId || '7798719246@upi');
  const [qrPayeeName, setQrPayeeName] = useState<string>(settings.businessName || 'Krish Tiffin Service');
  const [qrCustomAmount, setQrCustomAmount] = useState<number | ''>('');
  const [qrNote, setQrNote] = useState<string>(`Tiffin bill - ${customer?.name || ''}`);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Synchronize state when selected customer, month, or settings change
  useEffect(() => {
    if (!customer) return;
    const initialRows = generateInitialRows();
    const custNum = customer.number.slice(-4) || '001';
    const monthCode = selectedMonth === 'all' ? 'ALL' : selectedMonth.replace('-', '');

    setInvoiceData({
      invoiceNumber: `INV-${monthCode}-${custNum}`,
      invoiceDate: getTodayString(),
      billingPeriod: selectedMonth === 'all' ? 'All Time Billing' : `${selectedMonth}`,
      businessName: settings.businessName || 'KRISH TIFFIN SERVICE',
      businessTagline: settings.tagline || 'Pure, Fresh & Hygienic Home Meals',
      businessPhone: settings.primaryPhone || '7798719246',
      businessPhoneSecondary: settings.secondaryPhone || '',
      businessAddress: settings.address || 'Shop No. 4, Shree Krishna Residency, Near Model College',
      customerName: customer.name,
      customerPhone: customer.number,
      customerAddress: customer.address || '',
      rows: initialRows,
      lastMonthPending: autoLastMonthPending,
      notes: settings.invoiceNote || 'Thank you for your business! Please clear monthly dues by the 5th.',
      terms: '1. Food once delivered is non-returnable. 2. Please notify delivery pauses 12 hours in advance.',
      signatoryName: settings.ownerName || settings.businessName,
    });

    setQrUpiId(settings.upiId || '7798719246@upi');
    setQrPayeeName(settings.businessName || 'Krish Tiffin Service');
    setQrNote(`Tiffin bill ${selectedMonth} - ${customer.name}`);
    setQrCustomAmount('');
  }, [selectedCustId, selectedMonth, customer, autoLastMonthPending, settings]);

  // Calculations from editable state
  const totalTiffinsDelivered = useMemo(() => {
    return invoiceData.rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  }, [invoiceData.rows]);

  const currentMonthSubtotal = useMemo(() => {
    return invoiceData.rows.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
  }, [invoiceData.rows]);

  const grandTotalPayable = useMemo(() => {
    const sub = currentMonthSubtotal;
    const prev = Number(invoiceData.lastMonthPending) || 0;
    return Math.max(0, sub + prev);
  }, [currentMonthSubtotal, invoiceData.lastMonthPending]);

  // UPI URL construction & Real-time QR Code rendering
  const effectiveQrAmount = qrCustomAmount !== '' ? Number(qrCustomAmount) : grandTotalPayable;

  const upiPayUri = useMemo(() => {
    const cleanUpi = qrUpiId.trim();
    const cleanPayee = encodeURIComponent(qrPayeeName.trim());
    const amtStr = effectiveQrAmount > 0 ? `&am=${effectiveQrAmount.toFixed(2)}` : '';
    const noteStr = encodeURIComponent(qrNote.trim());
    return `upi://pay?pa=${cleanUpi}&pn=${cleanPayee}${amtStr}&cu=INR&tn=${noteStr}`;
  }, [qrUpiId, qrPayeeName, effectiveQrAmount, qrNote]);

  useEffect(() => {
    if (!upiPayUri) return;
    QRCode.toDataURL(upiPayUri, {
      width: 256,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [upiPayUri]);

  // Row Manipulation Handlers
  const handleUpdateRow = (id: string, field: keyof InvoiceRowItem, value: any) => {
    setInvoiceData(prev => {
      const updatedRows = prev.rows.map(r => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          // Auto update total if quantity or rate changed
          if (field === 'quantity' || field === 'rate') {
            const qty = field === 'quantity' ? Number(value) || 0 : r.quantity;
            const rate = field === 'rate' ? Number(value) || 0 : r.rate;
            updated.total = parseFloat((qty * rate).toFixed(2));
          }
          return updated;
        }
        return r;
      });
      return { ...prev, rows: updatedRows };
    });
  };

  const handleAddRow = () => {
    const newId = `custom-row-${Date.now()}`;
    const newRow: InvoiceRowItem = {
      id: newId,
      date: getTodayString(),
      description: 'Extra Tiffin / Special Thali',
      quantity: 1,
      rate: customer?.defaultPrice || settings.defaultPrice || 70,
      total: customer?.defaultPrice || settings.defaultPrice || 70,
      status: 'CUSTOM',
    };
    setInvoiceData(prev => ({
      ...prev,
      rows: [...prev.rows, newRow],
    }));
  };

  const handleDeleteRow = (id: string) => {
    setInvoiceData(prev => ({
      ...prev,
      rows: prev.rows.filter(r => r.id !== id),
    }));
  };

  const handleResetToAuto = () => {
    if (confirm('Reset all table rows and amounts back to original registered data?')) {
      const initialRows = generateInitialRows();
      setInvoiceData(prev => ({
        ...prev,
        rows: initialRows,
        lastMonthPending: autoLastMonthPending,
      }));
    }
  };

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!customer) return;
    const itemsFormatted = invoiceData.rows.map(r => ({
      date: r.date,
      description: r.description,
      quantity: r.quantity,
      rate: r.rate,
      total: r.total,
    }));

    const text = generateWhatsAppBillText(
      customer,
      bills,
      payments,
      settings,
      selectedMonth,
      {
        businessName: invoiceData.businessName,
        businessPhone: invoiceData.businessPhone,
        lastMonthPending: invoiceData.lastMonthPending,
        currentSubtotal: currentMonthSubtotal,
        grandTotal: grandTotalPayable,
        upiId: qrUpiId,
        items: itemsFormatted,
      }
    );
    openWhatsApp(invoiceData.customerPhone || customer.number, text);
  };

  const handleCopyBill = () => {
    if (!customer) return;
    const itemsFormatted = invoiceData.rows.map(r => ({
      date: r.date,
      description: r.description,
      quantity: r.quantity,
      rate: r.rate,
      total: r.total,
    }));

    const text = generateWhatsAppBillText(
      customer,
      bills,
      payments,
      settings,
      selectedMonth,
      {
        businessName: invoiceData.businessName,
        businessPhone: invoiceData.businessPhone,
        lastMonthPending: invoiceData.lastMonthPending,
        currentSubtotal: currentMonthSubtotal,
        grandTotal: grandTotalPayable,
        upiId: qrUpiId,
        items: itemsFormatted,
      }
    );
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `UPI_QR_${(invoiceData.customerName || 'Customer').replace(/\s+/g, '_')}_Rs${effectiveQrAmount}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (!customer) return;
    const headers = ['Date', 'Description', 'Quantity', 'Rate (₹)', 'Total Amount (₹)'];
    const rows = invoiceData.rows.map(r => [
      r.date,
      r.description,
      r.quantity,
      r.rate,
      r.total,
    ]);
    // Add summary rows
    rows.push(['', '', '', 'Current Month Subtotal', currentMonthSubtotal]);
    if (invoiceData.lastMonthPending > 0) {
      rows.push(['', '', '', 'Last Month Pending Due', invoiceData.lastMonthPending]);
    }
    rows.push(['', '', '', 'TOTAL DUE', grandTotalPayable]);

    exportToCSV(`Invoice_${invoiceData.customerName.replace(/\s+/g, '_')}_${selectedMonth}.csv`, headers, rows);
  };

  if (customers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-500">No customers registered yet. Please add a customer first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
      {/* Top Toolbar (Hidden on Print) */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Customer & Month Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer:</span>
              <select
                value={selectedCustId}
                onChange={e => setSelectedCustId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.number})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Month:</span>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              >
                <option value="all">All Months</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode Switch & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition border ${
                isEditMode
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="Toggle Live In-Place Edit Mode"
            >
              {isEditMode ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <Edit3 className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isEditMode ? 'Live Edit Mode Active' : 'Preview Mode'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 flex items-center space-x-1.5 transition shadow-sm"
              title="Print / Save PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              title="Share Customized Bill on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopyBill}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold flex items-center space-x-1"
              title="Copy Summary Text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleExportCSV}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Helper Banner in Edit Mode */}
        {isEditMode && (
          <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-200">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                <strong>Full Customization Enabled:</strong> You can click and directly edit every text field, address, row rate, quantity, and amounts.
              </span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleAddRow}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs flex items-center space-x-1 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Row</span>
              </button>
              <button
                type="button"
                onClick={handleResetToAuto}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded font-semibold text-xs flex items-center space-x-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to DB Data</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Printable & Customizable Invoice Card */}
      <div
        id="printable-invoice"
        className="max-w-4xl mx-auto border border-slate-300 dark:border-slate-700 p-6 sm:p-10 shadow-2xl relative bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-slate-100 transition-all print:border-none print:shadow-none print:p-2"
      >
        {/* Top Tag & Mode Indicator */}
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Invoice Ref:
            </span>
            <input
              type="text"
              value={invoiceData.invoiceNumber}
              onChange={e => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
              className="text-xs font-mono font-bold bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300 px-1 py-0.5"
            />
          </div>
          <span className="text-[10px] uppercase font-black text-slate-500 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded">
            Original Tax Invoice
          </span>
        </div>

        {/* Invoice Header: Company Branding (Fully Editable) */}
        <div className="text-center mb-8 space-y-1">
          <div>
            <input
              type="text"
              value={invoiceData.businessName}
              onChange={e => setInvoiceData({ ...invoiceData, businessName: e.target.value })}
              placeholder="ENTER BUSINESS NAME"
              className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none px-2 py-1"
            />
          </div>

          <div>
            <input
              type="text"
              value={invoiceData.businessTagline}
              onChange={e => setInvoiceData({ ...invoiceData, businessTagline: e.target.value })}
              placeholder="Business Tagline / Subtitle"
              className="text-xs text-slate-500 dark:text-slate-400 text-center w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none px-1"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1 font-mono">
            <div className="flex items-center space-x-1">
              <span>📞 Primary:</span>
              <input
                type="text"
                value={invoiceData.businessPhone}
                onChange={e => setInvoiceData({ ...invoiceData, businessPhone: e.target.value })}
                className="bg-transparent font-bold border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none w-28 text-center"
              />
            </div>
            {invoiceData.businessPhoneSecondary !== undefined && (
              <div className="flex items-center space-x-1">
                <span>• Secondary:</span>
                <input
                  type="text"
                  value={invoiceData.businessPhoneSecondary}
                  onChange={e => setInvoiceData({ ...invoiceData, businessPhoneSecondary: e.target.value })}
                  placeholder="Alt Phone"
                  className="bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none w-28 text-center"
                />
              </div>
            )}
          </div>

          {/* Full Company Address */}
          <div className="pt-1 max-w-xl mx-auto">
            <input
              type="text"
              value={invoiceData.businessAddress}
              onChange={e => setInvoiceData({ ...invoiceData, businessAddress: e.target.value })}
              placeholder="Full Business / Kitchen Address"
              className="text-[11px] text-slate-500 dark:text-slate-400 text-center w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Customer & Billing Meta Details (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
          {/* Customer Column */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider flex items-center space-x-1">
              <span>BILLED TO (CUSTOMER):</span>
            </p>
            <div className="space-y-1">
              <input
                type="text"
                value={invoiceData.customerName}
                onChange={e => setInvoiceData({ ...invoiceData, customerName: e.target.value })}
                placeholder="Customer Full Name"
                className="font-bold text-base text-slate-900 dark:text-white w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex items-center space-x-1 text-xs text-slate-500 font-mono">
                <span>📱</span>
                <input
                  type="text"
                  value={invoiceData.customerPhone}
                  onChange={e => setInvoiceData({ ...invoiceData, customerPhone: e.target.value })}
                  placeholder="Customer Phone"
                  className="bg-transparent w-full border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <span>📍</span>
                <input
                  type="text"
                  value={invoiceData.customerAddress}
                  onChange={e => setInvoiceData({ ...invoiceData, customerAddress: e.target.value })}
                  placeholder="Customer Address / Room / PG"
                  className="bg-transparent w-full border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Invoice Meta Column */}
          <div className="space-y-1.5 sm:text-right flex flex-col sm:items-end">
            <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">
              INVOICE DATES & SUMMARY
            </p>
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 w-full sm:w-auto">
              <div className="flex items-center sm:justify-end space-x-1">
                <span className="text-slate-400">Date of Issue:</span>
                <input
                  type="date"
                  value={invoiceData.invoiceDate}
                  onChange={e => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                  className="font-bold text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none font-mono text-xs cursor-pointer"
                />
              </div>

              <div className="flex items-center sm:justify-end space-x-1">
                <span className="text-slate-400">Billing Period:</span>
                <input
                  type="text"
                  value={invoiceData.billingPeriod}
                  onChange={e => setInvoiceData({ ...invoiceData, billingPeriod: e.target.value })}
                  className="font-semibold text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none font-mono text-xs w-28 sm:text-right"
                />
              </div>

              <div className="flex items-center sm:justify-end space-x-1 text-slate-500">
                <span>Total Tiffins:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {totalTiffinsDelivered} Meals
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Table (Every row is completely editable) */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="py-2.5 px-3 border border-slate-300 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 w-28">
                  Date
                </th>
                <th className="py-2.5 px-3 border border-slate-300 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">
                  Meal / Description
                </th>
                <th className="py-2.5 px-3 border border-slate-300 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 text-center w-16">
                  Qty
                </th>
                <th className="py-2.5 px-3 border border-slate-300 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 text-right w-24">
                  Rate ({settings.currencySymbol})
                </th>
                <th className="py-2.5 px-3 border border-slate-300 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 text-right w-28">
                  Amount ({settings.currencySymbol})
                </th>
                {isEditMode && (
                  <th className="no-print py-2.5 px-2 border border-slate-300 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-500 text-center w-10">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-xs">
              {invoiceData.rows.length === 0 ? (
                <tr>
                  <td colSpan={isEditMode ? 6 : 5} className="py-8 text-center text-slate-400 font-medium border border-slate-300 dark:border-slate-700">
                    No items in this invoice. Click "+ Add Custom Row" to add entries.
                  </td>
                </tr>
              ) : (
                invoiceData.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    {/* Date */}
                    <td className="py-2 px-2 border border-slate-300 dark:border-slate-700 font-mono">
                      <input
                        type="text"
                        value={row.date}
                        onChange={e => handleUpdateRow(row.id, 'date', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full bg-transparent text-xs focus:outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/30 px-1 py-0.5 rounded"
                      />
                    </td>

                    {/* Meal / Description */}
                    <td className="py-2 px-2 border border-slate-300 dark:border-slate-700">
                      <input
                        type="text"
                        value={row.description}
                        onChange={e => handleUpdateRow(row.id, 'description', e.target.value)}
                        placeholder="Meal description (e.g. Lunch, Special Thali)"
                        className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/30 px-1 py-0.5 rounded font-medium"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="py-2 px-2 border border-slate-300 dark:border-slate-700 text-center">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.quantity}
                        onChange={e => handleUpdateRow(row.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent text-center text-xs font-bold text-slate-900 dark:text-white font-mono focus:outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/30 px-1 py-0.5 rounded"
                      />
                    </td>

                    {/* Rate (per item) - ANY NUMBER ALLOWED */}
                    <td className="py-2 px-2 border border-slate-300 dark:border-slate-700 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.rate}
                        onChange={e => handleUpdateRow(row.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent text-right text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono focus:outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/30 px-1 py-0.5 rounded"
                      />
                    </td>

                    {/* Amount */}
                    <td className="py-2 px-2 border border-slate-300 dark:border-slate-700 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.total}
                        onChange={e => handleUpdateRow(row.id, 'total', parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent text-right text-xs font-bold text-slate-900 dark:text-white font-mono focus:outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/30 px-1 py-0.5 rounded"
                      />
                    </td>

                    {/* Delete button */}
                    {isEditMode && (
                      <td className="no-print py-2 px-2 border border-slate-300 dark:border-slate-700 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded transition"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Row Button (In Edit Mode) */}
        {isEditMode && (
          <div className="no-print -mt-4 mb-6">
            <button
              type="button"
              onClick={handleAddRow}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Row (Item / Special Delivery / Custom Charge)</span>
            </button>
          </div>
        )}

        {/* Summary Breakdown & Real-Time QR Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-4 border-t border-slate-200 dark:border-slate-800">
          {/* LEFT: Dynamic UPI QR Code Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
                <QrCode className="w-4 h-4" />
                <span>Instant UPI Payment QR</span>
              </span>
              <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
                Live Dynamic
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* QR Image Canvas / Preview */}
              <div className="bg-white p-2 rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm shrink-0 flex flex-col items-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Scan UPI QR"
                    className="w-32 h-32 object-contain"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center text-xs text-slate-400">
                    Generating QR...
                  </div>
                )}
                <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">
                  Scan with any UPI app
                </span>
              </div>

              {/* QR Editable Inputs */}
              <div className="flex-1 w-full space-y-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    UPI ID:
                  </label>
                  <input
                    type="text"
                    value={qrUpiId}
                    onChange={e => setQrUpiId(e.target.value)}
                    placeholder="e.g. example@upi"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Payee Name:
                  </label>
                  <input
                    type="text"
                    value={qrPayeeName}
                    onChange={e => setQrPayeeName(e.target.value)}
                    placeholder="e.g. Krish Tiffin Service"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      QR Amount ({settings.currencySymbol}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder={`Auto (${grandTotalPayable})`}
                      value={qrCustomAmount}
                      onChange={e => {
                        const val = e.target.value;
                        setQrCustomAmount(val === '' ? '' : parseFloat(val) || 0);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Txn Note:
                    </label>
                    <input
                      type="text"
                      value={qrNote}
                      onChange={e => setQrNote(e.target.value)}
                      placeholder="Note for payment"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
                    />
                  </div>
                </div>

                {/* QR Actions */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQrImage}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold flex items-center space-x-1 transition shadow-xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download QR Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(qrUpiId);
                      setQrCopied(true);
                      setTimeout(() => setQrCopied(false), 2000);
                    }}
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center space-x-1"
                  >
                    {qrCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{qrCopied ? 'Copied!' : 'Copy UPI'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Financial Totals Breakdown (With Last Month Pending) */}
          <div className="space-y-3 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Current Period Subtotal */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Current Month Subtotal ({totalTiffinsDelivered} Meals):
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                {formatCurrency(currentMonthSubtotal, settings.currencySymbol)}
              </span>
            </div>

            {/* LAST MONTH PENDING AMOUNT (Auto-Calculated + Editable) */}
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Last Month Pending Due:
                  </span>
                  {autoLastMonthPending > 0 && (
                    <span className="text-[9px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-1.5 py-0.2 rounded">
                      Auto: {formatCurrency(autoLastMonthPending, settings.currencySymbol)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-amber-700 dark:text-amber-400">
                  Unpaid previous balance before {selectedMonth}
                </p>
              </div>

              <div className="flex items-center space-x-1">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 font-mono">+</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={invoiceData.lastMonthPending}
                  onChange={e => {
                    const val = e.target.value;
                    setInvoiceData({
                      ...invoiceData,
                      lastMonthPending: val === '' ? 0 : parseFloat(val) || 0,
                    });
                  }}
                  className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded text-right font-mono font-bold text-amber-900 dark:text-amber-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* GRAND TOTAL PAYABLE */}
            <div className="pt-3 border-t-2 border-slate-900 dark:border-slate-100 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">
                  TOTAL AMOUNT DUE:
                </span>
                <p className="text-[10px] text-slate-400 font-medium">
                  (Current Month Subtotal + Last Month Pending)
                </p>
              </div>
              <span className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-500 font-mono">
                {formatCurrency(grandTotalPayable, settings.currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Notes & Authorized Signatory (Editable) */}
        <div className="mt-10 pt-6 border-t border-dashed border-slate-300 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
          {/* Notes & Instructions */}
          <div className="sm:col-span-2 space-y-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                Invoice Note / Payment Instructions:
              </label>
              <textarea
                rows={2}
                value={invoiceData.notes}
                onChange={e => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                className="w-full bg-transparent text-xs text-slate-600 dark:text-slate-400 italic focus:outline-none border-b border-transparent hover:border-slate-200 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase">
                Terms & Conditions:
              </label>
              <input
                type="text"
                value={invoiceData.terms}
                onChange={e => setInvoiceData({ ...invoiceData, terms: e.target.value })}
                className="w-full bg-transparent text-[10px] text-slate-400 focus:outline-none border-b border-transparent hover:border-slate-200 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Authorized Signatory */}
          <div className="text-center sm:text-right space-y-6">
            <div className="h-8 flex items-end justify-center sm:justify-end">
              <span className="font-serif italic text-sm text-slate-700 dark:text-slate-300">
                {invoiceData.businessName}
              </span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <input
                type="text"
                value={invoiceData.signatoryName}
                onChange={e => setInvoiceData({ ...invoiceData, signatoryName: e.target.value })}
                placeholder="Authorized Signatory"
                className="text-xs font-bold text-slate-800 dark:text-slate-200 text-center sm:text-right w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
