import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout & Protected Rules
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import BatchRegistration from './pages/BatchRegistration';
import BatchDetails from './pages/BatchDetails';
import SupplyChainTracking from './pages/SupplyChainTracking';
import ImageAuthentication from './pages/ImageAuthentication';
import ConsumerPortal from './pages/ConsumerPortal';
import RegulatoryDashboard from './pages/RegulatoryDashboard';
import AICounterfeitDetection from './pages/AICounterfeitDetection';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Unauthenticated Identity Paths */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Public Unauthenticated Consumer Scan Lookup */}
        <Route path="/verify" element={<ConsumerPortal />} />

        {/* Protected Dashboard Channels */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/batches"
          element={
            <ProtectedRoute allowedRoles={['Manufacturer']}>
              <Layout>
                <BatchRegistration />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/batches/:batchNum"
          element={
            <ProtectedRoute allowedRoles={['Manufacturer']}>
              <Layout>
                <BatchDetails />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/logistics"
          element={
            <ProtectedRoute allowedRoles={['Manufacturer', 'Distributor', 'Pharmacy']}>
              <Layout>
                <SupplyChainTracking />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/image-verification"
          element={
            <ProtectedRoute allowedRoles={['Pharmacy', 'Regulatory Authority']}>
              <Layout>
                <ImageAuthentication />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/regulatory"
          element={
            <ProtectedRoute allowedRoles={['Regulatory Authority']}>
              <Layout>
                <RegulatoryDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-anomalies"
          element={
            <ProtectedRoute allowedRoles={['Regulatory Authority']}>
              <Layout>
                <AICounterfeitDetection />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirects */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
