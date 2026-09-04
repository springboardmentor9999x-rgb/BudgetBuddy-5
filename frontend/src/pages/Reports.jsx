import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../services/api";

function Reports() {
    const navigate = useNavigate();

    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState("");

    const [loadingBanks, setLoadingBanks] =
        useState(true);

    const [preview, setPreview] =
        useState(null);

    const [loadingPreview, setLoadingPreview] =
        useState(false);

    const [downloadingPdf, setDownloadingPdf] =
        useState(false);

    const [downloadingExcel, setDownloadingExcel] =
        useState(false);

    const [reports, setReports] =
        useState([]);

    const [loadingHistory, setLoadingHistory] =
        useState(false);


    // ==================================================
    // MODULES
    // ==================================================

    const modules = [
        {
            key: "financial_summary",
            label: "Financial Summary",
        },
        {
            key: "income_transactions",
            label: "Income Transactions",
        },
        {
            key: "expense_transactions",
            label: "Expense Transactions",
        },
        {
            key: "income_categories",
            label: "Income Categories",
        },
        {
            key: "expense_categories",
            label: "Expense Categories",
        },
        {
            key: "budget_report",
            label: "Budget Report",
        },
        {
            key: "savings_goals",
            label: "Savings Goals",
        },
        {
            key: "savings_transactions",
            label: "Savings Transactions",
        },
        {
            key: "bank_account_details",
            label: "Bank Account Details",
        },
    ];


    const [selectedModules, setSelectedModules] =
        useState([
            "financial_summary",
            "income_transactions",
            "expense_transactions",
            "income_categories",
            "expense_categories",
            "budget_report",
            "savings_goals",
            "savings_transactions",
            "bank_account_details",
        ]);


    // ==================================================
    // LOAD BANKS
    // ==================================================

    useEffect(() => {
        loadBanks();
        loadReportHistory();
    }, []);


    const loadBanks = async () => {
        try {
            setLoadingBanks(true);

            const response =
                await api.get("/banks");

            setBanks(response.data || []);

        } catch (error) {

            console.error(
                "BANK LOAD ERROR:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to load bank accounts"
            );

        } finally {

            setLoadingBanks(false);

        }
    };


    // ==================================================
    // LOAD REPORT HISTORY
    // ==================================================

    const loadReportHistory = async () => {

        try {

            setLoadingHistory(true);

            const response =
                await api.get("/reports");

            setReports(
                response.data || []
            );

        } catch (error) {

            console.error(
                "REPORT HISTORY ERROR:",
                error.response?.data || error
            );

        } finally {

            setLoadingHistory(false);

        }
    };


    // ==================================================
    // MODULE CHECKBOX
    // ==================================================

    const toggleModule = (moduleKey) => {

        setSelectedModules((previous) => {

            if (
                previous.includes(moduleKey)
            ) {

                return previous.filter(
                    (item) =>
                        item !== moduleKey
                );

            }

            return [
                ...previous,
                moduleKey,
            ];
        });
    };


    // ==================================================
    // SELECT ALL
    // ==================================================

    const selectAllModules = () => {

        setSelectedModules(
            modules.map(
                (module) =>
                    module.key
            )
        );
    };


    // ==================================================
    // CLEAR ALL
    // ==================================================

    const clearAllModules = () => {

        setSelectedModules([]);

        setPreview(null);
    };


    // ==================================================
    // GET BANK NAME
    // ==================================================

    const getSelectedBankName = () => {

        if (!selectedBank) {

            return "All Bank Accounts";

        }

        const bank = banks.find(
            (item) =>
                String(item.id) ===
                String(selectedBank)
        );

        if (!bank) {

            return "Selected Bank Account";

        }

        return (
            `${bank.bank_name} - ****` +
            String(
                bank.account_number
            ).slice(-4)
        );
    };


    // ==================================================
    // MODULE QUERY
    // ==================================================

    const getModulesQuery = () => {

        return selectedModules.join(",");
    };


    // ==================================================
    // PREVIEW REPORT
    // ==================================================

    const handlePreview = async () => {

        if (
            selectedModules.length === 0
        ) {

            toast.error(
                "Please select at least one module"
            );

            return;
        }

        try {

            setLoadingPreview(true);

            let url =
                `/reports/preview?modules=${encodeURIComponent(
                    getModulesQuery()
                )}`;

            if (selectedBank) {

                url +=
                    `&bank_account_id=${selectedBank}`;

            }

            const response =
                await api.get(url);

            setPreview(
                response.data
            );

            toast.success(
                "Report preview generated"
            );

        } catch (error) {

            console.error(
                "REPORT PREVIEW ERROR:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to generate report preview"
            );

        } finally {

            setLoadingPreview(false);

        }
    };


    // ==================================================
    // DOWNLOAD FILE
    // ==================================================

    const downloadFile = async (
        type
    ) => {

        if (
            selectedModules.length === 0
        ) {

            toast.error(
                "Please select at least one module"
            );

            return;
        }

        const isPdf =
            type === "pdf";

        try {

            if (isPdf) {

                setDownloadingPdf(true);

            } else {

                setDownloadingExcel(true);

            }


            let url =
                `/reports/download/${type}?modules=${encodeURIComponent(
                    getModulesQuery()
                )}`;

            if (selectedBank) {

                url +=
                    `&bank_account_id=${selectedBank}`;

            }

            const response =
                await api.get(url, {
                    responseType: "blob",
                });


            const blob =
                new Blob(
                    [response.data],
                    {
                        type:
                            isPdf
                                ? "application/pdf"
                                :
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    }
                );


            const downloadUrl =
                window.URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement(
                    "a"
                );

            link.href =
                downloadUrl;

            link.download =
                isPdf
                    ? "BudgetBuddy_Financial_Report.pdf"
                    : "BudgetBuddy_Financial_Report.xlsx";

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            window.URL.revokeObjectURL(
                downloadUrl
            );


            toast.success(
                isPdf
                    ? "PDF report downloaded successfully"
                    : "Excel report downloaded successfully"
            );


            loadReportHistory();

        } catch (error) {

            console.error(
                "REPORT DOWNLOAD ERROR:",
                error.response?.data ||
                error
            );

            toast.error(
                isPdf
                    ? "Unable to download PDF report"
                    : "Unable to download Excel report"
            );

        } finally {

            setDownloadingPdf(false);

            setDownloadingExcel(false);

        }
    };


    // ==================================================
    // FORMAT MONEY
    // ==================================================

    const formatMoney = (value) => {

        return `₹${Number(
            value || 0
        ).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        )}`;
    };


    // ==================================================
    // FORMAT DATE
    // ==================================================

    const formatDateTime = (
        value
    ) => {

        if (!value) {
            return "-";
        }

        return new Date(
            value
        ).toLocaleString(
            "en-IN"
        );
    };


    // ==================================================
    // DELETE HISTORY
    // ==================================================

    const deleteReport = async (
        id
    ) => {

        try {

            await api.delete(
                `/reports/${id}`
            );

            toast.success(
                "Report deleted"
            );

            loadReportHistory();

        } catch (error) {

            toast.error(
                "Unable to delete report"
            );

        }
    };


    // ==================================================
    // TABLE COMPONENT
    // ==================================================

    const PreviewTable = ({
        title,
        headers,
        rows,
    }) => {

        return (
            <div
                style={{
                    marginBottom: "30px",
                }}
            >

                <h3
                    style={{
                        color: "#1e3a8a",
                        marginBottom: "12px",
                    }}
                >
                    {title}
                </h3>

                <div
                    style={{
                        overflowX: "auto",
                        border:
                            "1px solid #e5e7eb",
                        borderRadius: "8px",
                    }}
                >

                    <table
                        style={{
                            width: "100%",
                            borderCollapse:
                                "collapse",
                            minWidth: "700px",
                        }}
                    >

                        <thead>

                            <tr
                                style={{
                                    background:
                                        "#2563eb",
                                    color: "white",
                                }}
                            >

                                {headers.map(
                                    (
                                        header,
                                        index
                                    ) => (

                                        <th
                                            key={
                                                index
                                            }
                                            style={{
                                                padding:
                                                    "11px",
                                                textAlign:
                                                    "left",
                                                whiteSpace:
                                                    "nowrap",
                                            }}
                                        >
                                            {
                                                header
                                            }
                                        </th>

                                    )
                                )}

                            </tr>

                        </thead>

                        <tbody>

                            {rows.length ===
                            0 ? (

                                <tr>

                                    <td
                                        colSpan={
                                            headers.length
                                        }
                                        style={{
                                            padding:
                                                "20px",
                                            textAlign:
                                                "center",
                                            color:
                                                "#64748b",
                                        }}
                                    >
                                        No data available
                                    </td>

                                </tr>

                            ) : (

                                rows.map(
                                    (
                                        row,
                                        rowIndex
                                    ) => (

                                        <tr
                                            key={
                                                rowIndex
                                            }
                                            style={{
                                                borderBottom:
                                                    "1px solid #e5e7eb",
                                            }}
                                        >

                                            {row.map(
                                                (
                                                    value,
                                                    columnIndex
                                                ) => (

                                                    <td
                                                        key={
                                                            columnIndex
                                                        }
                                                        style={{
                                                            padding:
                                                                "10px",
                                                        }}
                                                    >
                                                        {
                                                            value
                                                        }
                                                    </td>

                                                )
                                            )}

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>
        );
    };


    // ==================================================
    // PREVIEW CONTENT
    // ==================================================

    const PreviewReport = () => {

        if (!preview) {
            return null;
        }

        const summary =
            preview.financial_summary;

        return (
            <div
                style={{
                    marginTop: "30px",
                    background: "white",
                    padding: "30px",
                    borderRadius: "12px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                }}
            >

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "15px",
                        marginBottom: "25px",
                    }}
                >

                    <div>

                        <h2
                            style={{
                                margin: 0,
                                color: "#1e3a8a",
                            }}
                        >
                            Report Preview
                        </h2>

                        <p
                            style={{
                                color:
                                    "#64748b",
                                marginBottom: 0,
                            }}
                        >
                            Report for:{" "}
                            <strong>
                                {
                                    preview.report_for
                                }
                            </strong>
                        </p>

                        <p
                            style={{
                                color:
                                    "#64748b",
                                marginTop:
                                    "5px",
                            }}
                        >
                            Generated on:{" "}
                            <strong>
                                {
                                    preview.generated_on
                                }
                            </strong>
                        </p>

                    </div>

                </div>


                {/* FINANCIAL SUMMARY */}

                {summary && (

                    <div
                        style={{
                            marginBottom:
                                "30px",
                        }}
                    >

                        <h3
                            style={{
                                color:
                                    "#1e3a8a",
                            }}
                        >
                            Financial Summary
                        </h3>

                        <div
                            style={{
                                display:
                                    "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(180px, 1fr))",
                                gap:
                                    "15px",
                            }}
                        >

                            <SummaryCard
                                title="Total Income"
                                value={formatMoney(
                                    summary[
                                        "Total Income"
                                    ]
                                )}
                            />

                            <SummaryCard
                                title="Total Expenses"
                                value={formatMoney(
                                    summary[
                                        "Total Expenses"
                                    ]
                                )}
                            />

                            <SummaryCard
                                title="Total Amount Saved"
                                value={formatMoney(
                                    summary[
                                        "Total Amount Saved"
                                    ]
                                )}
                            />

                            <SummaryCard
                                title="Balance"
                                value={formatMoney(
                                    summary.Balance
                                )}
                            />

                        </div>

                    </div>

                )}


                {/* INCOME TRANSACTIONS */}

                {preview.income_transactions && (

                    <PreviewTable
                        title="Income Transactions"
                        headers={[
                            "Date",
                            "Exact Time",
                            "Source",
                            "Category",
                            "Amount",
                            "Description",
                        ]}
                        rows={
                            preview.income_transactions.rows.map(
                                (row) => [
                                    row.Date,
                                    row["Exact Time"],
                                    row.Source,
                                    row.Category,
                                    formatMoney(
                                        row.Amount
                                    ),
                                    row.Description,
                                ]
                            )
                        }
                    />

                )}


                {/* EXPENSE TRANSACTIONS */}

                {preview.expense_transactions && (

                    <PreviewTable
                        title="Expense Transactions"
                        headers={[
                            "Date",
                            "Exact Time",
                            "Category",
                            "Payment Method",
                            "Amount",
                            "Description",
                        ]}
                        rows={
                            preview.expense_transactions.rows.map(
                                (row) => [
                                    row.Date,
                                    row["Exact Time"],
                                    row.Category,
                                    row["Payment Method"],
                                    formatMoney(
                                        row.Amount
                                    ),
                                    row.Description,
                                ]
                            )
                        }
                    />

                )}


                {/* INCOME CATEGORIES */}

                {preview.income_categories && (

                    <PreviewTable
                        title="Income Categories"
                        headers={[
                            "Category",
                            "Total Income",
                        ]}
                        rows={
                            preview.income_categories.rows.map(
                                (row) => [
                                    row.Category,
                                    formatMoney(
                                        row[
                                            "Total Income"
                                        ]
                                    ),
                                ]
                            )
                        }
                    />

                )}


                {/* EXPENSE CATEGORIES */}

                {preview.expense_categories && (

                    <PreviewTable
                        title="Expense Categories"
                        headers={[
                            "Category",
                            "Total Spent",
                        ]}
                        rows={
                            preview.expense_categories.rows.map(
                                (row) => [
                                    row.Category,
                                    formatMoney(
                                        row[
                                            "Total Spent"
                                        ]
                                    ),
                                ]
                            )
                        }
                    />

                )}


                {/* BUDGET */}

                {preview.budget_report && (

                    <PreviewTable
                        title="Budget Report"
                        headers={[
                            "Category",
                            "Month",
                            "Year",
                            "Limit",
                            "Spent",
                            "Remaining",
                            "Used %",
                        ]}
                        rows={
                            preview.budget_report.rows.map(
                                (row) => [
                                    row.Category,
                                    row.Month,
                                    row.Year,
                                    formatMoney(
                                        row.Limit
                                    ),
                                    formatMoney(
                                        row.Spent
                                    ),
                                    formatMoney(
                                        row.Remaining
                                    ),
                                    `${row["Percentage Used"]}%`,
                                ]
                            )
                        }
                    />

                )}


                {/* SAVINGS GOALS */}

                {preview.savings_goals && (

                    <PreviewTable
                        title="Savings Goals"
                        headers={[
                            "Goal",
                            "Target",
                            "Saved",
                            "Remaining",
                            "Progress",
                        ]}
                        rows={
                            preview.savings_goals.rows.map(
                                (row) => [
                                    row.Goal,
                                    formatMoney(
                                        row.Target
                                    ),
                                    formatMoney(
                                        row.Saved
                                    ),
                                    formatMoney(
                                        row.Remaining
                                    ),
                                    `${row.Progress}%`,
                                ]
                            )
                        }
                    />

                )}


                {/* SAVINGS TRANSACTIONS */}

                {preview.savings_transactions && (

                    <PreviewTable
                        title="Savings Transactions"
                        headers={[
                            "Date",
                            "Exact Time",
                            "Goal",
                            "Amount",
                        ]}
                        rows={
                            preview.savings_transactions.rows.map(
                                (row) => [
                                    row.Date,
                                    row["Exact Time"],
                                    row.Goal,
                                    formatMoney(
                                        row.Amount
                                    ),
                                ]
                            )
                        }
                    />

                )}


                {/* BANK DETAILS */}

                {preview.bank_account_details && (

                    <PreviewTable
                        title="Bank Account Details"
                        headers={[
                            "Bank",
                            "Account Holder",
                            "Account Number",
                            "IFSC",
                            "Type",
                            "Balance",
                        ]}
                        rows={
                            preview.bank_account_details.rows.map(
                                (row) => [
                                    row.Bank,
                                    row[
                                        "Account Holder"
                                    ],
                                    row[
                                        "Account Number"
                                    ],
                                    row.IFSC,
                                    row.Type,
                                    formatMoney(
                                        row.Balance
                                    ),
                                ]
                            )
                        }
                    />

                )}


                {/* DOWNLOAD BUTTONS */}

                <div
                    style={{
                        display: "flex",
                        gap: "15px",
                        flexWrap: "wrap",
                        marginTop: "25px",
                    }}
                >

                    <button
                        onClick={() =>
                            downloadFile("pdf")
                        }
                        disabled={
                            downloadingPdf ||
                            downloadingExcel
                        }
                        style={{
                            flex: 1,
                            minWidth:
                                "220px",
                            padding:
                                "13px",
                            border: "none",
                            borderRadius:
                                "8px",
                            background:
                                "#dc2626",
                            color: "white",
                            fontWeight:
                                "600",
                            cursor:
                                "pointer",
                        }}
                    >
                        {downloadingPdf
                            ? "Generating PDF..."
                            : "⬇ Download PDF"}
                    </button>


                    <button
                        onClick={() =>
                            downloadFile(
                                "excel"
                            )
                        }
                        disabled={
                            downloadingPdf ||
                            downloadingExcel
                        }
                        style={{
                            flex: 1,
                            minWidth:
                                "220px",
                            padding:
                                "13px",
                            border: "none",
                            borderRadius:
                                "8px",
                            background:
                                "#16a34a",
                            color: "white",
                            fontWeight:
                                "600",
                            cursor:
                                "pointer",
                        }}
                    >
                        {downloadingExcel
                            ? "Generating Excel..."
                            : "⬇ Download Excel"}
                    </button>

                </div>

            </div>
        );
    };


    // ==================================================
    // UI
    // ==================================================

    return (

        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                background:
                    "#f5f7fb",
            }}
        >

            <Sidebar />


            <div
                style={{
                    flex: 1,
                    padding: "20px",
                    boxSizing:
                        "border-box",
                }}
            >

                <Navbar />


                {/* HEADER */}

                <div
                    style={{
                        display:
                            "flex",
                        justifyContent:
                            "space-between",
                        alignItems:
                            "center",
                        marginTop:
                            "25px",
                        marginBottom:
                            "25px",
                        flexWrap:
                            "wrap",
                        gap:
                            "15px",
                    }}
                >

                    <div>

                        <h1
                            style={{
                                margin: 0,
                                color:
                                    "#111827",
                            }}
                        >
                            Financial Reports
                        </h1>

                        <p
                            style={{
                                color:
                                    "#64748b",
                            }}
                        >
                            Select your bank account
                            and the modules you want
                            in your report.
                        </p>

                    </div>


                    <button
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                        style={{
                            background:
                                "#64748b",
                            color:
                                "white",
                            border:
                                "none",
                            padding:
                                "10px 18px",
                            borderRadius:
                                "7px",
                            cursor:
                                "pointer",
                        }}
                    >
                        ← Back to Dashboard
                    </button>

                </div>


                {/* GENERATE CARD */}

                <div
                    style={{
                        background:
                            "white",
                        padding:
                            "30px",
                        borderRadius:
                            "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
                    }}
                >

                    <h2
                        style={{
                            marginTop: 0,
                            color:
                                "#1e3a8a",
                        }}
                    >
                        Generate Financial Report
                    </h2>


                    {/* BANK */}

                    <label
                        style={{
                            display:
                                "block",
                            fontWeight:
                                "600",
                            marginBottom:
                                "8px",
                        }}
                    >
                        Bank Account
                    </label>


                    <select
                        value={
                            selectedBank
                        }
                        onChange={(e) =>
                            setSelectedBank(
                                e.target.value
                            )
                        }
                        disabled={
                            loadingBanks
                        }
                        style={{
                            width:
                                "100%",
                            padding:
                                "12px",
                            border:
                                "1px solid #d1d5db",
                            borderRadius:
                                "7px",
                            fontSize:
                                "15px",
                            marginBottom:
                                "25px",
                        }}
                    >

                        <option value="">
                            All Bank Accounts
                        </option>

                        {banks.map(
                            (bank) => (

                                <option
                                    key={
                                        bank.id
                                    }
                                    value={
                                        bank.id
                                    }
                                >
                                    {
                                        bank.bank_name
                                    }{" "}
                                    - ****
                                    {String(
                                        bank.account_number
                                    ).slice(
                                        -4
                                    )}
                                </option>

                            )
                        )}

                    </select>


                    {/* SELECTED BANK */}

                    <div
                        style={{
                            background:
                                "#eff6ff",
                            border:
                                "1px solid #bfdbfe",
                            padding:
                                "15px",
                            borderRadius:
                                "8px",
                            marginBottom:
                                "25px",
                        }}
                    >

                        <strong>
                            Report for:
                        </strong>

                        <div
                            style={{
                                marginTop:
                                    "5px",
                                color:
                                    "#1e40af",
                            }}
                        >
                            {
                                getSelectedBankName()
                            }
                        </div>

                    </div>


                    {/* MODULE SELECTION */}

                    <div>

                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                                marginBottom:
                                    "15px",
                                flexWrap:
                                    "wrap",
                                gap:
                                    "10px",
                            }}
                        >

                            <h3
                                style={{
                                    margin:
                                        0,
                                }}
                            >
                                Select Report Modules
                            </h3>


                            <div
                                style={{
                                    display:
                                        "flex",
                                    gap:
                                        "8px",
                                }}
                            >

                                <button
                                    type="button"
                                    onClick={
                                        selectAllModules
                                    }
                                    style={{
                                        border:
                                            "1px solid #2563eb",
                                        background:
                                            "white",
                                        color:
                                            "#2563eb",
                                        padding:
                                            "7px 12px",
                                        borderRadius:
                                            "6px",
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    Select All
                                </button>


                                <button
                                    type="button"
                                    onClick={
                                        clearAllModules
                                    }
                                    style={{
                                        border:
                                            "1px solid #dc2626",
                                        background:
                                            "white",
                                        color:
                                            "#dc2626",
                                        padding:
                                            "7px 12px",
                                        borderRadius:
                                            "6px",
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    Clear All
                                </button>

                            </div>

                        </div>


                        <div
                            style={{
                                display:
                                    "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(250px, 1fr))",
                                gap:
                                    "12px",
                            }}
                        >

                            {modules.map(
                                (module) => (

                                    <label
                                        key={
                                            module.key
                                        }
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap:
                                                "10px",
                                            padding:
                                                "12px",
                                            border:
                                                "1px solid #e5e7eb",
                                            borderRadius:
                                                "8px",
                                            cursor:
                                                "pointer",
                                            background:
                                                selectedModules.includes(
                                                    module.key
                                                )
                                                    ? "#eff6ff"
                                                    : "white",
                                        }}
                                    >

                                        <input
                                            type="checkbox"
                                            checked={
                                                selectedModules.includes(
                                                    module.key
                                                )
                                            }
                                            onChange={() =>
                                                toggleModule(
                                                    module.key
                                                )
                                            }
                                            style={{
                                                width:
                                                    "18px",
                                                height:
                                                    "18px",
                                            }}
                                        />

                                        <span>
                                            {
                                                module.label
                                            }
                                        </span>

                                    </label>

                                )
                            )}

                        </div>

                    </div>


                    {/* PREVIEW BUTTON */}

                    <button
                        onClick={
                            handlePreview
                        }
                        disabled={
                            loadingPreview ||
                            selectedModules.length ===
                                0
                        }
                        style={{
                            width:
                                "100%",
                            marginTop:
                                "25px",
                            padding:
                                "14px",
                            border:
                                "none",
                            borderRadius:
                                "8px",
                            background:
                                loadingPreview
                                    ? "#94a3b8"
                                    : "#2563eb",
                            color:
                                "white",
                            fontSize:
                                "16px",
                            fontWeight:
                                "600",
                            cursor:
                                loadingPreview
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        {loadingPreview
                            ? "Generating Preview..."
                            : "👁 Preview Report"}
                    </button>

                </div>


                {/* PREVIEW */}

                <PreviewReport />


                {/* REPORT HISTORY */}

                <div
                    style={{
                        marginTop:
                            "30px",
                        background:
                            "white",
                        padding:
                            "30px",
                        borderRadius:
                            "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
                    }}
                >

                    <h2
                        style={{
                            marginTop:
                                0,
                            color:
                                "#1e3a8a",
                        }}
                    >
                        Report History
                    </h2>

                    <p
                        style={{
                            color:
                                "#64748b",
                        }}
                    >
                        Previously generated financial reports.
                    </p>


                    {loadingHistory ? (

                        <p>
                            Loading report history...
                        </p>

                    ) : reports.length === 0 ? (

                        <p
                            style={{
                                color:
                                    "#64748b",
                            }}
                        >
                            No reports generated yet.
                        </p>

                    ) : (

                        <div
                            style={{
                                overflowX:
                                    "auto",
                            }}
                        >

                            <table
                                style={{
                                    width:
                                        "100%",
                                    borderCollapse:
                                        "collapse",
                                }}
                            >

                                <thead>

                                    <tr
                                        style={{
                                            background:
                                                "#f1f5f9",
                                        }}
                                    >

                                        <th
                                            style={{
                                                padding:
                                                    "12px",
                                                textAlign:
                                                    "left",
                                            }}
                                        >
                                            Report
                                        </th>

                                        <th
                                            style={{
                                                padding:
                                                    "12px",
                                                textAlign:
                                                    "left",
                                            }}
                                        >
                                            Bank Account
                                        </th>

                                        <th
                                            style={{
                                                padding:
                                                    "12px",
                                                textAlign:
                                                    "left",
                                            }}
                                        >
                                            Generated On
                                        </th>

                                        <th
                                            style={{
                                                padding:
                                                    "12px",
                                                textAlign:
                                                    "center",
                                            }}
                                        >
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {reports.map(
                                        (report) => {

                                            const bank =
                                                banks.find(
                                                    (item) =>
                                                        String(
                                                            item.id
                                                        ) ===
                                                        String(
                                                            report.bank_account_id
                                                        )
                                                );

                                            return (

                                                <tr
                                                    key={
                                                        report.id
                                                    }
                                                    style={{
                                                        borderBottom:
                                                            "1px solid #e5e7eb",
                                                    }}
                                                >

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                        }}
                                                    >
                                                        {
                                                            report.report_type
                                                        }
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                        }}
                                                    >
                                                        {bank
                                                            ? `${bank.bank_name} - ****${String(
                                                                  bank.account_number
                                                              ).slice(
                                                                  -4
                                                              )}`
                                                            : "All Bank Accounts"}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                        }}
                                                    >
                                                        {formatDateTime(
                                                            report.generated_date
                                                        )}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                            textAlign:
                                                                "center",
                                                        }}
                                                    >

                                                        <button
                                                            onClick={() =>
                                                                deleteReport(
                                                                    report.id
                                                                )
                                                            }
                                                            style={{
                                                                background:
                                                                    "#fee2e2",
                                                                color:
                                                                    "#dc2626",
                                                                border:
                                                                    "none",
                                                                padding:
                                                                    "7px 12px",
                                                                borderRadius:
                                                                    "6px",
                                                                cursor:
                                                                    "pointer",
                                                            }}
                                                        >
                                                            Delete
                                                        </button>

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}


// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
    title,
    value,
}) {

    return (

        <div
            style={{
                background:
                    "#f8fafc",
                border:
                    "1px solid #e2e8f0",
                padding:
                    "18px",
                borderRadius:
                    "10px",
            }}
        >

            <div
                style={{
                    color:
                        "#64748b",
                    fontSize:
                        "14px",
                    marginBottom:
                        "7px",
                }}
            >
                {title}
            </div>

            <div
                style={{
                    fontSize:
                        "22px",
                    fontWeight:
                        "700",
                    color:
                        "#1e3a8a",
                }}
            >
                {value}
            </div>

        </div>

    );
}


export default Reports;