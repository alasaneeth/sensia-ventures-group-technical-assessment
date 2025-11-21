function OrderResult({
    currency,
    totalRequired,
    totalDiscount,
    totalPaid,
    remainingBalance
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-evenly",
                gap: 8,
                padding: "16px 0",
                marginTop: "8px",
                borderBottom: "1px solid #f0f0f0",
                backgroundColor: "#f0f7ff",
                fontWeight: "bold",
                borderRadius: "4px",
            }}
        >
            <div>
                <div style={{ marginBottom: 4 }}>
                    <span style={{ color: "#666" }}>Required:</span>
                </div>
                <div style={{ fontSize: "16px", color: "#1890ff" }}>
                    {currency}
                    {totalRequired.toFixed(2)}
                </div>
            </div>
            <div>
                <div style={{ marginBottom: 4 }}>
                    <span style={{ color: "#666" }}>Total Paid:</span>
                    {totalDiscount > 0 && (
                        <span style={{ color: "#52c41a", marginLeft: 4 }}>
                            (-{currency}
                            {totalDiscount.toFixed(2)} discount)
                        </span>
                    )}
                </div>
                <div style={{ fontSize: "16px", color: "#52c41a" }}>
                    {currency}
                    {totalPaid.toFixed(2)}
                </div>
            </div>
            <div>
                <div style={{ marginBottom: 4 }}>
                    <span style={{ color: "#666" }}>Balance:</span>
                    <span style={{ marginLeft: 4, fontSize: "12px" }}>
                        {remainingBalance === 0
                            ? "✓ Exact"
                            : remainingBalance < 0
                            ? "✓ Overpaid"
                            : "⚠️ Underpaid"}
                    </span>
                </div>
                <div
                    style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color:
                            remainingBalance < 0
                                ? "#52c41a"
                                : remainingBalance > 0
                                ? "#f5222d"
                                : "#1890ff",
                    }}
                >
                    {currency}
                    {Math.abs(remainingBalance).toFixed(2)}
                    {remainingBalance < 0
                        ? " (change)"
                        : remainingBalance > 0
                        ? " (due)"
                        : ""}
                </div>
            </div>
        </div>
    );
}

export default OrderResult;
