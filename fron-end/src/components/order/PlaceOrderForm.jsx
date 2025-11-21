import { useEffect, useRef, useState } from "react";
import {
    Card,
    Form,
    InputNumber,
    Button,
    Typography,
    Descriptions,
    message,
    Spin,
    Select,
    Input,
    Modal,
    Divider,
    Alert,
} from "antd";
import {
    DollarOutlined,
    UserOutlined,
    ShoppingOutlined,
    CalendarOutlined,
} from "@ant-design/icons";
import { placeOrder, placeOrderNotSelected } from "../../api/order";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import currencyMap from "../../util/currencyMap";
import OrderResult from "./OrderResult";
import { fetchPayeeName } from "../../api/campaign";
import { getPayeeNames } from "../../api/payeeNames";
const { Title, Text } = Typography;

/**
 * PlaceOrderForm - Form component for placing an order
 * @param {Object} props
 * @param {Object} props.clientOffer - Client offer data (can be from direct code search or manual client selection)
 * @param {string} props.offerCode - Offer code
 * @param {Function} props.onOrderPlaced - Callback when order is placed
 * @param {boolean} props.madeUpdate - Whether an update for user data has been made
 * @param {Array} props.selectedSkus - Array of selected SKU IDs
 * @param {Array} props.selectedSkuRows - Array of selected SKU objects
 */
function PlaceOrderForm({
    clientOffer,
    offerCode,
    offerDetails,
    onOrderPlaced,
    clientOfferData,
    paymentMethod,
    madeUpdate,
    selectedSkus = [],
    selectedSkuRows = [],
    selectedClient,
    offerLetter,
    selectedCampaign,
    payeeRefreshTrigger = 0, // Add this prop to trigger payee dropdown refresh
}) {
    console.log(
        "\n##### [here] campaiogn id ###########\n",
        clientOfferData,
        "\n################\n"
    );
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState("USD");
    const [selectedPayee, setSelectedPayee] = useState(null); // payee name
    const [selectedPayeeId, setSelectedPayeeId] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingFormValues, setPendingFormValues] = useState(null);
    const [confirmForm] = Form.useForm();
    const yesButtonRef = useRef(null);
    const firstAmountInputRef = useRef(null);

    // Focus on Yes button when modal opens
    useEffect(() => {
        if (showConfirmModal && yesButtonRef.current) {
            setTimeout(() => {
                yesButtonRef.current?.focus();
            }, 0);
        }
    }, [showConfirmModal]);

    // Focus on first amount input when component mounts or payment method changes
    useEffect(() => {
        if (firstAmountInputRef.current) {
            setTimeout(() => {
                firstAmountInputRef.current?.focus();
            }, 100);
        }
    }, [paymentMethod]);

    // Fetch payee name when campaign and offer are available
    useEffect(() => {
        fetchPayeeName(selectedCampaign, offerDetails?.id, (name) => {
            setSelectedPayee(name);
            // id is unknown from this helper, keep previously selected id
        });
    }, [selectedCampaign, offerDetails?.id]);

    console.log(
        "\n######### [selected] #######\n",
        selectedCampaign,
        "\n################\n"
    );
    // State to track payment totals
    const [totalAmount, setTotalAmount] = useState(0);
    const [totalDiscount, setTotalDiscount] = useState(0);

    // Determine if we have a complete client offer object or just a client object (if there is no selectd client meaning it's a client offer)
    const isCompleteClientOffer = Boolean(clientOffer);

    console.log(
        "\n#######client offer#########\n",
        clientOffer,
        "\n################\n"
    );
    console.log(
        "\n#######selected client#########\n",
        selectedClient,
        "\n################\n"
    );

    // Get currency symbol based on currency code
    function getCurrencySymbol() {
        return currencyMap[offerDetails?.country?.toLowerCase()] || "$";
    }

    // Derive brandId and country for payee filtering
    const brandIdForPayee = isCompleteClientOffer
        ? clientOffer?.campaign?.brandId || clientOffer?.brandId || null
        : clientOfferData?.brandId || selectedClient?.brandId || null;

    const countryForPayee =
        offerDetails?.country ||
        clientOffer?.client?.country ||
        selectedClient?.country ||
        null;

    // No longer calculating from SKUs - amount comes from user input
    console.log(
        "\n######## selceted offer ########\n",
        offerDetails,
        "\n################\n"
    );

    // Update totals when form values change
    const updateTotals = (changedValues, allValues) => {
        if (changedValues.payments) {
            const cashAmount = allValues.payments?.cash?.amount || 0;
            const cashDiscount = allValues.payments?.cash?.discount || 0;
            const checkAmount = allValues.payments?.check?.amount || 0;
            const checkDiscount = allValues.payments?.check?.discount || 0;
            const postalAmount = allValues.payments?.postal?.amount || 0;
            const postalDiscount = allValues.payments?.postal?.discount || 0;

            const newTotalAmount = cashAmount + checkAmount + postalAmount;
            const newTotalDiscount =
                cashDiscount + checkDiscount + postalDiscount;

            setTotalAmount(newTotalAmount);
            setTotalDiscount(newTotalDiscount);
        }
    };

    async function handleSubmit(values) {
        // Show confirmation modal instead of submitting directly
        setPendingFormValues(values);
        setShowConfirmModal(true);
    }

    async function confirmSubmitOrder() {
        if (!pendingFormValues) return;

        setShowConfirmModal(false);
        setLoading(true);
        try {
            // Validate campaign exists
            if (!selectedCampaign) {
                message.warning(
                    "No campaign exists for this offer. Please select a valid campaign."
                );
                setLoading(false);
                return;
            }

            // Derive payment data from table inputs, converting null/undefined to 0
            const cashAmount = pendingFormValues?.payments?.cash?.amount ?? 0;
            const cashDiscount =
                pendingFormValues?.payments?.cash?.discount ?? 0;
            const checkAmount = pendingFormValues?.payments?.check?.amount ?? 0;
            const checkDiscount =
                pendingFormValues?.payments?.check?.discount ?? 0;
            const postalAmount =
                pendingFormValues?.payments?.postal?.amount ?? 0;
            const postalDiscount =
                pendingFormValues?.payments?.postal?.discount ?? 0;

            // Calculate totals
            const totalAmountValue = cashAmount + checkAmount + postalAmount;
            const totalDiscountAmount =
                cashDiscount + checkDiscount + postalDiscount;

            // Validations
            // if (totalAmountValue <= 0) {
            //     message.warning(
            //         "Please enter a cash or check amount greater than 0"
            //     );
            //     setLoading(false);
            //     return;
            // }

            if (checkAmount > 0 && !selectedPayee) {
                message.warning("Please select a payee for the check payment");
                setLoading(false);
                return;
            }

            // Prepare order data
            let orderData = {
                // Payment details
                cashAmount: cashAmount,
                checkAmount: checkAmount,
                postalAmount: postalAmount,

                // Amount is the sum of cash, check, and postal
                amount: totalAmountValue,
                discountAmount: totalDiscountAmount,
                // Only include payee if check amount is greater than 0, otherwise null
                payee: checkAmount > 0 ? selectedPayee : null,

                // SKU information
                skus: selectedSkus,
                skuDetails: selectedSkuRows,
                currency: getCurrencySymbol(),
            };

            console.log(
                "\n######## selected offer with campaign and chain ########\n",
                clientOfferData,
                "\n################\n"
            );
            if (isCompleteClientOffer) {
                // If we have a complete client offer object (from direct code search)
                orderData = {
                    ...orderData,
                    clientOfferId: clientOffer.id,
                    offerCode: offerCode,
                };
            } else {
                // If we have just a client object (from manual selection)
                orderData = {
                    ...orderData,
                    clientId: selectedClient.id,
                    chainId: offerDetails.campaign?.chainId,
                    offerId: offerDetails.id || null,
                    campaignId: offerDetails?.campaign?.id || null,
                };
            }

            console.log(
                "\n######### [try] #######\n",
                orderData,
                "\n################\n"
            );
            console.log(
                "\n######### [isCompleteClientOffer] #######\n",
                isCompleteClientOffer,
                "\n################\n"
            );

            let response = null;
            if (isCompleteClientOffer) {
                console.log("SEnding ", orderData);
                response = await placeOrder(orderData);
            } else {
                response = await placeOrderNotSelected(orderData);
            }
            console.log("No way !");

            if (typeof response === "string") {
                message.error(response);
                return;
            }

            message.success("Order placed successfully!");
            form.resetFields();
            onOrderPlaced();
        } catch (error) {
            console.error("Error placing order:", error);
            message.error("Failed to place order");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Form
                // style={{ flexBasis: "100%", height: "63dvh", overflow: "auto" }}
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={updateTotals}
                initialValues={{
                    payments: {
                        cash: { amount: null, discount: null },
                        check: { amount: null, discount: null },
                        postal: { amount: null, discount: null },
                    },
                    payee: "",
                    // Add chainId and offerId for manual client selection
                    ...(isCompleteClientOffer
                        ? {}
                        : {
                              chainId: clientOfferData?.chainId,
                              offerId: clientOfferData?.offerId,
                          }),
                }}
            >
                {/* Hidden fields for chainId and offerId when manually selecting a client */}
                {!isCompleteClientOffer && (
                    <>
                        <Form.Item name="chainId" hidden>
                            <input type="hidden" />
                        </Form.Item>
                        <Form.Item name="offerId" hidden>
                            <input type="hidden" />
                        </Form.Item>
                    </>
                )}

                {/* Warning if no campaign exists */}
                {!selectedCampaign && (
                    <Alert
                        message="No Campaign Selected"
                        description="No campaign exists for this offer. Please select a valid campaign before placing an order."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                {/* Payment breakdown table */}
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

                    {/* Row 1: Cash */}
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
                                <Input
                                    autoFocus
                                    disabled
                                    placeholder="N/A"
                                    size="large"
                                />
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
                                        prefix={getCurrencySymbol(
                                            selectedCurrency
                                        )}
                                        // precision={2}
                                        min={0}
                                        size="large"
                                    />
                                </Form.Item>
                            </div>
                        </div>
                    ) : null}

                    {/* Row 2: Check */}
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
                                    placeholder="Select payee name"
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
                                            pagination:
                                                result?.pagination || {},
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
                                        prefix={getCurrencySymbol(
                                            selectedCurrency
                                        )}
                                        // precision={2}
                                        min={0}
                                        size="large"
                                    />
                                </Form.Item>
                            </div>
                        </div>
                    ) : null}

                    {/* Row 3: Postal */}
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
                                <Input
                                    disabled
                                    placeholder="N/A"
                                    size="large"
                                />
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
                                        prefix={getCurrencySymbol(
                                            selectedCurrency
                                        )}
                                        // precision={2}
                                        min={0}
                                        size="large"
                                    />
                                </Form.Item>
                            </div>
                        </div>
                    ) : null}

                    {/* Single Discount Row - appears after last payment method */}
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
                                name={[
                                    "payments",
                                    paymentMethod?.includes("check")
                                        ? "check"
                                        : "cash",
                                    "discount",
                                ]}
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
                                    prefix={getCurrencySymbol(selectedCurrency)}
                                    // precision={2}
                                    min={0}
                                    size="large"
                                />
                            </Form.Item>
                        </div>
                    </div>

                    {/* Totals Display */}
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
                                {getCurrencySymbol(selectedCurrency)}
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
                                -{getCurrencySymbol(selectedCurrency)}
                                {totalDiscount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Removed standalone Amount/Discount/Payee fields in favor of the table above */}
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        size="large"
                        style={{ width: "100%" }}
                    >
                        {loading ? <Spin /> : "Place Order"}
                    </Button>
                </Form.Item>
            </Form>

            {/* Confirmation Modal */}
            <Modal
                title="Confirm Order"
                open={showConfirmModal}
                onCancel={() => setShowConfirmModal(false)}
                footer={null}
                centered
            >
                <>
                    <p style={{ marginBottom: "24px" }}>
                        Are you sure you want to place the order?
                    </p>
                    <Form
                        layout="horizontal"
                        onFinish={(e) => {
                            e.preventDefault();
                            confirmSubmitOrder();
                        }}
                        onReset={(e) => {
                            e.preventDefault();
                            setShowConfirmModal(false);
                        }}
                    >
                        <Form.Item
                            style={{
                                marginBottom: 0,
                                display: "flex",
                                gap: "8px",
                                justifyContent: "flex-end",
                            }}
                        >
                            <Button
                                ref={yesButtonRef}
                                type="primary"
                                htmlType="submit"
                                onClick={(e) => {
                                    e.preventDefault();
                                    confirmSubmitOrder();
                                }}
                            >
                                Yes
                            </Button>
                            <Divider type="vertical" />
                            <Button
                                htmlType="reset"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                No
                            </Button>
                        </Form.Item>
                    </Form>
                </>
            </Modal>
        </>
    );
}

export default PlaceOrderForm;
