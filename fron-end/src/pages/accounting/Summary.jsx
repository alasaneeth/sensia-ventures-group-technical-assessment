import React, {
    useCallback,
    useMemo,
    useRef,
    useState,
    useEffect,
    memo,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Pagination } from "antd";
import { getSummary } from "../../api/accounting";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

ModuleRegistry.registerModules([AllCommunityModule]);

const Summary = memo(function Summary() {
    const gridRef = useRef(null);

    const [rowData, setRowData] = useState([]);
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
                field: "partner",
                headerName: "Partner",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 2,
                minWidth: 200,
            },
            {
                field: "company",
                headerName: "Company",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.brand?.company?.name || "N/A";
                },
            },
            {
                field: "brand",
                headerName: "Brand",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.brand?.name || "-";
                },
            },
            {
                field: "totalInvoices",
                headerName: "Total Invoices",
                sortable: true,
                filter: "agNumberColumnFilter",
                flex: 1,
                minWidth: 150,
                valueFormatter: (params) => {
                    const amount = params.value;
                    if (amount == null) return "";
                    return `${amount.toLocaleString()} ${
                        params.data?.currency || ""
                    }`;
                },
            },
            {
                field: "totalPayments",
                headerName: "Total Payments",
                sortable: true,
                filter: "agNumberColumnFilter",
                flex: 1,
                minWidth: 150,
                valueFormatter: (params) => {
                    const amount = params.value;
                    if (amount == null) return "";
                    return `${amount.toLocaleString()} ${
                        params.data?.currency || ""
                    }`;
                },
            },
            {
                field: "due",
                headerName: "Due Amount",
                sortable: true,
                filter: "agNumberColumnFilter",
                flex: 1,
                minWidth: 150,
                valueFormatter: (params) => {
                    const amount = params.value;
                    if (amount == null) return "";
                    const currency = params.data?.currency || "";
                    const formattedAmount = amount.toLocaleString();
                    return amount >= 0
                        ? `${formattedAmount} ${currency}`
                        : `(${Math.abs(formattedAmount)} ${currency})`;
                },
                cellStyle: (params) => {
                    const due = params.value;
                    if (due > 0) {
                        return { color: "red" }; // We owe money - show red
                    } else if (due < 0) {
                        return { color: "green" }; // They owe us money - show green
                    }
                    return {}; // due = 0 - default color
                },
            },
        ],
        []
    );

    const defaultColDef = useMemo(
        () => ({
            resizable: true,
            minWidth: 110,
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Build filters from brand selection
            const apiFilters = {};

            // Add brand filter - only apply if not all items are selected (optimization)

            apiFilters.brandId = [{ in: selectedBrandIds }];

            const result = await getSummary(
                pagination.current,
                pagination.pageSize,
                Object.keys(apiFilters).length > 0 ? apiFilters : undefined
            );

            const dataToSet = result?.data || [];
            setRowData(dataToSet);

            setPagination({
                ...pagination,
                total: result.pagination.total,
                pageSize: result.pagination.limit,
                pages: result.pagination.pages,
            });
        } catch (e) {
            console.error("Failed to load summary:", e);
            setRowData([]);
            setPagination({
                current: 1,
                pageSize: 100,
                pages: 1,
                total: 0,
            });
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
        fetchData();
    }, [fetchData]);

    const handlePageChange = (nextPage, nextPageSize) => {
        setPagination({
            ...pagination,
            current: nextPage,
            pageSize: nextPageSize,
        });
    };

    return (
        <div
            style={{ width: "100%", display: "flex", flexDirection: "column" }}
        >
            <div
                className="ag-theme-quartz"
                style={{ width: "100%", height: "500px" }}
            >
                <AgGridReact
                    ref={gridRef}
                    gridOptions={gridOptions}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowData={rowData}
                    domLayout="normal"
                    overlayLoadingTemplate={
                        '<span class="ag-overlay-loading-center">Loading...</span>'
                    }
                    loading={loading}
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
});

export default Summary;
