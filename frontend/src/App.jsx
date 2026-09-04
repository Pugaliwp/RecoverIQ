import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { RecoveryOpportunities } from './pages/RecoveryOpportunities';
import { OpportunityDetails } from './pages/OpportunityDetails';
import { AuditTrail } from './pages/AuditTrail';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Transactions } from './pages/Transactions';
import { TransactionDetails } from './pages/TransactionDetails';

import { RecoveryActions } from './pages/RecoveryActions';
import { Customers } from './pages/Customers';
import { BatchSimulation } from './pages/BatchSimulation';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="transactions/:id" element={<TransactionDetails />} />
              <Route path="opportunities" element={<RecoveryOpportunities />} />
              <Route path="opportunities/:id" element={<OpportunityDetails />} />
              <Route path="actions" element={<RecoveryActions />} />
              <Route path="batch-simulation" element={<BatchSimulation />} />
              <Route path="customers" element={<Customers />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="audit" element={<AuditTrail />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
