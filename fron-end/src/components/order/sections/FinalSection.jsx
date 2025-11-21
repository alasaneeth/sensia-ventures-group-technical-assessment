import {
    Card,
    Col,
    Row,
    Divider,
    Input,
    Button,
    Tag,
    message,
    Spin,
    Modal,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import OfferSkusTable from "../../skusv1/OfferSkusTable";
import ClientDetails from "../../clients/ClientDetails";
import OrderSummary from "./OrderSummary";
import PlaceOrderForm from "../PlaceOrderForm";
import ClientComments from "../../comments/ClientComments";

import OfferTable from "../../offers/OfferTable";
import OfferLetter from "../../offers/OfferLetter";
import { useEffect, useMemo, useState, useRef } from "react";
import { getPaymentMethodByCountry } from "../../../api/campaign";
import { sendOfferLetter } from "../../../api/offer";
import { createPayeeName } from "../../../api/payeeNames";

const { Search } = Input;

/**
 * SkuSelectionSection component for displaying SKUs and handling SKU selection in a 2x2 grid layout
 *
 * @param {Object} props
 * @param {Object} props.clientOffer - Client offer data
 * @param {Object} props.selectedClient - Selected client data (used as fallback)
 * @param {Object} props.selectedChain - Selected chain data (used as fallback)
 * @param {Object} props.selectedOffer - Selected offer data (used as fallback)
 * @param {Object} props.offerDetails - Offer details with SKUs
 * @param {Array} props.selectedSkus - Selected SKU IDs
 * @param {Array} props.selectedSkuRows - Selected SKU rows
 * @param {Function} props.onSelectedSkusChange - Handler for SKU selection changes
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isUpdated - Whether client details have been updated
 * @param {string} props.offerCode - Offer code
 * @param {Function} props.onUpdate - Handler for client details update
 * @param {Function} props.onOrderPlaced - Handler for order placement
 */
function FinalSection({
    clientOffer,
    selectedClient,
    selectedChain,
    selectedOffer,
    offerDetails,
    selectedSkus = [],
    selectedSkuRows = [],
    onSelectedSkusChange,
    loading = false,
    isUpdated = false,
    offerCode,
    onUpdate,
    onOrderPlaced,
}) {
    const [selectdLetter, setSelectedLetter] = useState(null);
    const [sendingLetter, setSendingLetter] = useState(false);
    console.log(
        "\n#########.found  #######\n",
        selectedOffer,
        "\n################\n"
    );

    const [searchValue, setSearchValue] = useState("");

    const [paymentMethod, setPaymentMethod] = useState(null);
    const [loadingPayment, setLoadingPayment] = useState(true);

    // Payee name modal state
    const [showPayeeModal, setShowPayeeModal] = useState(false);
    const [payeeName, setPayeeName] = useState("");
    const [creatingPayee, setCreatingPayee] = useState(false);
    const [payeeRefreshTrigger, setPayeeRefreshTrigger] = useState(0);
    const payeeInputRef = useRef(null);
    const payeeButtonRef = useRef(null);

    const firstRowHeight = "37dvh";
    const lastRowHeight = "calc(63dvh - 140px)";

    useEffect(() => {
        async function getPaymentMethods() {
            try {
                setLoadingPayment(true);
                const country =
                    selectedOffer?.country ||
                    clientOffer?.currentSequence?.currentOffer?.country;
                const paymentMethods = await getPaymentMethodByCountry(country);

                if (typeof paymentMethods === "string") {
                    setPaymentMethod(["cash"]);
                    return;
                }

                // paymentMethod is already an array from the backend
                setPaymentMethod(
                    Array.isArray(paymentMethods?.paymentMethod)
                        ? paymentMethods.paymentMethod
                        : ["cash"]
                );
            } catch (err) {
                console.log(err);
                message.error("Something went wrong");
            } finally {
                setLoadingPayment(false);
            }
        }

        getPaymentMethods();
    }, [selectedOffer, clientOffer]);

    // Focus on input when modal opens
    useEffect(() => {
        if (showPayeeModal && payeeInputRef.current) {
            setTimeout(() => {
                payeeInputRef.current?.focus();
            }, 100);
        }
    }, [showPayeeModal]);

    // Handle creating payee name
    const handleCreatePayee = async () => {
        if (!payeeName.trim()) {
            message.warning("Please enter a payee name");
            return;
        }

        setCreatingPayee(true);
        try {
            const result = await createPayeeName({ name: payeeName.trim() });

            if (result.data) {
                message.success("Payee name created successfully!");
                setShowPayeeModal(false);
                setPayeeName("");
                // Trigger refresh of PayeeDropdownMenu
                setPayeeRefreshTrigger((prev) => prev + 1);
            } else {
                message.error(result || "Failed to create payee name");
            }
        } catch (error) {
            console.error("Error creating payee name:", error);
            message.error("Failed to create payee name");
        } finally {
            setCreatingPayee(false);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleCreatePayee();
        }
    };

    function hanldeSelect(offer) {
        setSelectedLetter(offer);
    }

    async function handleSendOfferLetter() {
        try {
            setSendingLetter(true);

            // Prepare data based on whether we have clientOffer or manual selection
            const isCompleteClientOffer = Boolean(clientOffer);

            let data = {
                offerLetterId: selectdLetter.id,
            };

            if (isCompleteClientOffer) {
                // Coming from client offer search
                data.clientOfferId = clientOffer.id;
            } else {
                // Manual selection
                data.offerId = selectedOffer?.id || null;
                data.chainId = selectedOffer?.chain?.id || null;
                data.clientId = selectedClient?.id;
                data.campaignId = selectedOffer?.campaign?.id;
            }

            const response = await sendOfferLetter(data);

            if (typeof response === "string") {
                message.error(response);
                return;
            }

            message.success("Offer letter sent successfully!");
            setSelectedLetter(null);
            onOrderPlaced(); // Call the callback to refresh/reset
        } catch (error) {
            console.error("Error sending offer letter:", error);
            message.error("Failed to send offer letter");
        } finally {
            setSendingLetter(false);
        }
    }

    const filters = useMemo(() => {
        const baseFilters = {
            type: [{ ne: "offer" }, { ne: "product" }],
            country: [
                {
                    eq: selectedClient?.country || clientOffer?.client?.country,
                },
            ],
            theme: [
                {
                    eq: clientOffer
                        ? clientOffer?.currentSequence?.currentOffer?.theme
                        : selectedOffer?.theme,
                },
                {
                    eq: null,
                },
            ],
        };

        /*
        const baseFilters = {
            type: [{ ne: "offer" }, { ne: "product" }],
            country: [
                {
                    eq: selectedClient?.country || clientOffer?.client?.country,
                },
            ],
            or: [
                {
                    theme: {
                        eq: clientOffer
                            ? clientOffer?.currentSequence?.currentOffer?.theme
                            : selectedOffer?.theme,
                    },
                },
                {
                    eq: null,
                },
            ]
        };

        */

        // Take them for the same porter if exists
        if (
            selectedOffer?.porter ||
            clientOffer?.currentSequence?.currentOffer?.porter
        ) {
            baseFilters.porter = [
                {
                    eq:
                        selectedOffer?.porter ||
                        clientOffer?.currentSequence?.currentOffer?.porter,
                },
            ];
        }

        // Add title filter if search value exists
        if (searchValue.trim()) {
            baseFilters.title = [{ iLike: `%${searchValue.trim()}%` }];
        }

        return baseFilters;
    }, [selectedClient?.country, clientOffer?.client?.country, searchValue]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* First Row: Client Details and Order Summary */}
            <Row
                gutter={16}
                style={{ marginBottom: "16px", flex: 1, height: "38dvh" }}
            >
                {/* Client Details - First column */}
                <Col
                    span={12}
                    style={{ height: firstRowHeight, overflow: "auto" }}
                >
                    <ClientDetails
                        clientOffer={clientOffer || selectedClient}
                        onUpdate={onUpdate}
                    />
                </Col>

                {/* Order Summary - Second column
                <Col span={12} style={{ height: "100%" }}>
                    <OrderSummary
                        clientOffer={clientOffer}
                        selectedClient={selectedClient}
                        selectedChain={selectedChain}
                        selectedOffer={selectedOffer}
                        selectedSkuRows={selectedSkuRows}
                        offerCode={clientOffer ? clientOffer.code : "N/A"}
                    />
                </Col> */}
                <Col
                    span={12}
                    style={{ height: firstRowHeight, overflow: "auto" }}
                >
                    <ClientComments
                        clientId={selectedClient?.id || clientOffer?.client?.id}
                        clientName={`${
                            selectedClient?.firstName ||
                            clientOffer?.client?.firstName
                        } ${
                            selectedClient?.lastName ||
                            clientOffer?.client?.lastName ||
                            ""
                        }`}
                    />
                </Col>
            </Row>

            {/* Second Row: SKU Table and Place Order Form */}
            <Row
                gutter={16}
                style={{
                    flex: 1,
                    width: "100%",
                }}
            >
                {/* SKU Table - First column */}
                <Col
                    span={8}
                    style={{ height: lastRowHeight, overflow: "auto" }}
                >
                    <Card
                        title={`Send an client service offer for: ${
                            selectedClient?.firstName ||
                            clientOffer?.client?.firstName ||
                            ""
                        } ${
                            selectedClient?.lastName ||
                            clientOffer?.client?.lastName ||
                            ""
                        }`}
                        style={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            textWrap: "nowrap",
                        }}
                        styles={{
                            body: {
                                flex: 1,
                                overflow: "auto",
                                display: "flex",
                                flexDirection: "column",
                                padding: 0,
                            },
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                                overflow: "auto",
                                padding: "24px",
                            }}
                        >
                            {/* <OfferSkusTable
                                skus={
                                    offerDetails?.skus ||
                                    clientOffer?.currentSequence?.currentOffer
                                        ?.skus ||
                                    []
                                }
                                loading={loading}
                                size="middle"
                                onSelectedSkusChange={onSelectedSkusChange}
                                selectedSkuIds={selectedSkus}
                            /> */}

                            <OfferLetter
                                filters={filters}
                                onSelect={hanldeSelect}
                                selectedOfferId={selectdLetter?.id}
                            />
                        </div>

                        <div
                            style={{
                                borderTop: "1px solid #f0f0f0",
                                padding: "12px 24px",
                                backgroundColor: "#fafafa",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                }}
                            >
                                <Search
                                    placeholder="Search offer letter by title..."
                                    allowClear
                                    enterButton="Search"
                                    size="large"
                                    onSearch={(value) => setSearchValue(value)}
                                    onChange={(e) => {
                                        // Clear search if input is empty
                                        if (!e.target.value.trim()) {
                                            setSearchValue("");
                                        }
                                    }}
                                />
                                {selectdLetter && (
                                    <Button
                                        type="primary"
                                        size="large"
                                        loading={sendingLetter}
                                        onClick={handleSendOfferLetter}
                                        style={{
                                            width: "100%",
                                            textWrap: "pretty",
                                            padding: "1.5rem",
                                        }}
                                    >
                                        Send Offer Letter: {selectdLetter.title}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Place Order Form - Second column */}
                <Col
                    span={16}
                    style={{
                        height: lastRowHeight,
                        overflow: "auto",
                        width: "100%",
                    }}
                >
                    <Card
                        title="Place Order"
                        style={{ height: "100%", overflow: "hidden" }}
                        bodyStyle={{
                            // height: "calc(100% - 58px)",
                            overflow: "auto",
                        }}
                        extra={(() => {
                            const campaign =
                                clientOffer?.campaign?.code ||
                                selectedOffer?.campaign?.code ||
                                "N/A";
                            const offer =
                                clientOffer?.currentSequence?.currentOffer
                                    ?.title || selectedOffer?.title;
                            const chain =
                                clientOffer?.chain?.title ||
                                selectedOffer?.chain?.title ||
                                "N/A";
                            return (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Tag color="blue">Campaign: {campaign}</Tag>
                                    <Tag color="blue">Offer: {offer}</Tag>
                                    <Tag color="blue">Chain: {chain}</Tag>
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={() => setShowPayeeModal(true)}
                                    >
                                        Add Payee Name
                                    </Button>
                                </div>
                            );
                        })()}
                    >
                        {loadingPayment ? (
                            <Spin size="large" />
                        ) : (
                            <PlaceOrderForm
                                selectedCampaign={
                                    selectedOffer?.campaign?.id ||
                                    clientOffer.campaign?.id
                                }
                                paymentMethod={paymentMethod}
                                offerLetter={selectdLetter}
                                clientOffer={clientOffer}
                                // This will be used in case there is no client offer
                                clientOfferData={{
                                    ...selectedClient,
                                    chainId: selectedChain?.id,
                                    chainTitle: selectedChain?.title,
                                    offerId: selectedOffer?.id,
                                    offerTitle: selectedOffer?.title,
                                }}
                                offerDetails={offerDetails}
                                offerCode={
                                    clientOffer
                                        ? clientOffer.code
                                        : selectedClient?.code
                                }
                                selectedClient={selectedClient}
                                madeUpdate={isUpdated}
                                selectedSkus={selectedSkus}
                                selectedSkuRows={selectedSkuRows}
                                onOrderPlaced={onOrderPlaced}
                                payeeRefreshTrigger={payeeRefreshTrigger}
                            />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Add Payee Name Modal */}
            <Modal
                title="Add Payee Name"
                open={showPayeeModal}
                onCancel={() => {
                    setShowPayeeModal(false);
                    setPayeeName("");
                }}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setShowPayeeModal(false);
                            setPayeeName("");
                        }}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={creatingPayee}
                        onClick={handleCreatePayee}
                        ref={payeeButtonRef}
                    >
                        Add
                    </Button>,
                ]}
            >
                <Input
                    ref={payeeInputRef}
                    placeholder="Enter payee name"
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onKeyDown={(e) => {
                        if (e.key === "Tab" && !e.shiftKey) {
                            e.preventDefault();
                            payeeButtonRef.current?.focus();
                        }
                    }}
                    size="large"
                    disabled={creatingPayee}
                />
            </Modal>
        </div>
    );
}

export default FinalSection;
