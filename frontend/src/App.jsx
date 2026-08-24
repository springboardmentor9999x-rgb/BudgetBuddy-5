import VerifyOTP from "./pages/VerifyOTP";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
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

function App() {
    const token = localStorage.getItem("token");

    return (
        <>
            <ToastContainer position="top-right" autoClose={2000} />

            <Routes>
                <Route
                    path="/"
                    element={<Navigate to="/register" />}
                />

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
                <Route
                    path="/dashboard"
                    element={
                        token
                            ? <Dashboard />
                            : <Navigate to="/login" />
                    }
                />
                <Route
                    path="/income"
                    element={<Income />}
                />

                <Route
                    path="/expenses"
                    element={<Expenses />}
                />

                <Route
                    path="/banks"
                    element={<Banks />}
                />
                <Route
                    path="/budgets"
                    element={<Budgets />}
                />

                <Route
                    path="/banks/:bankId/transactions"
                    element={
                        token
                            ? <BankTransactions />
                            : <Navigate to="/login" />
                    }
                />

                <Route
                    path="/transactions"
                    element={<Transactions />}
                />
                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/savings-goals"
                    element={<SavingsGoals />}
                />

                <Route path="/notifications" element={<Notifications />} />


            </Routes>
        </>
    );
}

export default App;