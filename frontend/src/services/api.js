const API_BASE_URL = "http://127.0.0.1:8000/api";
const HEALTH_URL = "http://127.0.0.1:8000/health";

export const checkHealth = async () => {
  const res = await fetch(HEALTH_URL);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
};

/**
 * Helper to perform fetch requests with error handling
 */
async function fetchWithError(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    // Standardize the error so components can easily display a message
    throw new Error(error.message === 'Failed to fetch' ? 'Backend unavailable' : error.message);
  }
}

// Dashboard
export const getDashboardSummary = () => fetchWithError('/dashboard/summary');

// Transactions
export const getTransactions = () => fetchWithError('/transactions');
export const getTransaction = (id) => fetchWithError(`/transactions/${id}`);

// Opportunities
export const getOpportunities = () => fetchWithError('/opportunities');
export const getOpportunity = (id) => fetchWithError(`/opportunities/${id}`);

// Recovery Actions
export const analyzeOpportunity = (id) => fetchWithError(`/recovery/analyze/${id}`, { method: 'POST' });

// Recovery Action Workflow
export const getRecoveryActions = () => fetchWithError('/recovery/actions');
export const createRecoveryAction = (id) => fetchWithError(`/recovery/actions/${id}`, { method: 'POST' });
export const approveRecoveryAction = (actionId) => fetchWithError(`/recovery/actions/${actionId}/approve`, { method: 'POST' });
export const rejectRecoveryAction = (actionId) => fetchWithError(`/recovery/actions/${actionId}/reject`, { method: 'POST' });

// Customers
export const getCustomers = () => fetchWithError('/customers');

// Analytics
export const getAnalyticsRecovery = () => fetchWithError('/analytics/recovery');
export const getAnalyticsCauses = () => fetchWithError('/analytics/causes');
export const getPortfolioAnalytics = () => fetchWithError('/analytics/recovery-opportunities');
export const getAnalyticsRecoveryPerformance = () => fetchWithError('/analytics/recovery-performance');

// Audit Trail
export const getAuditTrail = () => fetchWithError('/audit');

export const recordRecoveryOutcome = (actionId, outcome) => fetchWithError(`/recovery/actions/${actionId}/outcome`, {
  method: 'POST',
  body: JSON.stringify({ outcome })
});

// Batch Simulation
export const runBatchSimulation = (payload = {}) => fetchWithError('/recovery/batch-simulate', {
  method: 'POST',
  body: JSON.stringify(payload)
});
