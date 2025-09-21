import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { StoreProvider } from './context/StoreContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/navigation/Header';
import { MobileNavigation } from './components/navigation/MobileNavigation';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { POS } from './pages/POS';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Expenses } from './pages/Expenses';
import { Audit } from './pages/Audit';

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <StoreProvider>
            <AppProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute requiredRole={['admin', 'owner', 'manager', 'cashier']}>
                  <Header />
                  <main className="pt-0 pb-24 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
                    <POS />
                  </main>
                  <MobileNavigation />
                </ProtectedRoute>
              } />
              <Route path="/pos" element={
                <ProtectedRoute requiredRole={['admin', 'owner', 'manager', 'cashier']}>
                  <Header />
                  <main className="pt-0 pb-24 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
                    <POS />
                  </main>
                  <MobileNavigation />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Header />
                  <main className="pt-0 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
                    <Dashboard />
                  </main>
                  <MobileNavigation />
                </ProtectedRoute>
              } />
              <Route path="/products" element={
                <ProtectedRoute requiredRole={['admin', 'owner', 'manager']}>
                  <Header />
                  <main className="pt-0 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
                    <Products />
                  </main>
                  <MobileNavigation />
                </ProtectedRoute>
              } />
              <Route path="/inventory" element={
                <ProtectedRoute requiredRole={['admin', 'owner', 'manager']}>
                  <Header />
                  <main className="pt-0 pb-24 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
                    <Inventory />
                  </main>
                  <MobileNavigation />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute requiredRole={['admin', 'owner', 'manager']}>
                  <Header />
                  <main className="pt-0 pb-24 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
                    <Reports />
                  </main>
                  <MobileNavigation />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute requiredRole={['admin', 'owner']}>
                  <Header />
                  <main className="pt-0 pb-24 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
                    <Settings />
                  </main>
                  <MobileNavigation />
                </ProtectedRoute>
              } />
              <Route path="/expenses" element={
                <ProtectedRoute requiredRole={['admin', 'owner', 'manager']}>
                  <Header />
                  <main className="pt-0 pb-24 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
                    <Expenses />
                  </main>
                  <MobileNavigation />
                </ProtectedRoute>
              } />
              <Route path="/audit" element={
                <ProtectedRoute requiredRole={['admin', 'owner', 'manager']}>
                  <Header />
                  <main className="pt-0 pb-24 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
                    <Audit />
                  </main>
                  <MobileNavigation />
                </ProtectedRoute>
              } />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#22c55e',
                    color: '#fff',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                    color: '#fff',
                  },
                },
              }}
            />
              </div>
            </Router>
            </AppProvider>
          </StoreProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
