import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import { Placeholder } from '@/pages/Placeholder';

// Member-owned screens start as placeholders. Replace each with the real page.
const Fleet = () => <Placeholder title="Vehicle Registry" owner="Member 1 — Fleet" brief="CRUD vehicles, unique registration no, status lifecycle. GET /api/vehicles is wired." />;
const Maintenance = () => <Placeholder title="Maintenance" owner="Member 1 — Fleet" brief="Log/close service records; Available ↔ In Shop. GET /api/maintenance is wired." />;
const Drivers = () => <Placeholder title="Drivers & Safety" owner="Member 2 — Operations" brief="Driver profiles, status toggle, license/suspension rules. GET /api/drivers is wired." />;
const Trips = () => <Placeholder title="Trip Dispatcher" owner="Member 2 — Operations" brief="Trip lifecycle, capacity + eligibility checks, live board. GET /api/trips is wired." />;
const Fuel = () => <Placeholder title="Fuel & Expenses" owner="Member 3 — Finance" brief="Fuel logs, expenses, total operational cost. GET /api/fuel/* is wired." />;
const Analytics = () => <Placeholder title="Reports & Analytics" owner="Member 3 — Finance" brief="Efficiency, utilization, ROI, revenue. GET /api/analytics/overview is wired." />;
const Settings = () => <Placeholder title="Settings & RBAC" owner="Member 3 — Finance" brief="Depot settings + RBAC matrix. GET /api/settings is wired." />;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/fleet" element={<ProtectedRoute module="fleet"><Fleet /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute module="fleet"><Maintenance /></ProtectedRoute>} />
            <Route path="/drivers" element={<ProtectedRoute module="drivers"><Drivers /></ProtectedRoute>} />
            <Route path="/trips" element={<ProtectedRoute module="trips"><Trips /></ProtectedRoute>} />
            <Route path="/fuel" element={<ProtectedRoute module="fuel"><Fuel /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute module="analytics"><Analytics /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute module="settings"><Settings /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
