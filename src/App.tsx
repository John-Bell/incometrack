import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardPage } from '@/pages/DashboardPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { ScenariosPage } from '@/pages/ScenariosPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SimplifiedAppSetupPage } from '@/pages/SimplifiedAppSetupPage';
import { StreamlinedIncomeConfigurationPage } from '@/pages/StreamlinedIncomeConfigurationPage';
import { IncomeConfigPage } from '@/pages/IncomeConfigPage';
import { AddAccountPage } from '@/pages/AddAccountPage';
import { EditAccountPage } from '@/pages/EditAccountPage';
import { useStore } from '@/store/useStore';

function AppRoutes() {
  const { isHydrated, profile, initStore } = useStore();
  const location = useLocation();

  useEffect(() => {
    initStore();
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
      <Route path="/income-config" element={<IncomeConfigPage />} />

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
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;