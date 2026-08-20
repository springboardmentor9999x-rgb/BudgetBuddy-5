import { useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import SavingsGoalForm from "../components/savings/SavingsGoalForm";
import SavingsGoalList from "../components/savings/SavingsGoalList";

function SavingsGoals() {
    const [refresh, setRefresh] = useState(false);

    const reloadGoals = () => {
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
                    Savings Goals
                </h1>

                <SavingsGoalForm
                    refresh={reloadGoals}
                />

                <SavingsGoalList
                    refresh={refresh}
                />
            </div>
        </div>
    );
}

export default SavingsGoals;