import { AgGridReact } from "ag-grid-react";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";
import { getAddresses } from "../../api/addresses";
import { message, Pagination, Tooltip, Select } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useEffect, useState, useMemo, useCallback } from "react";
import AddressActions from "./AddressActions";
import { checkGermany } from "../../util/germanyConverter";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

function AddressTable() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);

    // Use global brand filter from header
    const { selectedBrandIds, brands } = useGlobalCompanyBrandFilter();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0,
        pages: 1,
    });

    const columnDefs = useMemo(
        () => [
            {
                headerName: "Company Name",
                field: "company.name",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.company?.name || null;
                },
            },
            {
                headerName: "Brand Name",
                field: "brand.name",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.brand?.name || null;
                },
            },
            {
                headerName: "Comment",
                field: "comment",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 200,
            },
                        {
                headerName: "Last Shipment Date",
                field: "lastShipmentDate",
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
                headerName: "Total Shipments",
                field: "relatedShipmentsCount",
                sortable: true,
                filter: "agNumberColumnFilter",
                flex: 1,
                minWidth: 150,
            },
            {
                headerName: "Status",
                field: "status",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 120,
            },
            {
                headerName: "Address",
                field: "address",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 200,
            },
            {
                headerName: "Country",
                field: "country",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
                valueFormatter: (params) => checkGermany(params.value),
            },
            {
                headerName: "PO Box Number",
                field: "poBoxNumber",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
            },
            {
                headerName: "Manager At Bluescale",
                field: "ManagerAtBluescale",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 180,
            },
            {
                headerName: "Opening Date",
                field: "openingDate",
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
                headerName: "Team Name Contact",
                field: "teamNameContact",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 180,
            },
            {
                headerName: "PO Box Email",
                field: "poBoxEmail",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 200,
            },
            {
                headerName: "Number of Offers To Change Related PO Box",
                field: "relatedOffersCount",
                sortable: true,
                filter: "agNumberColumnFilter",
                flex: 1,
                minWidth: 150,
                cellRenderer: (params) => {
                    if (params.data.status !== "closed") return;
                    const count = params.value || 0;
                    const isClosedWithOffers =
                        params.data.status === "closed" && count > 0;

                    return (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            {isClosedWithOffers && (
                                <Tooltip
                                    title={`This closed PO Box still has ${count} related offer(s) that need to be updated`}
                                >
                                    <ExclamationCircleOutlined
                                        style={{ color: "red" }}
                                    />
                                </Tooltip>
                            )}
                            <span
                                style={{
                                    color: isClosedWithOffers
                                        ? "red"
                                        : "inherit",
                                    fontWeight: count > 0 ? "bold" : "normal",
                                }}
                            >
                                {count}
                            </span>
                        </div>
                    );
                },
            },
            {
                headerName: "Actions",
                field: "actions",
                width: 120,
                sortable: false,
                filter: false,
                cellRenderer: (params) => {
                    return (
                        <AddressActions
                            record={params.data}
                            setAddresses={setAddresses}
                            fetchAddresses={fetchAddresses}
                        />
                    );
                },
                pinned: "right",
            },
        ],
        []
    );

    // Extract fetchAddresses function to be reusable
    const fetchAddresses = useCallback(async () => {
        setLoading(true);
        try {
            // Build brand filter only
            const filters = {};

            // Add brand filter - only apply if not all items are selected (optimization)
            filters.brandId = [{ in: selectedBrandIds }];

            const result = await getAddresses(
                pagination.current,
                pagination.pageSize,
                Object.keys(filters).length > 0 ? filters : undefined,
                [["status", "DESC"]]
            );

            if (typeof result === "string") {
                message.error(result);
                return;
            }

            setAddresses(result.data || []);
            setPagination((prev) => ({
                ...prev,
                total: result.pagination?.total || 0,
                current: result.pagination?.page || prev.current,
                pageSize: result.pagination?.limit || prev.pageSize,
                pages: result.pagination?.pages || 1,
            }));
        } catch (err) {
            console.error(err);
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
        fetchAddresses();
    }, [fetchAddresses]);

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
                style={{ width: "100%", height: "75dvh" }}
            >
                <AgGridReact
                    rowData={addresses}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    gridOptions={gridOptions}
                    domLayout="normal"
                    loading={loading}
                    rowSelection="single"
                    overlayLoadingTemplate={
                        '<span class="ag-overlay-loading-center">Loading...</span>'
                    }
                    getRowStyle={(params) => {
                        // Make entire row red if it's a closed PO box with related offers
                        if (
                            params.data.status === "closed" &&
                            params.data.relatedOffersCount > 0
                        ) {
                            return { backgroundColor: "#ffebee" };
                        }
                        return null;
                    }}
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

export default AddressTable;
