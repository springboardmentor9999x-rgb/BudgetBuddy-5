import {
    FaCheckCircle,
    FaTimesCircle,
} from "react-icons/fa";

function PasswordStrength({ password }) {

    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };

    const passed = Object.values(checks).filter(Boolean).length;

    let color = "#ef4444";
    let text = "Weak";

    if (passed >= 3) {
        color = "#f59e0b";
        text = "Medium";
    }

    if (passed === 5) {
        color = "#2609b8";
        text = "Strong";
    }

    return (
        <div style={{ marginTop: "12px" }}>

            {/* Progress Bar */}
            <div
                style={{
                    width: "100%",
                    height: "8px",
                    background: "#eaedf3",
                    borderRadius: "50px",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${passed * 20}%`,
                        height: "100%",
                        background: color,
                        transition: "0.3s",
                    }}
                />
            </div>

            {/* Strength */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    marginBottom: "12px",
                }}
            >
                <span
                    style={{
                        color,
                        fontWeight: "bold",
                    }}
                >
                    {text}
                </span>

                <span
                    style={{
                        color: "#666",
                        fontSize: "11px",
                    }}
                >
                    {passed}/5
                </span>
            </div>

            {/* Compact Password Rules */}
           {/* Password Rules */}
<div
    style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        marginTop: "10px",
        fontSize: "10px",
        fontWeight: "500",
        gap: "4px",
    }}
>
    <span style={{ color: checks.length ? "#2609b8" : "#ef4444" }}>
        {checks.length ? "●" : "○"} 8+
    </span>

    <span style={{ color: checks.uppercase ? "#2609b8" : "#ef4444" }}>
        {checks.uppercase ? "●" : "○"} A-Z
    </span>

    <span style={{ color: checks.lowercase ? "#2609b8" : "#ef4444" }}>
        {checks.lowercase ? "●" : "○"} a-z
    </span>

    <span style={{ color: checks.number ? "#2609b8" : "#ef4444" }}>
        {checks.number ? "●" : "○"} 0-9
    </span>

    <span style={{ color: checks.special ? "#2609b8" : "#ef4444" }}>
        {checks.special ? "●" : "○"} !@#
    </span>
</div>
        </div>
    );
}
export default PasswordStrength;