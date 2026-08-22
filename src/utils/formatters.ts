import { Customer, TiffinBill, Payment, BusinessSettings } from '../types';

export const formatCurrency = (amount: number, symbol: string = '₹'): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return `${symbol}0`;
  const isDecimal = amount % 1 !== 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: isDecimal ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formatted}`;
};

export const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDate = (dateStr: string, options?: { showDay?: boolean; shortMonth?: boolean }): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  if (isNaN(date.getTime())) return dateStr;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const dayName = dayNames[date.getDay()];

  if (options?.showDay) {
    return `${dayName}, ${day} ${month} ${year}`;
  }
  return `${day} ${month} ${year}`;
};

export const formatDayAndDate = (dateStr: string): { day: string; date: string; formatted: string } => {
  if (!dateStr) return { day: '', date: '', formatted: '' };
  const parts = dateStr.split('-');
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = dayNames[date.getDay()] || '';
  const d = date.getDate();
  const m = monthNames[date.getMonth()] || '';
  
  return {
    day: dayName,
    date: `${d} ${m}`,
    formatted: `${dayName}, ${d} ${m}`,
  };
};

export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
};

export const generateWhatsAppBillText = (
  customer: Customer,
  bills: TiffinBill[],
  payments: Payment[],
  settings: BusinessSettings,
  monthLabel?: string,
  extraDetails?: {
    businessName?: string;
    businessPhone?: string;
    lastMonthPending?: number;
    currentSubtotal?: number;
    totalPaid?: number;
    grandTotal?: number;
    upiId?: string;
    items?: Array<{ date: string; description: string; quantity: number; rate: number; total: number }>;
  }
): string => {
  const customerBills = bills.filter(b => b.customerId === customer.id);
  const customerPayments = payments.filter(p => p.customerId === customer.id);

  const totalTiffins = extraDetails?.items
    ? extraDetails.items.reduce((sum, item) => sum + item.quantity, 0)
    : customerBills.reduce((sum, b) => sum + b.quantity, 0);

  const currentSubtotal = extraDetails?.currentSubtotal !== undefined
    ? extraDetails.currentSubtotal
    : customerBills.reduce((sum, b) => sum + b.total, 0);

  const lastMonthPending = extraDetails?.lastMonthPending || 0;
  const totalPaid = extraDetails?.totalPaid !== undefined
    ? extraDetails.totalPaid
    : (extraDetails ? 0 : customerPayments.reduce((sum, p) => sum + p.amount, 0));

  const grandTotal = extraDetails?.grandTotal !== undefined
    ? extraDetails.grandTotal
    : Math.max(0, currentSubtotal + lastMonthPending - totalPaid);

  const bizName = extraDetails?.businessName || settings.businessName;
  const bizPhone = extraDetails?.businessPhone || settings.primaryPhone;
  const upiId = extraDetails?.upiId || settings.upiId;

  let message = `🍱 *${bizName.toUpperCase()}* 🍱\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👤 *Customer:* ${customer.name}\n`;
  message += `📱 *Phone:* ${customer.number}\n`;
  if (monthLabel) {
    message += `📅 *Billing Month:* ${monthLabel}\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `📋 *TIFFIN BILL STATEMENT:*\n`;
  message += `• Total Tiffins: *${totalTiffins} meals*\n`;
  message += `• Current Month Amount: *${settings.currencySymbol}${currentSubtotal}*\n`;
  if (lastMonthPending > 0) {
    message += `• Last Month Pending Due: *${settings.currencySymbol}${lastMonthPending}* ⏳\n`;
  }
  if (totalPaid > 0) {
    message += `• Payments Received: *${settings.currencySymbol}${totalPaid}* ✅\n`;
  }
  message += `• *TOTAL AMOUNT PAYABLE:* *${settings.currencySymbol}${grandTotal}* ⚠️\n\n`;

  // Itemized entries
  if (extraDetails?.items && extraDetails.items.length > 0) {
    message += `📝 *Tiffin Records / Line Items:*\n`;
    const recent = extraDetails.items.slice(-15);
    recent.forEach((item) => {
      message += `• ${item.date} (${item.description}): ${item.quantity} × ${settings.currencySymbol}${item.rate} = *${settings.currencySymbol}${item.total}*\n`;
    });
    if (extraDetails.items.length > 15) {
      message += `...and ${extraDetails.items.length - 15} earlier entries.\n`;
    }
    message += `\n`;
  } else if (customerBills.length > 0) {
    message += `📝 *Recent Tiffin Records:*\n`;
    const sorted = [...customerBills].sort((a, b) => a.date.localeCompare(b.date));
    const recent = sorted.slice(-10);
    recent.forEach((b) => {
      const { formatted } = formatDayAndDate(b.date);
      message += `• ${formatted} (${b.mealTime}): ${b.quantity} × ${settings.currencySymbol}${b.price} = *${settings.currencySymbol}${b.total}* ${b.paidStatus ? '✅ Paid' : '⏳ Due'}\n`;
    });
    if (customerBills.length > 10) {
      message += `...and ${customerBills.length - 10} earlier entries.\n`;
    }
    message += `\n`;
  }

  if (upiId) {
    message += `💳 *Scan / Pay via UPI:* \`${upiId}\`\n`;
  }
  message += `📞 *Contact / Support:* ${bizPhone}${settings.secondaryPhone ? ` / ${settings.secondaryPhone}` : ''}\n`;
  message += `\n🙏 _${settings.invoiceNote || 'Thank you for your business!'}_`;

  return message;
};

export const openWhatsApp = (phone: string, text: string) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  // If Indian 10-digit number without country code, prepend 91
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${fullPhone}?text=${encodedText}`;
  window.open(url, '_blank');
};

export const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row
        .map(field => {
          const str = String(field ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
