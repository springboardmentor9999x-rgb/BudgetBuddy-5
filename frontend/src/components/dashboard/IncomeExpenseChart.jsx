import { useEffect, useState } from "react";
import api from "../../services/api";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function IncomeExpenseChart() {

    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);
    const [savings, setSavings] = useState(0);

    useEffect(() => {

        const loadData = async () => {

            try {

                const response = await api.get(
                    "/dashboard/summary"
                );

                setIncome(
                    Number(
                        response.data.total_income || 0
                    )
                );

                setExpense(
                    Number(
                        response.data.total_expense || 0
                    )
                );

                setSavings(
                    Number(
                        response.data.total_savings || 0
                    )
                );

            } catch (error) {

                console.log(
                    "Chart data error:",
                    error
                );

            }
        };

        loadData();

    }, []);

    const data = {

        labels: [
            "Income",
            "Expense",
            "Savings"
        ],

        datasets: [
            {
                label: "Amount",

                data: [
                    income,
                    expense,
                    savings,
                ],

                backgroundColor: [
                    "#16A34A", // Income - Green
                    "#DC2626", // Expense - Red
                    "#9333EA", // Savings - Purple
                ],

                borderColor: [
                    "#16A34A",
                    "#DC2626",
                    "#9333EA",
                ],

                borderWidth: 1,
            },
        ],
    };

    const options = {

        responsive: true,

        plugins: {

            legend: {
                display: false,
            },

            title: {
                display: true,
                text: "Income vs Expense vs Savings",
            },

        },

        scales: {

            y: {
                beginAtZero: true,
            },

        },

    };

    return (

        <div
            style={{
                background: "white",
                padding: "25px",
                borderRadius: "12px",
                boxShadow:
                    "0 2px 10px rgba(0,0,0,0.08)",
                marginTop: "25px",
            }}
        >

            <Bar
                data={data}
                options={options}
            />

        </div>

    );

}

export default IncomeExpenseChart;