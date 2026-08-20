import { useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import BudgetForm from "../components/budget/BudgetForm";
import BudgetList from "../components/budget/BudgetList";

function Budgets() {
    const [refresh, setRefresh] = useState(false);

    const reloadBudgets = () => {
        setRefresh((prev) => !prev);
    };

    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                background: "#f5f7fb",
            }}
        >
            <Sidebar />

            <div
                style={{
                    flex: 1,
                    padding: "20px",
                }}
            >
                <Navbar />

                <h1
                    style={{
                        marginTop: "25px",
                    }}
                >
                    Budget Management
                </h1>

                <BudgetForm
                    refresh={reloadBudgets}
                />

                <BudgetList
                    refresh={refresh}
                />
            </div>
        </div>
    );
}

export default Budgets;