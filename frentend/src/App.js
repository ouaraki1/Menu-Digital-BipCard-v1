import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminLogin from './pages/admin/Login';
import KitchenLogin from './pages/kitchen/Login';
import RoomEntry from './pages/client/RoomEntry';
import Dashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import KitchenOrders from './pages/kitchen/Orders';
import ClientMenu from './pages/client/Menu';
import ClientPayment from './pages/client/Payment';
import ClientOrders from './pages/client/Orders';
import { ToastProvider } from './components/ToastContext';
import Categories from './pages/admin/Categories';
import Menu from './pages/admin/Menu';
// Pages vides pour la structure
// const AdminMenu = () => <div>Gestion du Menu</div>;
// const AdminCategories = () => <div>Gestion des Catégories</div>;

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/menu" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Menu />
              </ProtectedRoute>
            } />
            <Route path="/admin/categories" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Categories />
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminOrders />
              </ProtectedRoute>
            } />

            {/* Kitchen */}
            <Route path="/kitchen/login" element={<KitchenLogin />} />
            <Route path="/kitchen/orders" element={
              <ProtectedRoute allowedRoles={["kitchen"]}>
                <KitchenOrders />
              </ProtectedRoute>
            } />

            {/* Client */}
            <Route path="/client/entry" element={<RoomEntry />} />
            <Route path="/client/:roomNum/menu" element={<ClientMenu />} />
            <Route path="/client/:roomNum/payment" element={<ClientPayment />} />
            <Route path="/client/:roomNum/orders" element={<ClientOrders />} />

            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to="/admin/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
