import { Card } from "antd";

/**
 * -------------> Delete this <-------------------
 * OrderSummary component for displaying order summary information
 *
 * @param {Object} props
 * @param {Object} props.clientOffer - Client offer data
 * @param {Object} props.selectedClient - Selected client data (used as fallback)
 * @param {Object} props.selectedChain - Selected chain data (used as fallback)
 * @param {Object} props.selectedOffer - Selected offer data (used as fallback)
 * @param {Array} props.selectedSkuRows - Selected SKU rows
 * @param {string} props.offerCode - Offer code if available
 */
function OrderSummary({
    clientOffer,
    selectedClient,
    selectedChain,
    selectedOffer,
    selectedSkuRows = [],
    offerCode,
}) {
    return (
        <Card
            title="Order Summary"
            style={{ height: "40dvh", overflow: "auto" }}
            styles={{ body: { height: "30dvh", overflow: "auto" } }}
        >
            <div style={{ marginBottom: "16px" }}>
                <p>
                    <strong>Client:</strong>{" "}
                    {clientOffer
                        ? `${clientOffer.client?.firstName || ""} ${
                              clientOffer.client?.lastName || ""
                          }`
                        : `${selectedClient?.firstName || ""} ${
                              selectedClient?.lastName || ""
                          }`}
                </p>
                <p>
                    <strong>Email:</strong>{" "}
                    {clientOffer
                        ? clientOffer.client?.email || "N/A"
                        : selectedClient?.email || "N/A"}
                </p>
                <p>
                    <strong>Chain:</strong>{" "}
                    {clientOffer
                        ? clientOffer.chain?.title || "N/A"
                        : selectedChain?.title || "N/A"}
                </p>
                <p>
                    <strong>Offer:</strong>{" "}
                    {clientOffer
                        ? clientOffer.currentSequence?.currentOffer?.title ||
                          "N/A"
                        : selectedOffer?.title || "N/A"}
                </p>
                <p>
                    <strong>Offer Code:</strong> {offerCode || "N/A"}
                </p>
                <p>
                    <strong>SKUs Count:</strong> {selectedSkuRows.length || 0}
                </p>
            </div>
        </Card>
    );
}

export default OrderSummary;
