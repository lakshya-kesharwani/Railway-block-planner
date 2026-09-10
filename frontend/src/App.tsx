import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { LoginView } from './components/auth/LoginView';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { MaintenanceRequestsTable } from './components/requests/MaintenanceRequestsTable';
import { NewRequestModal } from './components/requests/NewRequestModal';
import { AIOptimizationPipeline } from './components/pipeline/AIOptimizationPipeline';
import { ScheduleMapView } from './components/schedulemap/ScheduleMapView';
import { ApprovalsView } from './components/approvals/ApprovalsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { StormModeView } from './components/storm/StormModeView';
import { WhatIfSimulatorView } from './components/whatif/WhatIfSimulatorView';
import { WhatIfSimulatorPage } from './components/whatif/WhatIfSimulatorPage';
import { AccessRestricted } from './components/common/AccessRestricted';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/Toast';
import { AIAssistantWidget } from './components/assistant/AIAssistantWidget';
import { can } from './utils/permissions';

interface MainContentProps {
  initialView?: string;
}

const MainContent: React.FC<MainContentProps> = ({ initialView }) => {
  const { activeView, setActiveView, role } = useApp();

  React.useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView, setActiveView]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardHome />;
      case 'requests':
        return <MaintenanceRequestsTable />;
      case 'pipeline':
        if (!can(role, 'canOptimize')) {
          return <AccessRestricted moduleName="AI Optimization Pipeline" onReturn={() => setActiveView('dashboard')} />;
        }
        return <AIOptimizationPipeline />;
      case 'gantt':
        return <ScheduleMapView />;
      case 'approvals':
        if (!can(role, 'canApprove')) {
          return <AccessRestricted moduleName="Clearance & Approvals" onReturn={() => setActiveView('dashboard')} />;
        }
        return <ApprovalsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        if (!can(role, 'canAccessSettings')) {
          return <AccessRestricted moduleName="System Settings" onReturn={() => setActiveView('dashboard')} />;
        }
        return <SettingsView />;
      case 'whatif':
        if (!can(role, 'canOptimize')) {
          return <AccessRestricted moduleName="What-If Simulator" onReturn={() => setActiveView('dashboard')} />;
        }
        return <WhatIfSimulatorView />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="h-screen bg-railway-bg flex flex-col text-slate-100 selection:bg-railway-orange selection:text-white overflow-hidden">
      <Header />
      
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar />
        
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto h-full railway-grid-pattern">
          <div className="w-full mx-auto pb-8">
            <ErrorBoundary fallbackTitle="Module View Notice">
              {renderActiveView()}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <NewRequestModal />
    </div>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { toasts, dismissToast } = useApp();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <>
      <Routes>
        <Route path="/storm-mode" element={<StormModeView />} />
        <Route path="/what-if-simulator" element={<WhatIfSimulatorPage />} />
        <Route path="/schedule-and-map" element={<MainContent initialView="gantt" />} />
        <Route path="/schedule-map" element={<MainContent initialView="gantt" />} />
        <Route path="/*" element={<MainContent />} />
      </Routes>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <AIAssistantWidget />
    </>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary fallbackTitle="Application Notice">
        <AuthProvider>
          <AppProvider>
            <AuthenticatedApp />
          </AppProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
