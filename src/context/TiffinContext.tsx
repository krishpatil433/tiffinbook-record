import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Customer, TiffinBill, Payment, BusinessSettings, CustomerSummary, MealTime } from '../types';
import { sampleCustomers, sampleTiffinBills, samplePayments, defaultSettings } from '../utils/sampleData';
import { generateId, getTodayString } from '../utils/formatters';

interface TiffinContextType {
  customers: Customer[];
  bills: TiffinBill[];
  payments: Payment[];
  settings: BusinessSettings;
  activeTab: 'dashboard' | 'daily_register' | 'monthly_summary' | 'customer_history' | 'invoice' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'daily_register' | 'monthly_summary' | 'customer_history' | 'invoice' | 'settings') => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: 'all' | 'due' | 'settled';
  setFilterStatus: (filter: 'all' | 'due' | 'settled') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Actions
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addTiffin: (data: Omit<TiffinBill, 'id' | 'createdAt' | 'total'>) => TiffinBill;
  addBatchTiffins: (entries: Array<{ customerId: string; date: string; mealTime: MealTime; price: number; quantity: number; paidStatus?: boolean; note?: string }>) => number;
  updateTiffin: (id: string, data: Partial<TiffinBill>) => void;
  deleteTiffin: (id: string) => void;
  toggleTiffinPaidStatus: (id: string) => void;

  recordPayment: (data: Omit<Payment, 'id' | 'createdAt'>) => Payment;
  deletePayment: (id: string) => void;
  markCustomerAllPaid: (customerId: string) => void;

  updateSettings: (data: Partial<BusinessSettings>) => void;
  resetToSampleData: () => void;
  clearAllData: () => void;
  exportBackupJSON: () => string;
  importBackupJSON: (jsonStr: string) => boolean;

  // Calculations & Selectors
  getCustomerSummary: (customerId: string) => CustomerSummary | null;
  allCustomerSummaries: CustomerSummary[];
  totalDueOverall: number;
  totalCollectedOverall: number;
  totalTiffinsThisMonth: number;
  totalBilledThisMonth: number;
}

const TiffinContext = createContext<TiffinContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CUSTOMERS: 'tiffinbook_customers_v1',
  BILLS: 'tiffinbook_bills_v1',
  PAYMENTS: 'tiffinbook_payments_v1',
  SETTINGS: 'tiffinbook_settings_v1',
  DARK_MODE: 'tiffinbook_darkmode_v1',
};

export const TiffinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage or seed data
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return saved ? JSON.parse(saved) : sampleCustomers;
    } catch {
      return sampleCustomers;
    }
  });

  const [bills, setBills] = useState<TiffinBill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
      return saved ? JSON.parse(saved) : sampleTiffinBills;
    } catch {
      return sampleTiffinBills;
    }
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return saved ? JSON.parse(saved) : samplePayments;
    } catch {
      return samplePayments;
    }
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'daily_register' | 'monthly_summary' | 'customer_history' | 'invoice' | 'settings'>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'due' | 'settled'>('all');

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Customer handlers
  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCustomer: Customer = {
      ...data,
      id: generateId('cust'),
      createdAt: getTodayString(),
    };
    setCustomers(prev => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(c => (c.id === id ? { ...c, ...data } : c))
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setBills(prev => prev.filter(b => b.customerId !== id));
    setPayments(prev => prev.filter(p => p.customerId !== id));
    if (selectedCustomerId === id) {
      setSelectedCustomerId(null);
      if (activeTab === 'customer_history' || activeTab === 'invoice') {
        setActiveTab('dashboard');
      }
    }
  };

  // Tiffin Bill handlers
  const addTiffin = (data: Omit<TiffinBill, 'id' | 'createdAt' | 'total'>): TiffinBill => {
    const total = (data.quantity || 1) * (data.price || 0);
    const newBill: TiffinBill = {
      ...data,
      total,
      id: generateId('bill'),
      createdAt: new Date().toISOString(),
    };
    setBills(prev => [newBill, ...prev]);
    return newBill;
  };

  const addBatchTiffins = (
    entries: Array<{ customerId: string; date: string; mealTime: MealTime; price: number; quantity: number; paidStatus?: boolean; note?: string }>
  ): number => {
    const newBills: TiffinBill[] = entries.map(entry => ({
      id: generateId('bill'),
      customerId: entry.customerId,
      date: entry.date,
      mealTime: entry.mealTime,
      price: entry.price,
      quantity: entry.quantity,
      total: entry.quantity * entry.price,
      paidStatus: entry.paidStatus ?? false,
      note: entry.note,
      createdAt: new Date().toISOString(),
    }));

    setBills(prev => [...newBills, ...prev]);
    return newBills.length;
  };

  const updateTiffin = (id: string, data: Partial<TiffinBill>) => {
    setBills(prev =>
      prev.map(b => {
        if (b.id !== id) return b;
        const updated = { ...b, ...data };
        updated.total = (updated.quantity || 1) * (updated.price || 0);
        return updated;
      })
    );
  };

  const deleteTiffin = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const toggleTiffinPaidStatus = (id: string) => {
    setBills(prev =>
      prev.map(b => (b.id === id ? { ...b, paidStatus: !b.paidStatus } : b))
    );
  };

  // Payment handlers
  const recordPayment = (data: Omit<Payment, 'id' | 'createdAt'>): Payment => {
    const newPayment: Payment = {
      ...data,
      id: generateId('pay'),
      createdAt: new Date().toISOString(),
    };
    setPayments(prev => [newPayment, ...prev]);

    // Automatically mark unpaid tiffins as paid if matching or oldest first
    return newPayment;
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const markCustomerAllPaid = (customerId: string) => {
    const customerBills = bills.filter(b => b.customerId === customerId);
    const unpaidBills = customerBills.filter(b => !b.paidStatus);
    const unpaidTotal = unpaidBills.reduce((sum, b) => sum + b.total, 0);

    // Mark all existing bills as paid
    setBills(prev =>
      prev.map(b => (b.customerId === customerId ? { ...b, paidStatus: true } : b))
    );

    // Record a settlement payment if there was unpaid balance
    if (unpaidTotal > 0) {
      const settlePay: Payment = {
        id: generateId('pay'),
        customerId,
        amount: unpaidTotal,
        date: getTodayString(),
        paymentMethod: 'Cash',
        note: 'Full settlement marked all paid',
        createdAt: new Date().toISOString(),
      };
      setPayments(prev => [settlePay, ...prev]);
    }
  };

  const updateSettings = (data: Partial<BusinessSettings>) => {
    setSettings(prev => ({ ...prev, ...data }));
  };

  const resetToSampleData = () => {
    setCustomers(sampleCustomers);
    setBills(sampleTiffinBills);
    setPayments(samplePayments);
    setSettings(defaultSettings);
  };

  const clearAllData = () => {
    setCustomers([]);
    setBills([]);
    setPayments([]);
  };

  const exportBackupJSON = (): string => {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      business: settings,
      customers,
      bills,
      payments,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importBackupJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.customers && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
      if (data.bills && Array.isArray(data.bills)) {
        setBills(data.bills);
      }
      if (data.payments && Array.isArray(data.payments)) {
        setPayments(data.payments);
      }
      if (data.business && typeof data.business === 'object') {
        setSettings(prev => ({ ...prev, ...data.business }));
      }
      return true;
    } catch (err) {
      console.error('Failed to import backup', err);
      return false;
    }
  };

  // Helper selectors
  const getCustomerSummary = (customerId: string): CustomerSummary | null => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return null;

    const customerBills = bills.filter(b => b.customerId === customerId);
    const customerPayments = payments.filter(p => p.customerId === customerId);

    const totalTiffins = customerBills.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
    const totalBilled = customerBills.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
    const totalPaid = customerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    // An entry is either paid individually or covered by payment balance
    // Net Due amount = max(0, totalBilled - totalPaid)
    // Also account for individual unpaid bills total
    const unpaidBillsTotal = customerBills.filter(b => !b.paidStatus).reduce((sum, b) => sum + b.total, 0);
    const dueAmount = Math.max(0, Math.min(unpaidBillsTotal, totalBilled - totalPaid));

    const sortedBills = [...customerBills].sort((a, b) => b.date.localeCompare(a.date));
    const lastTiffinDate = sortedBills[0]?.date;

    return {
      customer,
      totalTiffins,
      totalBilled,
      totalPaid,
      dueAmount,
      lastTiffinDate,
    };
  };

  const allCustomerSummaries = useMemo(() => {
    return customers.map(c => {
      const summary = getCustomerSummary(c.id);
      return summary || {
        customer: c,
        totalTiffins: 0,
        totalBilled: 0,
        totalPaid: 0,
        dueAmount: 0,
      };
    });
  }, [customers, bills, payments]);

  const totalDueOverall = useMemo(() => {
    return allCustomerSummaries.reduce((sum, s) => sum + s.dueAmount, 0);
  }, [allCustomerSummaries]);

  const totalCollectedOverall = useMemo(() => {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  const currentMonthPrefix = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const totalTiffinsThisMonth = useMemo(() => {
    return bills
      .filter(b => b.date.startsWith(currentMonthPrefix))
      .reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  }, [bills, currentMonthPrefix]);

  const totalBilledThisMonth = useMemo(() => {
    return bills
      .filter(b => b.date.startsWith(currentMonthPrefix))
      .reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  }, [bills, currentMonthPrefix]);

  return (
    <TiffinContext.Provider
      value={{
        customers,
        bills,
        payments,
        settings,
        activeTab,
        setActiveTab,
        selectedCustomerId,
        setSelectedCustomerId,
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        darkMode,
        setDarkMode,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addTiffin,
        addBatchTiffins,
        updateTiffin,
        deleteTiffin,
        toggleTiffinPaidStatus,
        recordPayment,
        deletePayment,
        markCustomerAllPaid,
        updateSettings,
        resetToSampleData,
        clearAllData,
        exportBackupJSON,
        importBackupJSON,
        getCustomerSummary,
        allCustomerSummaries,
        totalDueOverall,
        totalCollectedOverall,
        totalTiffinsThisMonth,
        totalBilledThisMonth,
      }}
    >
      {children}
    </TiffinContext.Provider>
  );
};

export const useTiffin = () => {
  const context = useContext(TiffinContext);
  if (!context) {
    throw new Error('useTiffin must be used within a TiffinProvider');
  }
  return context;
};
