import axios from 'axios';

// Hardcoded Railway backend URL — no env var needed
const RAILWAY_BACKEND = 'https://budgetbuddy.up.railway.app/api/v1';

export const getApiBaseUrl = () => {
  // 1. Custom override from localStorage
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('budgetbuddy_custom_api_url');
    if (custom && custom.trim() !== '') {
      return custom.trim();
    }
  }
  // 2. Env var (for local dev with custom backend)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // 3. Production: always use Railway
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return RAILWAY_BACKEND;
  }
  // 4. Local development
  return 'http://localhost:8000/api/v1';
};

// Create axios with a PLACEHOLDER baseURL — the real URL is set per-request
const api = axios.create({
  baseURL: RAILWAY_BACKEND,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Resolve the correct baseURL lazily on EVERY request (not at build time)
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

// Demo Mode Mock Dataset
const demoMockData = {
  user: { id: 2, email: 'student@budgetbuddy.com', full_name: 'bharadwaj (Student)', role: 'student', is_email_verified: true, is_active: true },
  incomes: [
    { id: 1, title: "Monthly Pocket Money", amount: 600.0, category: "Pocket Money", date: "2026-09-01", description: "Monthly allowance from parents" },
    { id: 2, title: "Merit Scholarship Grant", amount: 400.0, category: "Scholarship", date: "2026-09-05", description: "University quarterly stipend" },
    { id: 3, title: "Web Dev Freelance Gig", amount: 350.0, category: "Freelance", date: "2026-09-07", description: "Client website fix" }
  ],
  expenses: [
    { id: 1, title: "Campus Cafeteria Lunch", amount: 18.50, category: "Food", date: "2026-09-08", payment_method: "Debit Card", notes: "Lunch with classmates" },
    { id: 2, title: "Groceries at Walmart", amount: 85.20, category: "Food", date: "2026-09-06", payment_method: "Credit Card", notes: "Weekly groceries" },
    { id: 3, title: "Monthly Bus Pass", amount: 45.00, category: "Travel", date: "2026-09-02", payment_method: "Debit Card", notes: "Transit pass" },
    { id: 4, title: "Uber ride home from lab", amount: 22.00, category: "Travel", date: "2026-09-04", payment_method: "UPI", notes: "Late night study" },
    { id: 5, title: "Data Structures Textbook", amount: 75.00, category: "Education", date: "2026-09-03", payment_method: "Credit Card", notes: "Course requirement" }
  ],
  budgets: [
    { id: 1, category: "Food", amount_allocated: 250.0, amount_spent: 103.70, percent_used: 41.5, month: "2026-09", status: "normal" },
    { id: 2, category: "Travel", amount_allocated: 100.0, amount_spent: 67.00, percent_used: 67.0, month: "2026-09", status: "warning" },
    { id: 3, category: "Education", amount_allocated: 150.0, amount_spent: 75.00, percent_used: 50.0, month: "2026-09", status: "normal" },
    { id: 4, category: "Entertainment", amount_allocated: 80.0, amount_spent: 51.99, percent_used: 65.0, month: "2026-09", status: "normal" }
  ],
  savings: [
    { id: 1, title: "New Laptop Fund", target_amount: 1200.0, current_amount: 750.0, target_date: "2026-12-01", category: "Tech & Hardware", is_completed: false },
    { id: 2, title: "Japan Trip Fund", target_amount: 2000.0, current_amount: 450.0, target_date: "2027-03-01", category: "Travel", is_completed: false },
    { id: 3, title: "Emergency Savings", target_amount: 500.0, current_amount: 500.0, target_date: "2026-08-15", category: "Financial Safety", is_completed: true }
  ],
  bankAccounts: [
    { id: 1, account_name: "Chase Checking", bank_name: "Chase", account_type: "checking", account_number_last4: "4892", current_balance: 2450.00, currency: "USD", is_primary: true },
    { id: 2, account_name: "High Yield Savings", bank_name: "Ally Bank", account_type: "savings", account_number_last4: "8810", current_balance: 5200.50, currency: "USD", is_primary: false }
  ],
  summary: {
    total_income: 1350.0,
    total_expense: 423.99,
    net_savings: 926.01,
    active_budgets_count: 4,
    goals_count: 3
  },
  notifications: [
    { id: 101, title: "Welcome to BudgetBuddy!", message: "Your personal finance portal is ready.", type: "system", is_read: false, created_at: new Date().toISOString() },
    { id: 102, title: "Budget Alert: Travel", message: "You have used 67% of your Travel budget.", type: "budget_alert", is_read: false, created_at: new Date().toISOString() }
  ]
};

// Interceptor to dynamically attach token & update baseURL
api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = sessionStorage.getItem('budgetbuddy_token') || localStorage.getItem('budgetbuddy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for response & mock demo mode interception
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = sessionStorage.getItem('budgetbuddy_token') || localStorage.getItem('budgetbuddy_token');
    const isDemo = token && token.startsWith('demo_access_token');
    const isNetworkError = !error.response;

    if (isDemo || isNetworkError) {
      const url = error.config?.url || '';
      const method = error.config?.method?.toUpperCase() || 'GET';

      if (url.includes('/auth/me')) {
        const saved = sessionStorage.getItem('budgetbuddy_user') || localStorage.getItem('budgetbuddy_user');
        return Promise.resolve({ data: saved ? JSON.parse(saved) : demoMockData.user });
      }
      if (url.includes('/incomes')) return Promise.resolve({ data: demoMockData.incomes });
      if (url.includes('/expenses')) return Promise.resolve({ data: demoMockData.expenses });
      if (url.includes('/budgets')) return Promise.resolve({ data: demoMockData.budgets });
      if (url.includes('/savings')) return Promise.resolve({ data: demoMockData.savings });
      if (url.includes('/bank-accounts')) return Promise.resolve({ data: demoMockData.bankAccounts });
      if (url.includes('/analytics/summary')) return Promise.resolve({ data: demoMockData.summary });
      if (url.includes('/analytics/category-breakdown')) return Promise.resolve({ data: [
        { category: "Food", total: 103.70 },
        { category: "Education", total: 75.00 },
        { category: "Travel", total: 67.00 },
        { category: "Entertainment", total: 51.99 }
      ] });
      if (url.includes('/analytics/monthly-trends')) return Promise.resolve({ data: [
        { month: "2026-05", income: 1100, expense: 380 },
        { month: "2026-06", income: 1250, expense: 410 },
        { month: "2026-07", income: 1300, expense: 390 },
        { month: "2026-08", income: 1200, expense: 450 },
        { month: "2026-09", income: 1350, expense: 423.99 }
      ] });
      if (url.includes('/notifications')) return Promise.resolve({ data: demoMockData.notifications });

      if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        return Promise.resolve({ data: { message: "Operation completed successfully (Demo Mode)", status: "success" } });
      }
    }

    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('budgetbuddy_token');
      sessionStorage.removeItem('budgetbuddy_user');
      localStorage.removeItem('budgetbuddy_token');
      localStorage.removeItem('budgetbuddy_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
