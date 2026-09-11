import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ExpenseModal from '../Expenses/ExpenseModal';
import IncomeModal from '../Income/IncomeModal';

const Layout = ({ children, onRefreshData }) => {
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);

  const handleSuccess = () => {
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenExpenseModal={() => setIsExpenseOpen(true)}
          onOpenIncomeModal={() => setIsIncomeOpen(true)}
        />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {isExpenseOpen && (
        <ExpenseModal
          isOpen={isExpenseOpen}
          onClose={() => setIsExpenseOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {isIncomeOpen && (
        <IncomeModal
          isOpen={isIncomeOpen}
          onClose={() => setIsIncomeOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default Layout;
