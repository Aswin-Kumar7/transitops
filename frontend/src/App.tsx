import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Fleet from '@/pages/Fleet';
import Maintenance from '@/pages/Maintenance';
import DriversPage from '@/pages/Drivers';
import TripsPage from '@/pages/Trips';
import Fuel from '@/pages/Fuel';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';

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
            <Route path="/drivers" element={<ProtectedRoute module="drivers"><DriversPage /></ProtectedRoute>} />
            <Route path="/trips" element={<ProtectedRoute module="trips"><TripsPage /></ProtectedRoute>} />
            <Route path="/fuel" element={<ProtectedRoute module="fuel"><Fuel /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute module="analytics"><Analytics /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute module="settings"><Settings /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
