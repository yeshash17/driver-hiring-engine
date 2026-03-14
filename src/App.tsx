import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Toast } from './components/ui/Toast/Toast';
import { useToast } from './hooks/useToast';

import { UploadPage } from './components/pages/UploadPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { ReviewPage } from './components/pages/ReviewPage';
import { DriversPage } from './components/pages/DriversPage';
import { SchedulePage } from './components/pages/SchedulePage';
import { MasterDataPage } from './components/pages/MasterDataPage';
import { HistoryPage } from './components/pages/HistoryPage';
import { HowToPage } from './components/pages/HowToPage';

export default function App() {
  const { toast, showToast } = useToast();

  return (
    <BrowserRouter>
      <Shell
        sidebar={<Sidebar />}
        topbar={<TopBar onToast={showToast} />}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload"    element={<UploadPage onToast={showToast} />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/review"    element={<ReviewPage onToast={showToast} />} />
          <Route path="/drivers"   element={<DriversPage onToast={showToast} />} />
          <Route path="/schedule"  element={<SchedulePage />} />
          <Route path="/master"    element={<MasterDataPage />} />
          <Route path="/history"   element={<HistoryPage onToast={showToast} />} />
          <Route path="/how-to"    element={<HowToPage />} />
          <Route path="*"          element={<Navigate to="/upload" replace />} />
        </Routes>
      </Shell>
      <Toast message={toast.message} visible={toast.visible} />
    </BrowserRouter>
  );
}
