import { subDays, subHours, subMinutes } from 'date-fns';

const now = new Date();
const generateId = (prefix) => `${prefix}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

export const aggregateMetrics = {
  totalRevenueProcessed: 12500000,
  revenueAtRisk: 345000,
  recoverableRevenue: 280000,
  revenueRecovered: 195000, // ₹1,95,000 for display
  recoveryRate: 69.6,
  failedPayments: 124,
  checkoutAbandonments: 89,
  activeRecoveryWorkflows: 45,
};

export const recoveryOpportunities = [
  {
    id: generateId('OPP'),
    customer: 'user_X4192@example.com',
    amountAtRisk: 4999,
    rootCause: 'Payment Failure',
    recoveryProbability: 82,
    recommendedAction: 'Retry Payment',
    status: 'Eligible',
    timestamp: subHours(now, 1).toISOString(),
    details: 'Payment failed because of a temporary bank/network decline. Historical recovery rate for similar failures: 73%.',
    boundaries: {
      maxRetries: 1,
      cooldown: '30 minutes',
      maxAttemptsPerCustomer: 2
    }
  },
  {
    id: generateId('OPP'),
    customer: 'user_M8821@example.com',
    amountAtRisk: 12499,
    rootCause: 'Checkout Abandonment',
    recoveryProbability: 71,
    recommendedAction: 'Send Reminder',
    status: 'Pending',
    timestamp: subHours(now, 3).toISOString(),
    details: 'User dropped off at OTP screen. Historical recovery for OTP drop-offs via SMS reminder: 45%.',
    boundaries: {
      maxRetries: 1,
      cooldown: '15 minutes',
      maxAttemptsPerCustomer: 1
    }
  },
  {
    id: generateId('OPP'),
    customer: 'user_L9910@example.com',
    amountAtRisk: 2999,
    rootCause: 'Subscription Failure',
    recoveryProbability: 95,
    recommendedAction: 'Auto-Retry',
    status: 'In Progress',
    timestamp: subHours(now, 5).toISOString(),
    details: 'Insufficient funds reported on recurring mandate. Smart retry scheduled on expected salary date.',
    boundaries: {
      maxRetries: 3,
      cooldown: '24 hours',
      maxAttemptsPerCustomer: 3
    }
  },
  {
    id: generateId('OPP'),
    customer: 'user_K1102@example.com',
    amountAtRisk: 8500,
    rootCause: 'Bank/Network Failure',
    recoveryProbability: 88,
    recommendedAction: 'Route via Alternate Gateway',
    status: 'Eligible',
    timestamp: subHours(now, 12).toISOString(),
    details: 'Primary gateway HDFC down. Rerouting via secondary gateway ICICI.',
    boundaries: {
      maxRetries: 1,
      cooldown: 'immediate',
      maxAttemptsPerCustomer: 1
    }
  },
  {
    id: generateId('OPP'),
    customer: 'user_J3349@example.com',
    amountAtRisk: 15999,
    rootCause: 'Overdue Invoice',
    recoveryProbability: 40,
    recommendedAction: 'WhatsApp Reminder + Discount',
    status: 'Failed',
    timestamp: subDays(now, 2).toISOString(),
    details: 'Invoice overdue by 5 days. Offering a 5% discount to incentivize immediate payment.',
    boundaries: {
      maxRetries: 1,
      cooldown: '48 hours',
      maxAttemptsPerCustomer: 1
    }
  }
];

export const auditTrailData = [
  {
    id: generateId('AUD'),
    timestamp: subMinutes(now, 15).toISOString(),
    opportunityId: 'OPP_A1B2C3',
    detectionReason: 'Bank timeout on UPI mandate',
    aiRecommendation: 'Retry after 15 mins',
    actionTaken: 'Auto-Retry Executed',
    policyApplied: 'Max 2 retries per mandate',
    result: 'Success',
    amountRecovered: 3500
  },
  {
    id: generateId('AUD'),
    timestamp: subHours(now, 1).toISOString(),
    opportunityId: 'OPP_X9Y8Z7',
    detectionReason: 'Dropped at checkout page',
    aiRecommendation: 'Send Email Reminder',
    actionTaken: 'Email Sent',
    policyApplied: 'No spam - 1 email per cart',
    result: 'Pending',
    amountRecovered: 0
  },
  {
    id: generateId('AUD'),
    timestamp: subHours(now, 2).toISOString(),
    opportunityId: 'OPP_P4Q5R6',
    detectionReason: 'Card Declined - Insufficient Funds',
    aiRecommendation: 'Wait 24h for salary hit',
    actionTaken: 'Retry Queued',
    policyApplied: 'Smart routing enabled',
    result: 'Pending',
    amountRecovered: 0
  },
  {
    id: generateId('AUD'),
    timestamp: subDays(now, 1).toISOString(),
    opportunityId: 'OPP_M1N2O3',
    detectionReason: 'Gateway 503 Error',
    aiRecommendation: 'Immediate Fallback',
    actionTaken: 'Routed to Gateway B',
    policyApplied: 'Cost-optimized routing',
    result: 'Success',
    amountRecovered: 12500
  }
];

export const riskTrendData = [
  { time: '00:00', amountAtRisk: 12000, recovered: 8000 },
  { time: '04:00', amountAtRisk: 15000, recovered: 9500 },
  { time: '08:00', amountAtRisk: 25000, recovered: 18000 },
  { time: '12:00', amountAtRisk: 45000, recovered: 32000 },
  { time: '16:00', amountAtRisk: 55000, recovered: 40000 },
  { time: '20:00', amountAtRisk: 30000, recovered: 22000 },
];

export const funnelData = [
  { name: 'Revenue at Risk', value: 345000 },
  { name: 'Eligible for Recovery', value: 280000 },
  { name: 'Intervention Started', value: 250000 },
  { name: 'Recovered', value: 195000 },
];

export const topCausesData = [
  { name: 'Payment Failure', value: 45 },
  { name: 'Checkout Abandonment', value: 30 },
  { name: 'Bank/Network Failure', value: 15 },
  { name: 'Subscription Failure', value: 10 },
];
