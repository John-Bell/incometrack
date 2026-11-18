import { Suspense, lazy, useEffect, type ComponentType } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardPage } from '@/pages/DashboardPage';
import { AppErrorBoundary } from '@/components/layout/AppErrorBoundary';
import { useStore } from '@/store/useStore';
import { remoteSyncService } from '@/services/remoteSyncService';
import { dbHooks } from '@/lib/db';
import { registerPreloadErrorHandler, retryDynamicImport } from '@/utils/lazyRetry';

function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>,
) {
  return lazy(() => retryDynamicImport(importer));
}

const AccountsPage = lazyWithRetry(() => import('@/pages/AccountsPage').then((m) => ({ default: m.AccountsPage })));
const ScenariosPage = lazyWithRetry(() => import('@/pages/ScenariosPage').then((m) => ({ default: m.ScenariosPage })));
const SettingsPage = lazyWithRetry(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const RemoteSyncingPage = lazyWithRetry(() => import('@/pages/RemoteSyncingPage').then((m) => ({ default: m.RemoteSyncingPage })));
const SimplifiedAppSetupPage = lazyWithRetry(() => import('@/pages/SimplifiedAppSetupPage').then((m) => ({ default: m.SimplifiedAppSetupPage })));
const IncomeEditPage = lazyWithRetry(() => import('@/pages/IncomeEditPage').then((m) => ({ default: m.IncomeEditPage })));
const IncomePage = lazyWithRetry(() => import('@/pages/IncomePage').then((m) => ({ default: m.IncomePage })));
const AddAccountPage = lazyWithRetry(() => import('@/pages/AddAccountPage').then((m) => ({ default: m.AddAccountPage })));
const EditAccountPage = lazyWithRetry(() => import('@/pages/EditAccountPage').then((m) => ({ default: m.EditAccountPage })));
const BudgetsPage = lazyWithRetry(() => import('@/pages/BudgetsPage').then((m) => ({ default: m.BudgetsPage })));
const EditBudgetPage = lazyWithRetry(() => import('@/pages/EditBudgetPage').then((m) => ({ default: m.EditBudgetPage })));
const AddBudgetPage = lazyWithRetry(() => import('@/pages/AddBudgetPage').then((m) => ({ default: m.AddBudgetPage })));
const TransactionsPage = lazyWithRetry(() => import('@/pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage })));
const AddPaymentPage = lazyWithRetry(() => import('@/pages/AddPaymentPage').then((m) => ({ default: m.AddPaymentPage })));
const EditPaymentPage = lazyWithRetry(() => import('@/pages/EditPaymentPage').then((m) => ({ default: m.EditPaymentPage })));
const PaymentMappingsPage = lazyWithRetry(() => import('@/pages/PaymentMappingsPage').then((m) => ({ default: m.PaymentMappingsPage })));
const PropertiesPage = lazyWithRetry(() => import('@/pages/PropertiesPage').then((m) => ({ default: m.PropertiesPage })));
const AddPropertyPage = lazyWithRetry(() => import('@/pages/AddPropertyPage').then((m) => ({ default: m.AddPropertyPage })));
const EditPropertyPage = lazyWithRetry(() => import('@/pages/EditPropertyPage').then((m) => ({ default: m.EditPropertyPage })));
const PropertyExpensesPage = lazyWithRetry(() => import('@/pages/PropertyExpensesPage').then((m) => ({ default: m.PropertyExpensesPage })));
const AddPropertyExpensePage = lazyWithRetry(() => import('@/pages/AddPropertyExpensePage').then((m) => ({ default: m.AddPropertyExpensePage })));
const EditPropertyExpensePage = lazyWithRetry(() => import('@/pages/EditPropertyExpensePage').then((m) => ({ default: m.EditPropertyExpensePage })));
const PropertyIncomesPage = lazyWithRetry(() => import('@/pages/PropertyIncomesPage').then((m) => ({ default: m.PropertyIncomesPage })));
const AddPropertyIncomePage = lazyWithRetry(() => import('@/pages/AddPropertyIncomePage').then((m) => ({ default: m.AddPropertyIncomePage })));
const EditPropertyIncomePage = lazyWithRetry(() => import('@/pages/EditPropertyIncomePage').then((m) => ({ default: m.EditPropertyIncomePage })));
const PropertyOwnershipsPage = lazyWithRetry(() => import('@/pages/PropertyOwnershipsPage').then((m) => ({ default: m.PropertyOwnershipsPage })));
const AddPropertyOwnershipPage = lazyWithRetry(() => import('@/pages/AddPropertyOwnershipPage').then((m) => ({ default: m.AddPropertyOwnershipPage })));
const EditPropertyOwnershipPage = lazyWithRetry(() => import('@/pages/EditPropertyOwnershipPage').then((m) => ({ default: m.EditPropertyOwnershipPage })));
const SimulatorPage = lazyWithRetry(() => import('@/pages/SimulatorPage').then((m) => ({ default: m.SimulatorPage })));
const CashflowProjectionPage = lazyWithRetry(() => import('@/pages/CashflowProjectionPage').then((m) => ({ default: m.CashflowProjectionPage })));
const AssetBurndownPage = lazyWithRetry(() => import('@/pages/AssetBurndownPage').then((m) => ({ default: m.AssetBurndownPage })));
const AssetCompositionPage = lazyWithRetry(() => import('@/pages/AssetCompositionPage').then((m) => ({ default: m.AssetCompositionPage })));
const BudgetReviewPage = lazyWithRetry(() => import('@/pages/BudgetReviewPage').then((m) => ({ default: m.BudgetReviewPage })));
const SpendingPage = lazyWithRetry(() => import('@/pages/SpendingPage').then((m) => ({ default: m.SpendingPage })));
const MilestonesPage = lazyWithRetry(() => import('@/pages/MilestonesPage').then((m) => ({ default: m.MilestonesPage })));
const AddMilestonePage = lazyWithRetry(() => import('@/pages/AddMilestonePage').then((m) => ({ default: m.AddMilestonePage })));
const EditMilestonePage = lazyWithRetry(() => import('@/pages/EditMilestonePage').then((m) => ({ default: m.EditMilestonePage })));

function AppRoutes() {
  const isHydrated = useStore((state) => state.isHydrated);
  const profile = useStore((state) => state.profile);
  const initStore = useStore((state) => state.initStore);
  const location = useLocation();

  useEffect(() => {
    let isReady = false;
    const unregisterPreloadError = registerPreloadErrorHandler();

    initStore().then(() => {
      isReady = true;
      // Attempt to reconnect to cloud sync after store is hydrated
      remoteSyncService.reconnect();

      // Wire up auto-sync on local DB changes
      dbHooks.onLocalChange = () => remoteSyncService.autoSync();
    });

    const handleVisibilityChange = () => {
      if (isReady && document.visibilityState === 'visible') {
        remoteSyncService.reconnect();
      }
    };

    const handleWakeSync = () => {
      if (isReady) {
        remoteSyncService.reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWakeSync);
    window.addEventListener('online', handleWakeSync);

    return () => {
      unregisterPreloadError();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWakeSync);
      window.removeEventListener('online', handleWakeSync);
    };
  }, [initStore]);

  if (!isHydrated) {
    return <div className="flex h-dvh w-screen items-center justify-center text-gray-500">Loading your data...</div>;
  }

  const isSetupRoute = location.pathname === '/setup';

  // Force users without a profile to the setup route
  if (!profile && !isSetupRoute) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <AppErrorBoundary resetKey={location.pathname}>
      <Suspense
        fallback={
          <div className="flex h-dvh w-screen items-center justify-center text-gray-500">
            Loading...
          </div>
        }
      >
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
          <Route path="/asset-burndown" element={<AssetBurndownPage />} />
          <Route path="/asset-composition" element={<AssetCompositionPage />} />
          <Route path="/budget-review" element={<BudgetReviewPage />} />
          <Route path="/spending" element={<SpendingPage />} />
          <Route path="/milestones" element={<MilestonesPage />} />
          <Route path="/milestones/add" element={<AddMilestonePage />} />
          <Route path="/milestones/edit/:id" element={<EditMilestonePage />} />
          {/* Setup Routes */}
          <Route path="/setup" element={<SimplifiedAppSetupPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
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