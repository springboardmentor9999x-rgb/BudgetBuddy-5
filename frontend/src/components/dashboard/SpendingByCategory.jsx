import { useEffect, useState } from "react";
import api from "../../services/api";

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";

import { Doughnut } from "react-chartjs-2";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

function SpendingByCategory({ month, year }) {

    const [categories, setCategories] = useState([]);

    useEffect(() => {

        const loadData = async () => {

            try {

                const response = await api.get(
                    "/dashboard/spending-by-category",
                    {
                        params: {
                            month,
                            year,
                        },
                    }
                );

                setCategories(
                    Array.isArray(response.data)
                        ? response.data
                        : []
                );

            } catch (error) {

                console.log(
                    "Spending category error:",
                    error
                );

            }

        };

        loadData();

    }, [month, year]);

    const data = {

        labels: categories.map(
            (item) => item.category
        ),

        datasets: [
            {
                data: categories.map(
                    (item) => Number(item.total || 0)
                ),

                backgroundColor: [
                    "#2563EB",
                    "#16A34A",
                    "#DC2626",
                    "#9333EA",
                    "#F59E0B",
                    "#0891B2",
                    "#EC4899",
                    "#64748B",
                ],

                borderWidth: 1,
            },
        ],

    };

    const options = {

        responsive: true,

        plugins: {

            legend: {
                position: "right",
            },

            tooltip: {
                callbacks: {
                    label: function (context) {

                        const item =
                            categories[context.dataIndex];

                        return (
                            `${item.category}: ₹ ` +
                            Number(
                                item.total || 0
                            ).toLocaleString("en-IN") +
                            ` (${item.percentage}%)`
                        );

                    },
                },
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

            <h2
                style={{
                    marginTop: 0,
                    marginBottom: "20px",
                }}
            >
                Spending by Category
            </h2>

            {categories.length === 0 ? (

                <p style={{ color: "#777" }}>
                    No expense data available for this month.
                </p>

            ) : (

                <div
                    style={{
                        width: "350px",
                        height: "350px",
                        margin: "0 auto",
                    }}
                >
                    <Doughnut data={data} options={options} />
                </div>

            )}

        </div>

    );

}

export default SpendingByCategory;