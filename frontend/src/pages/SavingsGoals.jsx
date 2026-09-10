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
                    Savings Goals
                </h1>

                <SavingsGoalForm
                    refresh={reloadGoals}
                />

                <SavingsGoalList
                    refresh={refresh}
                />

            </main>

        </div>
    );
}

export default SavingsGoals;