import React, { useState, useEffect } from 'react';
import { TiffinProvider, useTiffin } from './context/TiffinContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CustomerHistory } from './components/CustomerHistory';
import { DailyRegister } from './components/DailyRegister';
import { InvoiceView } from './components/InvoiceView';
import { MonthlySummary } from './components/MonthlySummary';
import { AddCustomerModal } from './components/AddCustomerModal';
import { AddTiffinModal } from './components/AddTiffinModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { SettingsModal } from './components/SettingsModal';
import { BackupModal } from './components/BackupModal';
import { UpiPaymentModal } from './components/UpiPaymentModal';
import { Customer, TiffinBill } from './types';

const MainLayout: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    selectedCustomerId, 
    setSelectedCustomerId,
    customers 
  } = useTiffin();

  // Modal States
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [isAddTiffinOpen, setIsAddTiffinOpen] = useState(false);
  const [targetTiffinCustomer, setTargetTiffinCustomer] = useState<Customer | null>(null);
  const [billToEdit, setBillToEdit] = useState<TiffinBill | null>(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Check for universal web payment redirect (?pay=1 or ?pa=...) from PDF or shared link
  const [payUrlParams, setPayUrlParams] = useState<{
    isOpen: boolean;
    upiId: string;
    payeeName: string;
    amount: number;
    note: string;
  } | null>(() => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pay') === '1' || urlParams.get('pa')) {
      const upiId = urlParams.get('pa') || '7798719246@upi';
      const payeeName = urlParams.get('pn') || 'Krish Tiffin Service';
      const amount = parseFloat(urlParams.get('am') || '0') || 0;
      const note = urlParams.get('tn') || 'Tiffin bill payment';
      return {
        isOpen: true,
        upiId,
        payeeName,
        amount,
        note,
      };
    }
    return null;
  });

  useEffect(() => {
    // If opened via payment link from PDF on mobile, automatically trigger UPI app launch
    if (payUrlParams?.isOpen && payUrlParams.upiId) {
      const amtStr = payUrlParams.amount > 0 ? `&am=${payUrlParams.amount.toFixed(2)}` : '';
      const uri = `upi://pay?pa=${encodeURIComponent(payUrlParams.upiId)}&pn=${encodeURIComponent(payUrlParams.payeeName)}${amtStr}&cu=INR&tn=${encodeURIComponent(payUrlParams.note)}`;
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        setTimeout(() => {
          window.location.href = uri;
        }, 300);
      }
    }
  }, [payUrlParams]);

  // Handlers
  const handleOpenAddCustomer = () => {
    setCustomerToEdit(null);
    setIsAddCustomerOpen(true);
  };

  const handleOpenEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsAddCustomerOpen(true);
  };

  const handleOpenAddTiffin = (customer?: Customer | null) => {
    setBillToEdit(null);
    setTargetTiffinCustomer(customer || null);
    setIsAddTiffinOpen(true);
  };

  const handleOpenEditTiffin = (bill: TiffinBill) => {
    setBillToEdit(bill);
    const cust = customers.find(c => c.id === bill.customerId);
    setTargetTiffinCustomer(cust || null);
    setIsAddTiffinOpen(true);
  };

  const handleOpenPayment = (customer?: Customer | null) => {
    setPaymentCustomer(customer || null);
    setIsPaymentOpen(true);
  };

  const handleOpenInvoice = (customer?: Customer | null) => {
    if (customer) {
      setSelectedCustomerId(customer.id);
    }
    setActiveTab('invoice');
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setActiveTab('customer_history');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <Navbar
        onOpenAddCustomer={handleOpenAddCustomer}
        onOpenQuickAddTiffin={() => handleOpenAddTiffin(null)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenAddCustomer={handleOpenAddCustomer}
            onOpenAddTiffin={handleOpenAddTiffin}
            onOpenPaymentModal={handleOpenPayment}
            onSelectCustomer={handleSelectCustomer}
            onOpenBatchRegister={() => setActiveTab('daily_register')}
            onOpenBackup={() => setIsBackupOpen(true)}
          />
        )}

        {activeTab === 'customer_history' && selectedCustomerId && (
          <CustomerHistory
            customerId={selectedCustomerId}
            onBack={() => setActiveTab('dashboard')}
            onOpenAddTiffin={handleOpenAddTiffin}
            onOpenEditTiffin={handleOpenEditTiffin}
            onOpenPaymentModal={handleOpenPayment}
            onOpenInvoice={handleOpenInvoice}
            onOpenEditCustomer={handleOpenEditCustomer}
          />
        )}

        {activeTab === 'daily_register' && <DailyRegister />}

        {activeTab === 'monthly_summary' && <MonthlySummary />}

        {activeTab === 'invoice' && (
          <InvoiceView initialCustomerId={selectedCustomerId} />
        )}
      </main>

      {/* Modals */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => {
          setIsAddCustomerOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
        onCustomerDeleted={() => {
          if (activeTab === 'customer_history') {
            setActiveTab('dashboard');
          }
        }}
      />

      <AddTiffinModal
        isOpen={isAddTiffinOpen}
        onClose={() => {
          setIsAddTiffinOpen(false);
          setBillToEdit(null);
          setTargetTiffinCustomer(null);
        }}
        customerId={targetTiffinCustomer?.id}
        billToEdit={billToEdit}
        onOpenPaymentModal={handleOpenPayment}
        onOpenInvoice={handleOpenInvoice}
      />

      <RecordPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setPaymentCustomer(null);
        }}
        customer={paymentCustomer}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />

      {payUrlParams?.isOpen && (
        <UpiPaymentModal
          isOpen={payUrlParams.isOpen}
          onClose={() => {
            setPayUrlParams(null);
            // Clean URL query params without reloading
            if (window.history.pushState) {
              const cleanUrl = window.location.pathname;
              window.history.pushState({}, '', cleanUrl);
            }
          }}
          upiId={payUrlParams.upiId}
          payeeName={payUrlParams.payeeName}
          amount={payUrlParams.amount}
          note={payUrlParams.note}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <TiffinProvider>
      <MainLayout />
    </TiffinProvider>
  );
}
