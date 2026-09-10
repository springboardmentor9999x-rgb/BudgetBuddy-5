import { useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import ExpenseForm from "../components/expense/ExpenseForm";
import ExpenseList from "../components/expense/ExpenseList";

function Expenses() {

    const [expenseRefresh, setExpenseRefresh] =
        useState(false);

    const reloadExpense = () => {
        setExpenseRefresh(
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
                    Expenses
                </h1>

                <ExpenseForm
                    refresh={reloadExpense}
                />

                <ExpenseList
                    refresh={expenseRefresh}
                />

            </main>

        </div>
    );
}

export default Expenses;