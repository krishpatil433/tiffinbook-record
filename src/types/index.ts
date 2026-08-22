export type MealTime = 'Breakfast' | 'Lunch' | 'Dinner' | 'Evening Snacks';

export interface Customer {
  id: string;
  name: string;
  number: string;
  address?: string;
  defaultPrice: number;
  defaultMeals: MealTime[];
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
}

export interface TiffinBill {
  id: string;
  customerId: string;
  date: string; // YYYY-MM-DD
  mealTime: MealTime;
  price: number;
  quantity: number;
  total: number;
  paidStatus: boolean;
  note?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: 'Cash' | 'UPI/GPay' | 'PhonePe' | 'Paytm' | 'Bank Transfer' | 'Other';
  referenceNumber?: string;
  note?: string;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  primaryPhone: string;
  secondaryPhone: string;
  address: string;
  upiId: string;
  defaultPrice: number;
  currencySymbol: string;
  invoiceNote: string;
  ownerName: string;
}

export interface CustomerSummary {
  customer: Customer;
  totalTiffins: number;
  totalBilled: number;
  totalPaid: number;
  dueAmount: number;
  lastTiffinDate?: string;
}
