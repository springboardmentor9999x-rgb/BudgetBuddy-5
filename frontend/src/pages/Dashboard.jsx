import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import DashboardSummary from "../components/dashboard/DashboardSummary";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import IncomeExpenseChart from "../components/dashboard/IncomeExpenseChart";


function Dashboard() {

    return (

        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                background: "#f5f7fb",
            }}
        >

            {/* SIDEBAR */}

            <Sidebar />


            {/* MAIN CONTENT */}

            <div
                style={{
                    flex: 1,
                    padding: "20px",
                    boxSizing: "border-box",
                }}
            >

                {/* NAVBAR */}

                <Navbar />


                {/* DASHBOARD SUMMARY */}

                <DashboardSummary />


                {/* RECENT TRANSACTIONS */}

                <RecentTransactions />


                {/* INCOME / EXPENSE CHART */}

                <IncomeExpenseChart />

            </div>

        </div>

    );
}


export default Dashboard;