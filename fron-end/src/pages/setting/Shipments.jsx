import { AgGridReact } from "ag-grid-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { getShipments } from "../../api/addresses";
import { message, Pagination } from "antd";
import ShipmentActions from "../../components/address/ShipmentActions";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

function Shipments() {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0,
        pages: 1,
    });

    // Use global brand filter from header
    const { selectedBrandIds, brands } = useGlobalCompanyBrandFilter();

    const columnDefs = useMemo(
        () => [
            {
                headerName: "Company",
                field: "brand.company.name",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.brand?.company?.name || "N/A";
                },
            },
            {
                headerName: "Brand",
                field: "brand.name",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.brand?.name || "-";
                },
            },
            {
                headerName: "PO Box Address",
                field: "poBox.address",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 200,
                valueFormatter: (params) => params.value || "-",
            },
            {
                headerName: "Delivery Courier",
                field: "deliveryCourrier",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
            },
            {
                headerName: "Tracking Number",
                field: "trackingNumber",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
            },
            {
                headerName: "Number of Letters",
                field: "numberOfLetters",
                sortable: true,
                filter: "agNumberColumnFilter",
                flex: 1,
                minWidth: 150,
            },
            {
                headerName: "Weight",
                field: "weight",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 120,
            },
            {
                headerName: "Shipment Date",
                field: "createdAt",
                sortable: true,
                filter: "agDateColumnFilter",
                flex: 1,
                minWidth: 150,
                valueFormatter: (params) =>
                    params.value
                        ? new Date(params.value).toLocaleDateString()
                        : "",
            },
            {
                headerName: "Receiving Date",
                field: "receivingDate",
                sortable: true,
                filter: "agDateColumnFilter",
                flex: 1,
                minWidth: 150,
                valueFormatter: (params) =>
                    params.value
                        ? new Date(params.value).toLocaleDateString()
                        : "",
            },
            {
                headerName: "Data Entry Finished Date",
                field: "dataEntryFinishedDate",
                sortable: true,
                filter: "agDateColumnFilter",
                flex: 1,
                minWidth: 150,
                valueFormatter: (params) =>
                    params.value
                        ? new Date(params.value).toLocaleDateString()
                        : "",
            },
            {
                headerName: "Received",
                field: "received",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 120,
                valueFormatter: (params) => (params.value ? "Yes" : "No"),
                cellStyle: (params) => ({
                    backgroundColor: params.value ? "#f6ffed" : "#fff2e8",
                }),
            },
            {
                headerName: "PO Box Number",
                field: "poBox.poBoxNumber",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
                valueFormatter: (params) => params.value || "-",
            },
            {
                headerName: "Actions",
                field: "actions",
                width: 120,
                sortable: false,
                filter: false,
                cellRenderer: (params) => {
                    return (
                        <ShipmentActions
                            record={params.data}
                            setShipments={setShipments}
                        />
                    );
                },
                pinned: "right",
            },
        ],
        []
    );

    const fetchShipments = useCallback(async () => {
        setLoading(true);
        try {
            // Build brand filter only
            const filters = {};

            // Add brand filter - only apply if not all items are selected (optimization)

            filters.brandId = [{ in: selectedBrandIds }];

            const result = await getShipments(
                pagination.current,
                pagination.pageSize,
                Object.keys(filters).length > 0 ? filters : undefined,
                [
                    ["received", "ASC"],
                    ["id", "DESC"],
                ]
            );

            if (typeof result === "string") {
                message.error(result);
                return;
            }

            setShipments(result.data || []);
            setPagination((prev) => ({
                ...prev,
                total: result.pagination?.total || 0,
                current: result.pagination?.page || prev.current,
                pageSize: result.pagination?.limit || prev.pageSize,
                pages: result.pagination?.pages || 1,
            }));
        } catch (err) {
            console.error(err);
            message.error("Failed to fetch shipments");
        } finally {
            setLoading(false);
        }
    }, [
        pagination.current,
        pagination.pageSize,
        selectedBrandIds,
        brands.length,
    ]);

    useEffect(() => {
        fetchShipments();
    }, [fetchShipments]);

    const defaultColDef = useMemo(
        () => ({
            sortable: true,
            filter: true,
            resizable: true,
            filterParams: {
                buttons: ["apply", "clear"],
                closeOnApply: true,
                maxNumConditions: 1,
            },
        }),
        []
    );

    const gridOptions = useMemo(
        () => ({
            suppressMultiSort: false,
            multiSortKey: "ctrl",
            animateRows: true,
            suppressPaginationPanel: true,
            suppressColumnVirtualisation: true,
        }),
        []
    );

    const handlePageChange = (nextPage, nextPageSize) => {
        setPagination({
            ...pagination,
            current: nextPage,
            pageSize: nextPageSize,
        });
    };

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div
                className="ag-theme-quartz"
                style={{ width: "100%", height: "500px" }}
            >
                <AgGridReact
                    rowData={shipments}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    gridOptions={gridOptions}
                    domLayout="normal"
                    loading={loading}
                    rowSelection="single"
                    overlayLoadingTemplate={
                        '<span class="ag-overlay-loading-center">Loading...</span>'
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
                    Page <b>{pagination.current}</b> of{" "}
                    <b>{pagination.pages}</b> — Total rows:{" "}
                    <b>{pagination.total}</b>
                </div>
                <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    showSizeChanger
                    pageSizeOptions={["100", "150", "175", "200"]}
                    showQuickJumper
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                />
            </div>
        </div>
    );
}

export default Shipments;
