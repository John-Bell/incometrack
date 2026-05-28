import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardPage } from '@/pages/DashboardPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { ScenariosPage } from '@/pages/ScenariosPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { RemoteSyncingPage } from '@/pages/RemoteSyncingPage';
import { SimplifiedAppSetupPage } from '@/pages/SimplifiedAppSetupPage';
import { IncomeEditPage } from '@/pages/IncomeEditPage';
import { IncomePage } from '@/pages/IncomePage'; // Keep your local additions
import { AddAccountPage } from '@/pages/AddAccountPage';
import { EditAccountPage } from '@/pages/EditAccountPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { EditBudgetPage } from '@/pages/EditBudgetPage';
import { AddBudgetPage } from '@/pages/AddBudgetPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { AddPaymentPage } from '@/pages/AddPaymentPage';
import { EditPaymentPage } from '@/pages/EditPaymentPage';
import { PaymentMappingsPage } from '@/pages/PaymentMappingsPage';
import { PropertiesPage } from '@/pages/PropertiesPage';
import { AddPropertyPage } from '@/pages/AddPropertyPage';
import { EditPropertyPage } from '@/pages/EditPropertyPage';
import { PropertyExpensesPage } from '@/pages/PropertyExpensesPage';
import { AddPropertyExpensePage } from '@/pages/AddPropertyExpensePage';
import { EditPropertyExpensePage } from '@/pages/EditPropertyExpensePage';
import { PropertyIncomesPage } from '@/pages/PropertyIncomesPage';
import { AddPropertyIncomePage } from '@/pages/AddPropertyIncomePage';
import { EditPropertyIncomePage } from '@/pages/EditPropertyIncomePage';
import { PropertyOwnershipsPage } from '@/pages/PropertyOwnershipsPage';
import { AddPropertyOwnershipPage } from '@/pages/AddPropertyOwnershipPage';
import { EditPropertyOwnershipPage } from '@/pages/EditPropertyOwnershipPage';
import { SimulatorPage } from '@/pages/SimulatorPage';
import { CashflowProjectionPage } from '@/pages/CashflowProjectionPage';
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

  const isSetupRoute = location.pathname === '/setup';

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
      <Route path="/remote-syncing" element={<RemoteSyncingPage />} />
      <Route path="/income" element={<IncomePage />} />
      <Route path="/income-edit" element={<IncomeEditPage />} />
      <Route path="/budgets" element={<BudgetsPage />} />
      <Route path="/budgets/add" element={<AddBudgetPage />} />
      <Route path="/budgets/edit/:id" element={<EditBudgetPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/transactions/add" element={<AddPaymentPage />} />
      <Route path="/transactions/edit/:id" element={<EditPaymentPage />} />
      <Route path="/payment-mappings" element={<PaymentMappingsPage />} />
      <Route path="/properties" element={<PropertiesPage />} />
      <Route path="/properties/add" element={<AddPropertyPage />} />
      <Route path="/properties/edit/:id" element={<EditPropertyPage />} />
      <Route path="/property-expenses" element={<PropertyExpensesPage />} />
      <Route path="/property-expenses/add" element={<AddPropertyExpensePage />} />
      <Route path="/property-expenses/edit/:id" element={<EditPropertyExpensePage />} />
      <Route path="/property-incomes" element={<PropertyIncomesPage />} />
      <Route path="/property-incomes/add" element={<AddPropertyIncomePage />} />
      <Route path="/property-incomes/edit/:id" element={<EditPropertyIncomePage />} />
      <Route path="/property-ownerships" element={<PropertyOwnershipsPage />} />
      <Route path="/property-ownerships/add" element={<AddPropertyOwnershipPage />} />
      <Route path="/property-ownerships/edit/:id" element={<EditPropertyOwnershipPage />} />
      <Route path="/simulator" element={<SimulatorPage />} />
      <Route path="/cashflow-projection" element={<CashflowProjectionPage />} />
      {/* Setup Routes */}
      <Route path="/setup" element={<SimplifiedAppSetupPage />} />

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