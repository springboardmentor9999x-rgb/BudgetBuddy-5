import VerifyOTP from "./pages/VerifyOTP";

import {
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import {
    ToastContainer
} from "react-toastify";

import AdminRoute from "./components/auth/AdminRoute";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Banks from "./pages/Banks";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Transactions from "./pages/Transactions";
import BankTransactions from "./pages/BankTransactions";
import Budgets from "./pages/Budgets";
import AdminDashboard from "./pages/AdminDashboard";
import SavingsGoals from "./pages/SavingsGoals";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import Premium from "./pages/Premium";
import Profile from "./pages/Profile";
import SystemAnalytics from "./pages/SystemAnalytics";
import UserManagement from "./pages/UserManagement";

function App() {

    const token = localStorage.getItem("token");

    return (

        <>

            <ToastContainer
                position="top-right"
                autoClose={2000}
            />

            <Routes>

                {/* HOME */}

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/register"
                            replace
                        />
                    }
                />


                {/* AUTH */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/verify-otp"
                    element={<VerifyOTP />}
                />


                {/* MAIN DASHBOARD */}

                <Route
                    path="/dashboard"
                    element={
                        token
                            ? <Dashboard />
                            : <Navigate
                                to="/login"
                                replace
                            />
                    }
                />


                {/* INCOME */}

                <Route
                    path="/income"
                    element={
                        token
                            ? <Income />
                            : <Navigate
                                to="/login"
                                replace
                            />
                    }
                />


                {/* EXPENSES */}

                <Route
                    path="/expenses"
                    element={
                        token
                            ? <Expenses />
                            : <Navigate
                                to="/login"
                                replace
                            />
                    }
                />


                {/* BANKS */}

                <Route
                    path="/banks"
                    element={
                        token
                            ? <Banks />
                            : <Navigate
                                to="/login"
                                replace
                            />
                    }
                />


                {/* BANK TRANSACTIONS */}

                <Route
                    path="/banks/:bankId/transactions"
                    element={
                        token
                            ? <BankTransactions />
                            : <Navigate
                                to="/login"
                                replace
                            />
                    }
                />


                {/* BUDGET */}

                <Route
                    path="/budgets"
                    element={
                        token
                            ? <Budgets />
                            : <Navigate
                                to="/login"
                                replace
                            />
                    }
                />


                {/* TRANSACTIONS */}

                <Route
                    path="/transactions"
                    element={
                        token
                            ? <Transactions />
                            : <Navigate
                                to="/login"
                                replace
                            />
                    }
                />


                {/* SAVINGS GOALS */}

                <Route
                    path="/savings-goals"
                    element={
                        token
                            ? <SavingsGoals />
                            : <Navigate
                                to="/login"
                                replace
                            />
                    }
                />


                {/* NOTIFICATIONS */}

                <Route
                    path="/notifications"
                    element={
                        token
                            ? <Notifications />
                            : <Navigate
                                to="/login"
                                replace
                            />
                    }
                />


                {/* REPORTS */}

                <Route
                    path="/reports"
                    element={
                        token
                            ? <Reports />
                            : <Navigate
                                to="/login"
                                replace
                            />
                    }
                />


                {/* PROFILE */}

                <Route
                    path="/profile"
                    element={
                        token
                            ? <Profile />
                            : <Navigate
                                to="/login"
                                replace
                            />
                    }
                />


                {/* ADMIN PANEL */}

                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />


                {/* PREMIUM */}

                <Route
                    path="/premium"
                    element={<Premium />}
                />


                {/* SYSTEM ANALYTICS */}

                <Route
                    path="/system-analytics"
                    element={<SystemAnalytics />}
                />


                {/* USER MANAGEMENT */}

                <Route
                    path="/user-management"
                    element={<UserManagement />}
                />

            </Routes>

        </>
    );
}

export default App;