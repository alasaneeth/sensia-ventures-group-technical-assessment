import { useEffect, useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import PageHeader from "../../components/ui/PageHeader";
import { getOrdersSummary } from "../../api/order";
import { Spin, Pagination } from "antd";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

function OrdersSummary() {
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0,
        pages: 1,
    });
    const { selectedBrandIds, brands } = useGlobalCompanyBrandFilter();

    // Column definitions
    const columnDefs = [
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
            field: "brand.name",
            sortable: true,
            filter: "agTextColumnFilter",
            minWidth: 150,
            valueGetter: (params) => {
                return params.data?.brand?.name || "-";
            },
        },
        {
            headerName: "Country",
            field: "country",
            sortable: true,
            filter: true,
            pinned: "left",
            width: 200,
        },
        {
            headerName: "Total Orders",
            field: "totalOrders",
            sortable: true,
            filter: "agNumberColumnFilter",
            width: 200,
        },
        {
            headerName: "Total Paid",
            field: "totalPaid",
            sortable: true,
            filter: "agNumberColumnFilter",
            width: 200,
            valueFormatter: (params) => {
                const currency = params.data?.currency || "";
                return params.value
                    ? `${params.value} ${currency}`
                    : `0 ${currency}`;
            },
        },
        {
            headerName: "Total Cash",
            field: "totalCash",
            sortable: true,
            filter: "agNumberColumnFilter",
            width: 200,
            valueFormatter: (params) => {
                const currency = params.data?.currency || "";
                return params.value
                    ? `${params.value} ${currency}`
                    : `0 ${currency}`;
            },
        },
        {
            headerName: "Total Checks",
            field: "totalChecks",
            sortable: true,
            filter: "agNumberColumnFilter",
            width: 200,
            valueFormatter: (params) => {
                const currency = params.data?.currency || "";
                return params.value
                    ? `${params.value} ${currency}`
                    : `0 ${currency}`;
            },
        },
        {
            headerName: "Total Discount",
            field: "totalDiscount",
            sortable: true,
            filter: "agNumberColumnFilter",
            width: 200,
            valueFormatter: (params) => {
                const currency = params.data?.currency || "";
                return params.value
                    ? `${params.value} ${currency}`
                    : `0 ${currency}`;
            },
        },
        {
            headerName: "Total After Discount",
            field: "totalAfterDiscount",
            sortable: true,
            filter: "agNumberColumnFilter",
            width: 250,
            valueFormatter: (params) => {
                const currency = params.data?.currency || "";
                return params.value
                    ? `${params.value} ${currency}`
                    : `0 ${currency}`;
            },
        },
        {
            headerName: "Date",
            field: "createdAt",
            sortable: true,
            filter: "agDateColumnFilter",
            width: 150,
            valueFormatter: (params) => {
                const date = params.value;
                return date ? new Date(date).toLocaleDateString() : "";
            },
        },
    ];

    // Default column properties
    const defaultColDef = {
        resizable: true,
        sortable: true,
        filter: true,
        filterParams: {
            buttons: ["apply", "clear"],
            closeOnApply: true,
            maxNumConditions: 1,
        },
    };

    // Fetch data with pagination
    const fetchSummary = useMemo(
        () => async () => {
            try {
                setLoading(true);

                // Build brand filter only
                const filters = {};

                // Add brand filter - only apply if not all items are selected (optimization)
                filters.brandId = [{ in: selectedBrandIds }];

                const result = await getOrdersSummary(
                    pagination.current,
                    pagination.pageSize,
                    Object.keys(filters).length > 0 ? filters : undefined
                );
                console.log("Data: ", result);

                if (typeof result === "string") {
                    console.error(result);
                    return;
                }

                setRowData(result.data || []);
                setPagination((prev) => ({
                    ...prev,
                    total: result.pagination?.total || 0,
                    current: result.pagination?.page || prev.current,
                    pageSize: result.pagination?.limit || prev.pageSize,
                    pages: result.pagination?.pages || 1,
                }));
            } catch (error) {
                console.error("Error fetching orders summary:", error);
            } finally {
                setLoading(false);
            }
        },
        [pagination.current, pagination.pageSize, selectedBrandIds]
    );

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    // Handle pagination change
    const handlePageChange = (nextPage, nextPageSize) => {
        setPagination({
            ...pagination,
            current: nextPage,
            pageSize: nextPageSize,
        });
    };

    return (
        <>
            <PageHeader title="Order Summary" />
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    padding: "20px",
                }}
            >
                {loading && rowData.length === 0 ? (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            padding: "50px",
                        }}
                    >
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        <div
                            className="ag-theme-quartz"
                            style={{
                                width: "100%",
                                height: "500px", // Fixed height for the grid
                            }}
                        >
                            <AgGridReact
                                rowData={rowData}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                domLayout="normal"
                                loading={loading}
                                animateRows={true}
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
                    </>
                )}
            </div>
        </>
    );
}

export default OrdersSummary;
