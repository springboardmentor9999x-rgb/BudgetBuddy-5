import { useEffect, useState } from "react";
import api from "../../services/api";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);


function TransactionTrend({ month, year }) {

    const [transactions, setTransactions] = useState([]);


    // ==========================================
    // LOAD TRANSACTIONS
    // ==========================================

    useEffect(() => {

        const loadTransactions = async () => {

            try {

                const response = await api.get(
                    "/dashboard/recent-transactions",
                    {
                        params: {
                            month,
                            year,
                        },
                    }
                );

                setTransactions(
                    Array.isArray(response.data)
                        ? response.data
                        : []
                );

            } catch (error) {

                console.log(
                    "Transaction trend error:",
                    error
                );

                setTransactions([]);

            }

        };


        loadTransactions();

    }, [month, year]);


    // ==========================================
    // GROUP TRANSACTIONS BY DATE
    // ==========================================

    const groupedData = {};


    transactions.forEach((item) => {

        const date = item.date || "Unknown";


        if (!groupedData[date]) {

            groupedData[date] = {
                income: 0,
                expense: 0,
                savings: 0,
            };

        }


        if (item.type === "Income") {

            groupedData[date].income += Number(
                item.amount || 0
            );

        }


        if (item.type === "Expense") {

            groupedData[date].expense += Number(
                item.amount || 0
            );

        }


        if (item.type === "Savings") {

            groupedData[date].savings += Number(
                item.amount || 0
            );

        }

    });


    // ==========================================
    // SORT DATES
    // ==========================================

    const labels = Object.keys(groupedData).sort(
        (a, b) =>
            new Date(a) - new Date(b)
    );


    // ==========================================
    // CHART DATA
    // ==========================================

    const data = {

        labels: labels,

        datasets: [

            {
                label: "Income",

                data: labels.map(
                    (date) =>
                        groupedData[date].income
                ),

                borderColor: "#16A34A",

                backgroundColor: "#16A34A",

                borderWidth: 2,

                pointRadius: 4,

                pointHoverRadius: 6,

                tension: 0.3,

            },


            {
                label: "Expense",

                data: labels.map(
                    (date) =>
                        groupedData[date].expense
                ),

                borderColor: "#DC2626",

                backgroundColor: "#DC2626",

                borderWidth: 2,

                pointRadius: 4,

                pointHoverRadius: 6,

                tension: 0.3,

            },


            {
                label: "Savings",

                data: labels.map(
                    (date) =>
                        groupedData[date].savings
                ),

                borderColor: "#9333EA",

                backgroundColor: "#9333EA",

                borderWidth: 2,

                pointRadius: 4,

                pointHoverRadius: 6,

                tension: 0.3,

            },

        ],

    };


    // ==========================================
    // CHART OPTIONS
    // ==========================================

    const options = {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {
                position: "top",
            },

            title: {
                display: true,

                text: "Transaction Trend",

                font: {
                    size: 18,
                    weight: "bold",
                },

                padding: {
                    bottom: 15,
                },
            },

            tooltip: {

                callbacks: {

                    label: function (context) {

                        return (
                            `${context.dataset.label}: ₹ ` +
                            Number(
                                context.raw || 0
                            ).toLocaleString("en-IN")
                        );

                    },

                },

            },

        },


        scales: {

            x: {

                title: {
                    display: true,
                    text: "Date",
                },

                grid: {
                    display: false,
                },

            },


            y: {

                beginAtZero: true,

                title: {
                    display: true,
                    text: "Amount (₹)",
                },

                ticks: {

                    callback: function (value) {

                        return (
                            "₹ " +
                            Number(value).toLocaleString(
                                "en-IN"
                            )
                        );

                    },

                },

            },

        },

    };


    // ==========================================
    // MAIN UI
    // ==========================================

    return (

        <div
            style={{
                background: "white",

                padding: "25px",

                borderRadius: "12px",

                boxShadow:
                    "0 2px 10px rgba(0,0,0,0.08)",

                width: "100%",

                height: "380px",

                boxSizing: "border-box",
            }}
        >

            {labels.length === 0 ? (

                <div
                    style={{
                        height: "100%",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        color: "#777",
                    }}
                >

                    No transaction data available
                    for this month.

                </div>

            ) : (

                <div
                    style={{
                        width: "100%",

                        height: "330px",
                    }}
                >

                    <Line
                        data={data}
                        options={options}
                    />

                </div>

            )}

        </div>

    );

}


export default TransactionTrend;