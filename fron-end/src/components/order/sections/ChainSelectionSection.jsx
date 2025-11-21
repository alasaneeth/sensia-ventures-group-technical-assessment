import { Card } from "antd";
import OrderChainsTable from "../../chains/OrderChainsTable";

/**
 * ChainSelectionSection component for displaying and handling chain selection
 * 
 * @param {Object} props
 * @param {Object} props.selectedClient - The selected client
 * @param {Function} props.onChainSelect - Handler for chain selection
 * @param {boolean} props.loading - Loading state
 */
function ChainSelectionSection({
    selectedClient,
    onChainSelect,
    loading = false
}) {
    return (
        <Card
            title={`Select a Chain for ${selectedClient?.firstName} ${selectedClient?.lastName}`}
            style={{ marginBottom: "24px" }}
        >
            <OrderChainsTable
                onChainSelect={onChainSelect}
                loading={loading}
            />
        </Card>
    );
}

export default ChainSelectionSection;
