import { useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import IncomeForm from "../components/income/IncomeForm";
import IncomeList from "../components/income/IncomeList";

function Income() {

    const [incomeRefresh, setIncomeRefresh] =
        useState(false);

    const reloadIncome = () => {
        setIncomeRefresh(
            (previous) => !previous
        );
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
                        marginBottom: "25px",
                    }}
                >
                    Income
                </h1>

                <IncomeForm
                    refresh={reloadIncome}
                />

                <IncomeList
                    refresh={incomeRefresh}
                />

            </main>

        </div>
    );
}

export default Income;