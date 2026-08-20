import { useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import BankAccountForm from "../components/bank/BankAccountForm";
import BankAccountList from "../components/bank/BankAccountList";

function Banks() {

    const [refresh, setRefresh] = useState(false);

    const reloadBanks = () => {
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
                    Bank Accounts
                </h1>

                <BankAccountForm
                    refresh={reloadBanks}
                />

                <BankAccountList
                    refresh={refresh}
                />

            </div>

        </div>
    );
}

export default Banks;