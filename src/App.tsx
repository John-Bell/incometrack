import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardPage } from '@/pages/DashboardPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { ScenariosPage } from '@/pages/ScenariosPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { DataImportsPage } from '@/pages/DataImportsPage';
import { HistoricAccountsPage } from '@/pages/HistoricAccountsPage';
import { RemoteSyncingPage } from '@/pages/RemoteSyncingPage';
import { SimplifiedAppSetupPage } from '@/pages/SimplifiedAppSetupPage';
import { StreamlinedIncomeConfigurationPage } from '@/pages/StreamlinedIncomeConfigurationPage';
import { IncomeConfigPage } from '@/pages/IncomeConfigPage';
import { IncomePage } from '@/pages/IncomePage'; // Keep your local additions
import { AddAccountPage } from '@/pages/AddAccountPage';
import { EditAccountPage } from '@/pages/EditAccountPage';
import { BudgetCategoriesPage } from '@/pages/BudgetCategoriesPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { EditBudgetPage } from '@/pages/EditBudgetPage';
import { AddBudgetPage } from '@/pages/AddBudgetPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { AddPaymentPage } from '@/pages/AddPaymentPage';
import { EditPaymentPage } from '@/pages/EditPaymentPage';
import { PaymentMappingsPage } from '@/pages/PaymentMappingsPage';
import { ImportProcessor } from '@/pages/ImportProcessor';
import { useStore } from '@/store/useStore';
import { remoteSyncService } from '@/services/remoteSyncService';
import { dbHooks } from '@/lib/db';

function AppRoutes() {
  const { isHydrated, profile, initStore } = useStore();
  const location = useLocation();

  useEffect(() => {
    initStore().then(() => {
      // Attempt to reconnect to cloud sync after store is hydrated
      remoteSyncService.reconnect();

      // Wire up auto-sync on local DB changes
      dbHooks.onLocalChange = () => remoteSyncService.autoSync();
    });
  }, [initStore]);

  if (!isHydrated) {
    return <div className="flex h-screen w-screen items-center justify-center text-gray-500">Loading your data...</div>;
  }

  const isSetupRoute = location.pathname === '/setup' || location.pathname === '/income-setup';

  // Force users without a profile to the setup route
  if (!profile && !isSetupRoute) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/accounts" element={<AccountsPage />} />
      <Route path="/accounts/add" element={<AddAccountPage />} />
      <Route path="/accounts/edit/:id" element={<EditAccountPage />} />
      <Route path="/scenarios" element={<ScenariosPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/data-imports" element={<DataImportsPage />} />
      <Route path="/historic-accounts" element={<HistoricAccountsPage />} />
      <Route path="/remote-syncing" element={<RemoteSyncingPage />} />
      <Route path="/settings/import/:table" element={<ImportProcessor />} />
      <Route path="/income" element={<IncomePage />} />
      <Route path="/income-config" element={<IncomeConfigPage />} />
      <Route path="/budget-categories" element={<BudgetCategoriesPage />} />
      <Route path="/budgets" element={<BudgetsPage />} />
      <Route path="/budgets/add" element={<AddBudgetPage />} />
      <Route path="/budgets/edit/:id" element={<EditBudgetPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/transactions/add" element={<AddPaymentPage />} />
      <Route path="/transactions/edit/:id" element={<EditPaymentPage />} />
      <Route path="/payment-mappings" element={<PaymentMappingsPage />} />
      {/* Setup Routes */}
      <Route path="/setup" element={<SimplifiedAppSetupPage />} />
      <Route path="/income-setup" element={<StreamlinedIncomeConfigurationPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;