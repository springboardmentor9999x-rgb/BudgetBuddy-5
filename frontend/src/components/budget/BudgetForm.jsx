import { useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

function BudgetForm({ refresh }) {
    const currentDate = new Date();

    const [category, setCategory] = useState("");
    const [monthlyLimit, setMonthlyLimit] = useState("");
    const [month, setMonth] = useState(
        currentDate.getMonth() + 1
    );
    const [year, setYear] = useState(
        currentDate.getFullYear()
    );
    const [loading, setLoading] = useState(false);

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanCategory = category.trim();
        const limit = Number(monthlyLimit);
        const selectedMonth = Number(month);
        const selectedYear = Number(year);

        if (!cleanCategory) {
            toast.error("Please enter a category");
            return;
        }

        if (!limit || limit <= 0) {
            toast.error(
                "Monthly limit must be greater than 0"
            );
            return;
        }

        if (selectedMonth < 1 || selectedMonth > 12) {
            toast.error("Please select a valid month");
            return;
        }

        if (selectedYear < 2020 || selectedYear > 2100) {
            toast.error("Please enter a valid year");
            return;
        }

        try {
            setLoading(true);

            await api.post("/budgets", {
                category: cleanCategory,
                monthly_limit: limit,
                month: selectedMonth,
                year: selectedYear,
            });

            toast.success("Budget added successfully");

            setCategory("");
            setMonthlyLimit("");

            // Reload BudgetList
            refresh();

        } catch (error) {
            console.log(
                "BUDGET CREATE ERROR:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to add budget"
            );
        } finally {
            setLoading(false);
        }
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
            <h2 style={{ marginTop: 0 }}>
                Set Monthly Budget
            </h2>

            <form onSubmit={handleSubmit}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "15px",
                    }}
                >
                    {/* CATEGORY */}

                    <div>
                        <label>Category</label>

                        <input
                            type="text"
                            placeholder="Example: Food"
                            value={category}
                            onChange={(e) =>
                                setCategory(e.target.value)
                            }
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginTop: "6px",
                                boxSizing: "border-box",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                            }}
                        />
                    </div>

                    {/* MONTHLY LIMIT */}

                    <div>
                        <label>Monthly Limit</label>

                        <input
                            type="number"
                            placeholder="Example: 5000"
                            value={monthlyLimit}
                            onChange={(e) =>
                                setMonthlyLimit(e.target.value)
                            }
                            min="1"
                            step="0.01"
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginTop: "6px",
                                boxSizing: "border-box",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                            }}
                        />
                    </div>

                    {/* MONTH */}

                    <div>
                        <label>Month</label>

                        <select
                            value={month}
                            onChange={(e) =>
                                setMonth(Number(e.target.value))
                            }
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginTop: "6px",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                            }}
                        >
                            {months.map(
                                (monthName, index) => (
                                    <option
                                        key={index + 1}
                                        value={index + 1}
                                    >
                                        {monthName}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {/* YEAR */}

                    <div>
                        <label>Year</label>

                        <input
                            type="number"
                            value={year}
                            onChange={(e) =>
                                setYear(e.target.value)
                            }
                            min="2020"
                            max="2100"
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginTop: "6px",
                                boxSizing: "border-box",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                            }}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        marginTop: "20px",
                        background:
                            loading
                                ? "#94a3b8"
                                : "#2563eb",
                        color: "white",
                        border: "none",
                        padding: "11px 20px",
                        borderRadius: "6px",
                        cursor:
                            loading
                                ? "not-allowed"
                                : "pointer",
                        fontSize: "15px",
                    }}
                >
                    {loading
                        ? "Adding..."
                        : "Add Budget"}
                </button>
            </form>
        </div>
    );
}

export default BudgetForm;