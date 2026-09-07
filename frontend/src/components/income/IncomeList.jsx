import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import { FaEdit, FaTrash } from "react-icons/fa";
import EditIncomeModal from "./EditIncomeModal";


function IncomeList({ refresh }) {

    const [income, setIncome] = useState([]);
    const [filteredIncome, setFilteredIncome] = useState([]);

    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState("all");

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [selectedIncome, setSelectedIncome] = useState(null);


    // ==========================================
    // LOAD BANK ACCOUNTS
    // ==========================================

    const fetchBanks = async () => {

        try {

            const response = await api.get("/banks");

            const bankList = Array.isArray(response.data)
                ? response.data
                : [];

            setBanks(bankList);

        } catch (error) {

            console.log(
                "BANK LOAD ERROR:",
                error
            );

            toast.error(
                "Unable to load bank accounts"
            );
        }
    };


    // ==========================================
    // LOAD INCOME
    // ==========================================

    const fetchIncome = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const response = await api.get(
                "/income",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            setIncome(response.data);

        } catch (error) {

            console.log(
                "INCOME LOAD ERROR:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to load income"
            );
        }

    };


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {

        fetchIncome();
        fetchBanks();

    }, [refresh]);


    // ==========================================
    // FILTER INCOME
    // ==========================================

    useEffect(() => {

        const keyword =
            search.toLowerCase();

        const result = income.filter((item) => {

            // -------------------------------
            // BANK FILTER
            // -------------------------------

            const matchesBank =
                selectedBank === "all" ||
                String(item.bank_account_id) ===
                String(selectedBank);


            // -------------------------------
            // SEARCH FILTER
            // -------------------------------

            const source =
                item.source?.toLowerCase() || "";

            const category =
                item.category?.toLowerCase() || "";

            const description =
                item.description?.toLowerCase() || "";

            const matchesSearch =
                source.includes(keyword) ||
                category.includes(keyword) ||
                description.includes(keyword);


            return (
                matchesBank &&
                matchesSearch
            );
        });

        setFilteredIncome(result);

    }, [
        income,
        search,
        selectedBank
    ]);


    // ==========================================
    // CHECK OPENING BALANCE
    // ==========================================

    const isOpeningBalance = (item) => {

        return (
            item.source ===
                "Bank Account Opening Balance"
            ||
            item.category ===
                "Opening Balance"
        );
    };


    // ==========================================
    // DELETE INCOME
    // ==========================================

    const deleteIncome = async (id) => {

        if (
            !window.confirm(
                "Delete this income?"
            )
        ) {
            return;
        }

        try {

            const token =
                localStorage.getItem("token");

            await api.delete(
                `/income/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            toast.success(
                "Income Deleted"
            );

            fetchIncome();

        } catch (error) {

            console.log(
                "DELETE INCOME ERROR:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to delete"
            );
        }
    };


    // ==========================================
    // EDIT INCOME
    // ==========================================

    const editIncome = (item) => {

        // Opening balance cannot be edited
        if (isOpeningBalance(item)) {

            toast.info(
                "Opening Balance cannot be modified."
            );

            return;
        }

        setSelectedIncome(item);
        setShowModal(true);

    };


    // ==========================================
    // TOTAL INCOME
    // ==========================================

    const totalIncome =
        filteredIncome.reduce(
            (sum, item) =>
                sum + Number(item.amount),
            0
        );


    // ==========================================
    // GET SELECTED BANK NAME
    // ==========================================

    const selectedBankObject =
        banks.find(
            (bank) =>
                String(bank.id) ===
                String(selectedBank)
        );


    return (
        <>

            {/* =====================================
                BANK FILTER
            ====================================== */}

            <div
                style={{
                    background: "#fff",
                    padding: "15px",
                    borderRadius: "10px",
                    marginBottom: "20px",
                    boxShadow:
                        "0 2px 8px rgba(0,0,0,0.08)",
                }}
            >

                <label
                    style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "8px",
                    }}
                >
                    Bank Account
                </label>

                <select
                    value={selectedBank}
                    onChange={(e) =>
                        setSelectedBank(
                            e.target.value
                        )
                    }
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "7px",
                        border:
                            "1px solid #ccc",
                        boxSizing: "border-box",
                    }}
                >

                    <option value="all">
                        All Accounts
                    </option>

                    {banks.map((bank) => (

                        <option
                            key={bank.id}
                            value={bank.id}
                        >

                            {bank.bank_name}

                            {bank.account_number
                                ? ` - ****${String(
                                      bank.account_number
                                  ).slice(-4)}`
                                : ""}

                            {bank.is_primary
                                ? " (Primary)"
                                : ""}

                        </option>

                    ))}

                </select>

            </div>


            {/* =====================================
                SELECTED BANK TITLE
            ====================================== */}

            {selectedBank !== "all" &&
                selectedBankObject && (

                    <h3
                        style={{
                            marginBottom: "15px",
                        }}
                    >
                        Income History -{" "}
                        {selectedBankObject.bank_name}
                    </h3>

                )}


            {/* =====================================
                TOTAL INCOME
            ====================================== */}

            <div
                style={{
                    background: "#3949db",
                    color: "white",
                    padding: "20px",
                    borderRadius: "10px",
                    marginBottom: "20px",
                    fontSize: "22px",
                    fontWeight: "bold",
                }}
            >

                Total Income : ₹{" "}
                {totalIncome.toLocaleString(
                    "en-IN"
                )}

            </div>


            {/* =====================================
                SEARCH
            ====================================== */}

            <input
                type="text"
                placeholder="Search Income..."
                value={search}
                onChange={(e) =>
                    setSearch(e.target.value)
                }
                style={{
                    width: "100%",
                    padding: "12px",
                    marginBottom: "20px",
                    borderRadius: "8px",
                    border:
                        "1px solid #ccc",
                    boxSizing: "border-box",
                }}
            />


            {/* =====================================
                TABLE
            ====================================== */}

            <div
                style={{
                    overflowX: "auto",
                }}
            >

                <table
                    style={{
                        width: "100%",
                        borderCollapse:
                            "collapse",
                        background: "white",
                    }}
                >

                    <thead>

                        <tr
                            style={{
                                background:
                                    "#3949db",
                                color: "white",
                            }}
                        >

                            <th
                                style={{
                                    padding: "12px",
                                }}
                            >
                                Source
                            </th>

                            <th>
                                Category
                            </th>

                            <th>
                                Amount
                            </th>

                            <th>
                                Description
                            </th>

                            <th>
                                Date
                            </th>

                            <th>
                                Action
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {filteredIncome.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="6"
                                    style={{
                                        padding:
                                            "30px",
                                        textAlign:
                                            "center",
                                        color:
                                            "#777",
                                    }}
                                >
                                    No income found
                                    for this bank.
                                </td>

                            </tr>

                        ) : (

                            filteredIncome.map(
                                (item) => {

                                    const openingBalance =
                                        isOpeningBalance(
                                            item
                                        );

                                    return (

                                        <tr
                                            key={item.id}
                                            style={{
                                                textAlign:
                                                    "center",
                                                borderBottom:
                                                    "1px solid #ddd",
                                            }}
                                        >

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                    fontWeight:
                                                        openingBalance
                                                            ? "600"
                                                            : "normal",
                                                }}
                                            >

                                                {item.source}

                                            </td>


                                            <td>

                                                {item.category}

                                            </td>


                                            <td
                                                style={{
                                                    color:
                                                        "#16a34a",
                                                    fontWeight:
                                                        "600",
                                                }}
                                            >

                                                ₹{" "}

                                                {Number(
                                                    item.amount
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}

                                            </td>


                                            <td>

                                                {item.description ||
                                                    "-"}

                                            </td>


                                            <td>

                                                {item.date}

                                            </td>


                                            <td>

                                                {openingBalance ? (

                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-block",
                                                            padding:
                                                                "7px 12px",
                                                            borderRadius:
                                                                "6px",
                                                            background:
                                                                "#f1f5f9",
                                                            color:
                                                                "#64748b",
                                                            fontSize:
                                                                "13px",
                                                            fontWeight:
                                                                "600",
                                                        }}
                                                    >
                                                        🔒 Locked
                                                    </span>

                                                ) : (

                                                    <>

                                                        <button
                                                            onClick={() =>
                                                                editIncome(
                                                                    item
                                                                )
                                                            }
                                                            style={{
                                                                background:
                                                                    "#ffc107",
                                                                border:
                                                                    "none",
                                                                padding:
                                                                    "8px",
                                                                marginRight:
                                                                    "10px",
                                                                cursor:
                                                                    "pointer",
                                                                borderRadius:
                                                                    "5px",
                                                            }}
                                                        >
                                                            <FaEdit />
                                                        </button>


                                                        <button
                                                            onClick={() =>
                                                                deleteIncome(
                                                                    item.id
                                                                )
                                                            }
                                                            style={{
                                                                background:
                                                                    "#dc3545",
                                                                color:
                                                                    "white",
                                                                border:
                                                                    "none",
                                                                padding:
                                                                    "8px",
                                                                cursor:
                                                                    "pointer",
                                                                borderRadius:
                                                                    "5px",
                                                            }}
                                                        >
                                                            <FaTrash />
                                                        </button>

                                                    </>

                                                )}

                                            </td>

                                        </tr>

                                    );

                                }
                            )

                        )}

                    </tbody>

                </table>

            </div>


            {/* =====================================
                EDIT MODAL
            ====================================== */}

            <EditIncomeModal
                show={showModal}
                income={selectedIncome}
                onClose={() =>
                    setShowModal(false)
                }
                refresh={fetchIncome}
            />

        </>
    );
}


export default IncomeList;