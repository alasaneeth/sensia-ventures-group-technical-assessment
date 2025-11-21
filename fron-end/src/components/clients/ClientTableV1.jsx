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
import { getClients, getFilteredClients } from "../../api/client";
import ClientActions from "./ClientActions";
import { checkGermany } from "../../util/germanyConverter";
import {
    dateComparator,
    mapAgToApiFilters,
    normalizeDate,
} from "../../util/tableHelpers";

ModuleRegistry.registerModules([AllCommunityModule]);

// The strcutre for filters {country: [{ eq: true }]}
const ClientTableV1 = memo(function ClientTableV1({
    getFilters,
    campaignId,
    filters,
    onRowClick,
}) {
    const gridRef = useRef(null);

    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [total, setTotal] = useState(0);
    const [filterTrigger, setFilterTrigger] = useState(0);

    // Store filters separately - parent filters are already in API format, grid filters need conversion
    const gridFiltersRef = useRef({}); // AG Grid filters that need conversion
    const parentFiltersRef = useRef({}); // Filters from parent that are already in API format
    const sortRef = useRef([]);

    const columnDefs = useMemo(
        () => [
            {
                field: "id",
                headerName: "ID",
                width: 90,
                sortable: true,
                filter: "agNumberColumnFilter",
                valueGetter: (p) => (p.data?.id ? BigInt(p.data.id) : null),
            },

            {
                field: "brand.company.name",
                headerName: "Company",
                sortable: true,
                filter: false,
                valueGetter: (params) =>
                    params.data?.brand?.company?.name || "-",
            },
            {
                field: "brand.name",
                headerName: "Brand",
                sortable: true,
                filter: false,
                valueGetter: (params) => params.data?.brand?.name || "-",
            },
            {
                field: "firstName",
                headerName: "First Name",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "lastName",
                headerName: "Last Name",
                sortable: true,
                filter: "agTextColumnFilter",
            },

            {
                field: "city",
                headerName: "City",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "zipCode",
                headerName: "ZIP/Postal Code",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "country",
                headerName: "Country",
                sortable: true,
                filter: "agTextColumnFilter",
                valueFormatter: (row) => checkGermany(row.value),
            },
            {
                field: "address1",
                headerName: "Address Line 1",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "address2",
                headerName: "Address Line 2",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "address3",
                headerName: "Address Line 3",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "totalAmount",
                headerName: "Total Amount",
                sortable: true,
                filter: "agNumberColumnFilter",
            },
            {
                field: "totalOrders",
                headerName: "Total Orders",
                sortable: true,
                filter: "agNumberColumnFilter",
            },
            {
                field: "totalMails",
                headerName: "Total Mails",
                sortable: true,
                filter: "agNumberColumnFilter",
            },
            {
                field: "listOwner",
                headerName: "List Name",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "gender",
                headerName: "Gender",
                sortable: true,
                filter: "agTextColumnFilter",
                valueFormatter(val) {
                    if (val.value === "F") return "Female";
                    if (val.value === "M") return "Male";
                    if (val.value === "N") return "Not Sure";
                },
            },
            // {
            //     field: "title",
            //     headerName: "Title",
            //     sortable: true,
            //     filter: filters?.title ? false : "agTextColumnFilter",
            // },
            // {
            //     field: "email",
            //     headerName: "Mail",
            //     sortable: true,
            //     filter: filters?.email ? false : "agTextColumnFilter",
            // },
            {
                field: "phone",
                headerName: "Phone",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "state",
                headerName: "State",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            // {
            //     field: "address4",
            //     headerName: "Address Line 4",
            //     sortable: true,
            //     filter: filters?.address4 ? false : "agTextColumnFilter",
            // },
            // {
            //     field: "address5",
            //     headerName: "Address Line 5",
            //     sortable: true,
            //     filter: filters?.address5 ? false : "agTextColumnFilter",
            // },
            {
                field: "lastPurchaseDate",
                headerName: "Last Purchase Date",
                sortable: true,
                filter: "agDateColumnFilter",
                valueGetter: (p) => normalizeDate(p.data?.lastPurchaseDate),
                filterParams: {
                    comparator: dateComparator,
                    browserDatePicker: true,
                },
                valueFormatter: (p) =>
                    p.value ? new Date(p.value).toLocaleDateString() : "",
            },
            {
                field: "birthDate",
                headerName: "Birth Date",
                sortable: true,
                filter: "agDateColumnFilter",
                valueGetter: (p) => normalizeDate(p.data?.birthDate),
                filterParams: {
                    // comparator: dateComparator,
                    browserDatePicker: true,
                },
                valueFormatter: (p) =>
                    p.value ? new Date(p.value).toLocaleDateString() : "",
            },
            {
                field: "isBlacklisted",
                headerName: "Blacklisted",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "importedFrom",
                headerName: "Imported From",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                headerName: "Actions",
                field: "actions",
                width: 120,
                sortable: false,
                filter: false,
                pinned: "right",
                cellRenderer: (params) => <ClientActions record={params} />,
            },
        ],
        [filters]
    );

    const defaultColDef = useMemo(
        () => ({
            resizable: true,
            minWidth: 110,
            sortable: true,
            filter: false,
            filterParams: {
                buttons: ["apply", "clear"],
                closeOnApply: true,
                maxNumConditions: 1,
            },
            comparator: () => 0,
        }),
        []
    );

    const gridOptions = useMemo(
        () => ({
            suppressMultiSort: false,
            multiSortKey: "ctrl",
            autoSizeStrategy: { type: "fitCellContents" },
            animateRows: true,
            suppressPaginationPanel: true,
            onRowClicked: onRowClick
                ? (event) => onRowClick(event.data)
                : undefined,
        }),
        [onRowClick]
    );

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Convert only the AG Grid filters to API format
            const convertedGridFilters = mapAgToApiFilters(
                gridFiltersRef.current
            );

            // Merge the converted grid filters with the parent filters
            const apiFilters = {
                ...convertedGridFilters,
                ...parentFiltersRef.current, // Parent filters take precedence
            };

            const sortModel = sortRef.current;
            let sort;
            if (sortModel?.length) {
                sort = sortModel.map(({ colId, sort }) => ({
                    sortBy: colId,
                    dir: sort,
                }))[0];
            }

            let result;
            if (campaignId) {
                result = await getFilteredClients(
                    page,
                    pageSize,
                    campaignId,
                    apiFilters,
                    sort
                );
            } else {
                result = await getClients(page, pageSize, apiFilters, sort);
            }

            const dataToSet = result?.data || [];
            // Remove the filter from the client side keeo it in the backend
            // gridRef.current?.api && gridRef.current.api.setFilterModel(null);

            setRowData(dataToSet);
            setTotal(result?.pagination?.total || 0);

            if (result?.pagination?.page) setPage(result.pagination.page);
            if (result?.pagination?.limit) setPageSize(result.pagination.limit);
        } catch (e) {
            console.error("Failed to load clients:", e);
            setRowData([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [
        page,
        pageSize,
        campaignId,
        filterTrigger,

    ]);

    // Watch for changes in filters prop from parent
    useEffect(() => {
        if (filters) {
            // Store parent filters separately - these are already in API format
            parentFiltersRef.current = filters;

            console.log(
                "\n######## Parent filters updated ########\n",
                parentFiltersRef.current,
                "\n################\n"
            );

            // Trigger data refresh
            setFilterTrigger((prev) => prev + 1);
        }
    }, [filters]);

    // Initialize grid with filters when component mounts
    useEffect(() => {
        // When the grid first loads, we need to make sure any existing filters are applied
        if (gridRef.current && gridRef.current.api) {
            const api = gridRef.current.api;
            const existingFilters = gridFiltersRef.current;

            // Apply any existing filters to the grid
            if (existingFilters && Object.keys(existingFilters).length > 0) {
                api.setFilterModel(existingFilters);
            }
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, filterTrigger]);

    const onFilterChanged = useCallback(
        (params) => {
            // Get the current filter model from AG Grid
            const model = params.api.getFilterModel();

            // Store only the grid filters - these need conversion
            gridFiltersRef.current = model;

            console.log("AG Grid filters updated:", model);

            // Update parent component's filter reference if available
            if (
                getFilters &&
                typeof getFilters === "object" &&
                "current" in getFilters
            ) {
                // For the parent component, we need to combine both types of filters
                // This is for UI state tracking in the parent, not for API calls
                const combinedFiltersForParent = {
                    ...model, // Grid filters
                    ...parentFiltersRef.current, // Parent filters take precedence
                };

                // Update parent's filter reference
                getFilters.current = combinedFiltersForParent;

                // Call onChange callback to notify parent component
                if (typeof getFilters.onChange === "function") {
                    getFilters.onChange(combinedFiltersForParent);
                }
            }

            // Reset to first page when filters change
            setPage(1);

            // Trigger data refresh
            setFilterTrigger((prev) => prev + 1);
        },
        [getFilters]
    );

    const onSortChanged = useCallback((params) => {
        // Get all columns from AG Grid
        const cols = params.api.getColumns?.() || [];

        // Extract sort information from columns
        const sortModel = cols
            .map((c) => ({
                colId: c.getColId(),
                sort: c.getSort?.(),
                sortIndex: c.getSortIndex?.() ?? 0,
            }))
            .filter((c) => c.sort)
            .sort((a, b) => a.sortIndex - b.sortIndex)
            .map(({ colId, sort }) => ({ colId, sort }));

        // Update sort reference
        sortRef.current = sortModel;

        // Reset to first page when sort changes
        setPage(1);

        // Trigger data refresh
        setFilterTrigger((prev) => prev + 1);
    }, []);

    const handlePageChange = (nextPage, nextPageSize) => {
        // Update page number
        setPage(nextPage);

        // Update page size if it changed
        if (nextPageSize !== pageSize) {
            setPageSize(nextPageSize);
        }

        // Trigger data refresh when page or page size changes
        setFilterTrigger((prev) => prev + 1);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div style={{ width: "100%" }}>
            <div
                className="ag-theme-quartz"
                style={{
                    width: "100%",
                    height: "75dvh",
                }}
            >
                <AgGridReact
                    domLayout="normal"
                    ref={gridRef}
                    gridOptions={gridOptions}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowData={rowData}
                    overlayLoadingTemplate={
                        '<span class="ag-overlay-loading-center">Loading...</span>'
                    }
                    overlayNoRowsTemplate={
                        '<span class="ag-overlay-loading-center">No data available</span>'
                    }
                    styleNonce=""
                    loading={loading}
                    onFilterChanged={onFilterChanged}
                    onSortChanged={onSortChanged}
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
        </div>
    );
});

export default ClientTableV1;
