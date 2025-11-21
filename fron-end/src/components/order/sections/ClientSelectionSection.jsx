import { Card } from "antd";
import ClientOrderTable from "../../clients/ClientOrderTable";

/**
 * ClientSelectionSection component for displaying and handling client selection
 * 
 * @param {Object} props
 * @param {Array} props.clients - Array of clients to display
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onClientSelect - Handler for client selection
 * @param {Object} props.pagination - Pagination configuration
 * @param {Function} props.onPaginationChange - Handler for pagination changes
 */
function ClientSelectionSection({
    clients = [],
    loading = false,
    onClientSelect,
    pagination,
    onPaginationChange
}) {
    return (
        <Card title="Select a Client" style={{ marginBottom: "24px" }}>
            <ClientOrderTable
                clients={clients}
                loading={loading}
                onClientSelect={onClientSelect}
                pagination={{
                    current: pagination?.current || 1,
                    pageSize: pagination?.pageSize || 100,
                    total: pagination?.total || 0
                }}
                onPaginationChange={onPaginationChange}
            />
        </Card>
    );
}

export default ClientSelectionSection;
