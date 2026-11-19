import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute } from './components/AdminRoute';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { PrivacyPage } from './pages/PrivacyPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col text-[#F5F0E6]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
