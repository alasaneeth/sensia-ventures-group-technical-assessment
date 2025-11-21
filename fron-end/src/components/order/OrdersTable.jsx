import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { Modal, Button, Pagination } from "antd";
import { useSearchParams } from "react-router-dom";
import { getOrders } from "../../api/order";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import formatDate from "./../../util/formatDate";
import OrderActions from "./OrderActions";
import OfferSkusTable from "../skusv1/OfferSkusTable";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

/**
 * Chain table component
 * @param {Object} props
 * @param {boolean} props.showActions - Whether to show the actions column
 * @param {Array} props.customData - Custom data to display instead of fetching from API
 * @param {Function} props.onRowClick - Function to call when a row is clicked
 * @param {Function} props.onRowSelect - Function to call when a row is selected
 * @param {boolean} props.selectable - Whether rows are selectable
 */
function OrdersTable() {
    const gridRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [total, setTotal] = useState(0);
    const [orders, setOrders] = useState([]);
    const [totals, setTotals] = useState({
        requiredAmount: 0,
        cashAmount: 0,
        checkAmount: 0,
        postalAmount: 0,
        totalPaid: 0,
        discountAmount: 0,
    });

    // State for SKU modal
    const [isSkuModalVisible, setIsSkuModalVisible] = useState(false);
    const [currentSkus, setCurrentSkus] = useState([]);
    const [currentOrderId, setCurrentOrderId] = useState(null);

    // Use global brand filter from header
    const { selectedBrandIds, brands } = useGlobalCompanyBrandFilter();

    // Fetch chains data or use custom data
    // Calculate totals when orders change
    useEffect(() => {
        if (orders && orders.length > 0) {
            const calculatedTotals = orders.reduce(
                (acc, order) => {
                    const requiredAmount = parseFloat(order.amount) || 0;
                    const cashAmount = parseFloat(order.cashAmount) || 0;
                    const checkAmount = parseFloat(order.checkAmount) || 0;
                    const postalAmount = parseFloat(order.postalAmount) || 0;
                    const discountAmount =
                        parseFloat(order.discountAmount) || 0;
                    const totalPaid = cashAmount + checkAmount + postalAmount;

                    return {
                        requiredAmount: acc.requiredAmount + requiredAmount,
                        cashAmount: acc.cashAmount + cashAmount,
                        checkAmount: acc.checkAmount + checkAmount,
                        postalAmount: acc.postalAmount + postalAmount,
                        totalPaid: acc.totalPaid + totalPaid,
                        discountAmount: acc.discountAmount + discountAmount,
                    };
                },
                {
                    requiredAmount: 0,
                    cashAmount: 0,
                    checkAmount: 0,
                    postalAmount: 0,
                    totalPaid: 0,
                    discountAmount: 0,
                }
            );

            console.log("this is the total: ", calculatedTotals);

            setTotals(calculatedTotals);
        }
    }, [orders]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            // Build brand filter only
            const filters = {};

            // Add brand filter - only apply if not all items are selected (optimization)

            filters.brandId = [{ in: selectedBrandIds }];

            const result = await getOrders(
                page,
                pageSize,
                Object.keys(filters).length > 0 ? filters : undefined
            );
            setOrders(result.data || []);
            setTotal(result.pagination?.total || 0);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, selectedBrandIds, brands.length]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Function to show SKUs modal
    function showSkuModal(record) {
        if (record.skus && record.skus.length > 0) {
            setCurrentSkus(record.skus);
            setCurrentOrderId(record.id);
            setIsSkuModalVisible(true);
        }
    }

    // Function to close SKUs modal
    function handleSkuModalClose() {
        setIsSkuModalVisible(false);
    }

    // SKU Button Cell Renderer
    const SkuButtonRenderer = (props) => {
        const skuCount = props.data.skus?.length || 0;
        return (
            <div style={{ textAlign: "center" }}>
                <Button
                    type="link"
                    onClick={() => showSkuModal(props.data)}
                    disabled={skuCount === 0}
                >
                    View SKUs
                </Button>
            </div>
        );
    };

    // Remove order from table
    const removeOrder = (orderId) => {
        setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
        setTotal((prevTotal) => Math.max(0, prevTotal - 1));
    };

    // Actions Cell Renderer
    const ActionsRenderer = (props) => {
        return (
            <div style={{ textAlign: "center" }}>
                <OrderActions
                    record={props.data}
                    fetchOrders={fetchOrders}
                    onOrderDeleted={removeOrder}
                />
            </div>
        );
    };

    // AG Grid column definitions
    const columnDefs = useMemo(
        () => [
            {
                headerName: "Order ID",
                field: "id",
                sortable: true,
                filter: true,
                pinned: "left",
                width: 120,
                cellStyle: { textAlign: "center" },
            },
            {
                headerName: "Company",
                field: "brand.company.name",
                sortable: true,
                filter: "agTextColumnFilter",
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.brand?.company?.name || "N/A";
                },
            },
            {
                headerName: "Brand",
                field: "brand",
                sortable: true,
                filter: "agTextColumnFilter",
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.brand?.name || "-";
                },
            },
            {
                headerName: "Purchase At",
                field: "createdAt",
                sortable: true,
                filter: true,
                width: 180,
                cellStyle: { textAlign: "center" },
                valueFormatter: (params) => formatDate(params.value),
            },
            {
                headerName: "Total Paid Amount",
                field: "amount",
                sortable: true,
                filter: true,
                width: 180,
                cellStyle: { textAlign: "center" },
                valueFormatter: (params) =>
                    `${parseFloat(params.value).toFixed(2).slice(0, 5)} ${
                        params.data.currency
                    }`,
            },
            {
                headerName: "Paid Cash Amount",
                field: "cashAmount",
                sortable: true,
                filter: true,
                width: 180,
                cellStyle: { textAlign: "center" },
                valueFormatter: (params) =>
                    `${parseFloat(params.value).toFixed(2).slice(0, 5)} ${
                        params.data.currency
                    }`,
            },
            {
                headerName: "Paid Check Amount",
                field: "checkAmount",
                sortable: true,
                filter: true,
                width: 180,
                cellStyle: { textAlign: "center" },
                valueFormatter: (params) =>
                    `${parseFloat(params.value).toFixed(2).slice(0, 5)} ${
                        params.data.currency
                    }`,
            },
            {
                headerName: "Paid Postal Amount",
                field: "postalAmount",
                sortable: true,
                filter: true,
                width: 180,
                cellStyle: { textAlign: "center" },
                valueFormatter: (params) =>
                    `${parseFloat(params.value).toFixed(2).slice(0, 5)} ${
                        params.data.currency
                    }`,
            },
            {
                headerName: "Payee Name For Check",
                field: "payee",
                sortable: true,
                filter: true,
                width: 150,
                cellStyle: { textAlign: "center" },
            },
            {
                headerName: "Discount",
                field: "discountAmount",
                sortable: true,
                filter: true,
                width: 150,
                cellStyle: { textAlign: "center" },
                valueFormatter: (params) =>
                    parseFloat(params.value) > 0
                        ? `${params.value} ${params.data.currency}`
                        : "-",
            },
            {
                headerName: "Total After Discount",
                sortable: true,
                filter: true,
                width: 200,
                cellStyle: { textAlign: "center" },
                valueGetter: (params) => {
                    const amount = parseFloat(params.data.amount ?? 0);
                    const discount = parseFloat(
                        params.data.discountAmount ?? 0
                    );
                    const total = amount - discount;
                    return total > 0 ? `${total} ${params.data.currency}` : "-";
                },
            },
            {
                headerName: "Client Name",
                sortable: true,
                filter: true,
                width: 200,
                // cellStyle: { textAlign: "center", wordBreak: "break-wosrd", whiteSpace: "normal" },
                valueGetter: (params) =>
                    `${params.data.title || ""} ${
                        params.data.firstName || ""
                    } ${params.data.lastName || ""}`.trim(),
            },
            {
                headerName: "Key Code",
                field: "keyCode.key",
                sortable: true,
                filter: true,
                width: 150,
                cellStyle: {
                    textAlign: "center",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                },
                valueFormatter: (params) => params.value || "-",
            },
            {
                headerName: "Street",
                field: "street",
                sortable: true,
                filter: true,
                width: 200,
                cellStyle: {
                    textAlign: "center",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                },
                valueFormatter: (params) => params.value || "-",
            },
            {
                headerName: "City",
                field: "city",
                sortable: true,
                filter: true,
                width: 150,
                cellStyle: {
                    textAlign: "center",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                },
                valueFormatter: (params) => params.value || "-",
            },
            {
                headerName: "ZIP/Postal Code",
                field: "zipCode",
                sortable: true,
                filter: true,
                width: 150,
                cellStyle: {
                    textAlign: "center",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                },
                valueFormatter: (params) => params.value || "-",
            },
            {
                headerName: "Country",
                field: "country",
                sortable: true,
                filter: true,
                width: 150,
                cellStyle: {
                    textAlign: "center",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                },
                valueFormatter: (params) => params.value || "-",
            },
            {
                headerName: "Address Line 1",
                field: "address1",
                sortable: true,
                filter: true,
                width: 200,
                cellStyle: {
                    textAlign: "center",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                },
                valueFormatter: (params) => params.value || "-",
            },
            {
                headerName: "Address Line 2",
                field: "address2",
                sortable: true,
                filter: true,
                width: 200,
                cellStyle: {
                    textAlign: "center",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                },
                valueFormatter: (params) => params.value || "-",
            },
            {
                headerName: "Offer",
                field: "offerTitle",
                sortable: true,
                filter: true,
                width: 200,
                cellStyle: {
                    textAlign: "center",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                },
                valueFormatter: (params) => params.value || "-",
            },
            {
                headerName: "Chain",
                field: "chainTitle",
                sortable: true,
                filter: true,
                width: 200,
                cellStyle: {
                    textAlign: "center",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                },
                valueFormatter: (params) => params.value || "-",
            },
            {
                headerName: "Campaign",
                field: "campaignCode",
                sortable: true,
                filter: true,
                width: 150,
                cellStyle: {
                    textAlign: "center",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                },
                valueFormatter: (params) => params.value || "-",
            },
            // {
            //     headerName: "SKUs",
            //     cellRenderer: SkuButtonRenderer,
            //     width: 150,
            //     cellStyle: { textAlign: "center" },
            // },
            {
                headerName: "Actions",
                cellRenderer: ActionsRenderer,
                pinned: "right",
                width: 150,
                cellStyle: { textAlign: "center" },
            },
        ],
        []
    );

    // Default column properties
    const defaultColDef = useMemo(
        () => ({
            resizable: true,
            sortable: true,
            filter: true,
            filterParams: {
                buttons: ["apply", "clear"],
                closeOnApply: true,
                maxNumConditions: 1,
            },
        }),
        []
    );

    const handlePageChange = (nextPage, nextPageSize) => {
        setPage(nextPage);
        if (nextPageSize !== pageSize) setPageSize(nextPageSize);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <>
            <div
                className="ag-theme-quartz"
                style={{
                    width: "100%",
                    height: "500px", // Fixed height for the grid
                }}
            >
                <AgGridReact
                    ref={gridRef}
                    rowData={orders}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    domLayout="normal"
                    loading={loading}
                    rowSelection="single"
                    animateRows={true}
                    getRowId={(params) => params.data.id}
                    overlayLoadingTemplate={
                        '<span class="ag-overlay-loading-center">Loading...</span>'
                    }
                    overlayNoRowsTemplate={
                        '<span class="ag-overlay-loading-center">No data available</span>'
                    }
                />
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: 8,
                    gap: 12,
                }}
            >
                <div style={{ fontSize: 12 }}>
                    Page <b>{page}</b> of <b>{totalPages}</b> — Total rows:{" "}
                    <b>{total}</b>
                </div>
                <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    showSizeChanger
                    pageSizeOptions={["100", "150", "175", "200"]}
                    showQuickJumper
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                />
            </div>

            {/* SKUs Modal */}
            <Modal
                title={`SKUs for Order #${currentOrderId}`}
                open={isSkuModalVisible}
                onCancel={handleSkuModalClose}
                width={1200}
                footer={[
                    <Button key="close" onClick={handleSkuModalClose}>
                        Close
                    </Button>,
                ]}
            >
                <OfferSkusTable
                    skus={currentSkus}
                    size="middle"
                    selectable={false}
                />
            </Modal>
        </>
    );
}

export default OrdersTable;
