import { useEffect, useState, useRef } from "react";
import { Form, InputNumber, Input, Button, Spin, message } from "antd";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { getPaymentMethodByCountry } from "../../api/campaign";
import { updateOrder } from "../../api/order";
import currencyMap from "../../util/currencyMap";
import { getPayeeNames } from "../../api/payeeNames";

function UpdateOrderForm({ order, onUpdated }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [selectedPayee, setSelectedPayee] = useState(null); // payee name
    const [selectedPayeeId, setSelectedPayeeId] = useState(null);
    const firstAmountInputRef = useRef(null);

    const [totalAmount, setTotalAmount] = useState(0);
    const [totalDiscount, setTotalDiscount] = useState(0);

    useEffect(() => {
        if (!order) return;

        const country = order.country;
        async function loadPaymentMethods() {
            try {
                setLoadingPayment(true);
                const paymentMethods = await getPaymentMethodByCountry(country);

                if (typeof paymentMethods === "string") {
                    setPaymentMethod(["cash"]);
                    return;
                }

                setPaymentMethod(
                    Array.isArray(paymentMethods?.paymentMethod)
                        ? paymentMethods.paymentMethod
                        : ["cash"]
                );
            } catch (err) {
                message.error("Failed to load payment methods");
            } finally {
                setLoadingPayment(false);
            }
        }

        loadPaymentMethods();
    }, [order]);

    useEffect(() => {
        if (!order) return;

        const cashAmount = Number(order.cashAmount || 0);
        const checkAmount = Number(order.checkAmount || 0);
        const postalAmount = Number(order.postalAmount || 0);
        const discountAmount = Number(order.discountAmount || 0);

        setTotalAmount(cashAmount + checkAmount + postalAmount);
        setTotalDiscount(discountAmount);

        // Set payee name from order data
        if (order.payee) {
            setSelectedPayee(order.payee);
        }

        form.setFieldsValue({
            payments: {
                cash: { amount: cashAmount || null },
                check: { amount: checkAmount || null },
                postal: { amount: postalAmount || null },
                discount: discountAmount || null,
            },
        });
    }, [order, form]);

    useEffect(() => {
        if (firstAmountInputRef.current) {
            setTimeout(() => {
                firstAmountInputRef.current?.focus();
            }, 100);
        }
    }, [paymentMethod]);

    function getCurrencySymbol() {
        return currencyMap[order?.country?.toLowerCase()] || "";
    }

    // Derive brandId and country for payee filtering
    const brandIdForPayee = order?.brandId || null;
    const countryForPayee = order?.country || null;

    const updateTotals = (changedValues, allValues) => {
        if (changedValues.payments) {
            const cashAmount = allValues.payments?.cash?.amount || 0;
            const checkAmount = allValues.payments?.check?.amount || 0;
            const postalAmount = allValues.payments?.postal?.amount || 0;
            const discountAmount = allValues.payments?.discount || 0;

            const newTotalAmount = cashAmount + checkAmount + postalAmount;
            const newTotalDiscount = discountAmount;

            setTotalAmount(newTotalAmount);
            setTotalDiscount(newTotalDiscount);
        }
    };

    const handleSubmit = async (values) => {
        const cashAmount = values?.payments?.cash?.amount ?? 0;
        const checkAmount = values?.payments?.check?.amount ?? 0;
        const postalAmount = values?.payments?.postal?.amount ?? 0;
        const discountAmount = values?.payments?.discount ?? 0;

        const totalAmountValue = cashAmount + checkAmount + postalAmount;

        if (checkAmount > 0 && !selectedPayee) {
            message.warning("Please select a payee for the check payment");
            return;
        }

        const data = {
            cashAmount,
            checkAmount,
            postalAmount,
            amount: totalAmountValue,
            discountAmount,
            payee: checkAmount > 0 ? selectedPayee : null,
        };

        try {
            setLoading(true);
            const result = await updateOrder(order.id, data);

            if (typeof result === "string") {
                message.error(result);
                return;
            }

            message.success("Order updated successfully");
            if (onUpdated) onUpdated(result.newOrder || null);
        } catch (err) {
            message.error("Failed to update order");
        } finally {
            setLoading(false);
        }
    };

    return loadingPayment ? (
        <Spin size="large" />
    ) : (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={updateTotals}
        >
            <div style={{ marginBottom: 16 }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 8,
                        fontWeight: 600,
                        padding: "8px 0",
                    }}
                >
                    <div>Payment Type</div>
                    <div>Payee Name</div>
                    <div>Amount</div>
                </div>

                {paymentMethod?.includes("cash") ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 8,
                            alignItems: "center",
                            padding: "8px 0",
                            borderTop: "1px solid #f0f0f0",
                        }}
                    >
                        <div>Cash</div>
                        <div>
                            <Input disabled placeholder="N/A" size="large" />
                        </div>
                        <div>
                            <Form.Item
                                name={["payments", "cash", "amount"]}
                                rules={[
                                    {
                                        type: "number",
                                        min: 0,
                                        message: "Must be >= 0",
                                    },
                                ]}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber
                                    ref={firstAmountInputRef}
                                    style={{ width: "100%" }}
                                    placeholder="Enter amount"
                                    prefix={getCurrencySymbol()}
                                    min={0}
                                    size="large"
                                />
                            </Form.Item>
                        </div>
                    </div>
                ) : null}

                {paymentMethod?.includes("check") ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 8,
                            alignItems: "center",
                            padding: "8px 0",
                            borderTop: "1px solid #f0f0f0",
                        }}
                    >
                        <div>Check</div>
                        <div>
                            <DynamicDropdownMenu
                                onSelect={(value) => {
                                    setSelectedPayeeId(value?.id || null);
                                    setSelectedPayee(value?.name || null);
                                }}
                                selectedValue={selectedPayeeId}
                                placeholder={
                                    selectedPayee || "Select payee name"
                                }
                                disabled={loading}
                                fetchFunction={async (
                                    page,
                                    rowsPerPage,
                                    passedFilter
                                ) => {
                                    const baseFilters = {};

                                    if (brandIdForPayee) {
                                        baseFilters.brandId = [
                                            { eq: brandIdForPayee },
                                        ];
                                    }

                                    const mergedFilters = {
                                        ...(baseFilters || {}),
                                        ...(passedFilter || {}),
                                    };

                                    return getPayeeNames(
                                        page,
                                        rowsPerPage,
                                        mergedFilters
                                    ).then((result) => ({
                                        pagination: result?.pagination || {},
                                        data: result?.data || [],
                                    }));
                                }}
                                searchBy="name"
                                setOptions={(data) =>
                                    data.map((p) => ({
                                        value: p.id,
                                        label: p.name || `Payee ${p.id}`,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Form.Item
                                name={["payments", "check", "amount"]}
                                rules={[
                                    {
                                        type: "number",
                                        min: 0,
                                        message: "Must be >= 0",
                                    },
                                ]}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    placeholder="Enter amount"
                                    prefix={getCurrencySymbol()}
                                    min={0}
                                    size="large"
                                />
                            </Form.Item>
                        </div>
                    </div>
                ) : null}

                {paymentMethod?.includes("postal") ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 8,
                            alignItems: "center",
                            padding: "8px 0",
                            borderTop: "1px solid #f0f0f0",
                        }}
                    >
                        <div>Postal</div>
                        <div>
                            <Input disabled placeholder="N/A" size="large" />
                        </div>
                        <div>
                            <Form.Item
                                name={["payments", "postal", "amount"]}
                                rules={[
                                    {
                                        type: "number",
                                        min: 0,
                                        message: "Must be >= 0",
                                    },
                                ]}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    placeholder="Enter amount"
                                    prefix={getCurrencySymbol()}
                                    min={0}
                                    size="large"
                                />
                            </Form.Item>
                        </div>
                    </div>
                ) : null}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 8,
                        alignItems: "center",
                        padding: "8px 0",
                        borderTop: "2px solid #d9d9d9",
                        marginTop: "8px",
                    }}
                >
                    <div style={{ fontWeight: "bold" }}>Discount</div>
                    <div></div>
                    <div>
                        <Form.Item
                            name={["payments", "discount"]}
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    message: "Must be >= 0",
                                },
                            ]}
                            style={{ marginBottom: 0 }}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder="Enter discount"
                                prefix={getCurrencySymbol()}
                                min={0}
                                size="large"
                            />
                        </Form.Item>
                    </div>
                </div>

                <div
                    style={{
                        padding: "16px 0",
                        borderTop: "2px solid #d9d9d9",
                        marginTop: "16px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                            fontSize: "16px",
                        }}
                    >
                        <span style={{ fontWeight: "bold" }}>
                            Total Amount:
                        </span>
                        <span style={{ fontWeight: "bold" }}>
                            {getCurrencySymbol()}
                            {totalAmount.toFixed(2)}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "14px",
                            color: "#52c41a",
                        }}
                    >
                        <span>Discount:</span>
                        <span>
                            -{getCurrencySymbol()}
                            {totalDiscount.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    style={{ width: "100%" }}
                >
                    {loading ? <Spin /> : "Update Order"}
                </Button>
            </Form.Item>
        </Form>
    );
}

export default UpdateOrderForm;
