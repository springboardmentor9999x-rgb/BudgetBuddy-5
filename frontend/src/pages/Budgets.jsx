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
                minHeight: "100vh",
                background: "#f5f7fb",
            }}
        >

            <Sidebar />

            <main
                style={{
                    marginLeft: "250px",
                    minHeight: "100vh",
                    padding: "20px",
                    boxSizing: "border-box",
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

            </main>

        </div>
    );
}

export default Budgets;