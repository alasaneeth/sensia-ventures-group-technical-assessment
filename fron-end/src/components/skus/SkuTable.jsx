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
import { Pagination, Modal, message } from "antd";
import { getSkus, deleteSku } from "../../api/sku";
import { mapAgToApiFilters } from "../../util/tableHelpers";
import SkuActions from "./SkuActions";
import SkuForm from "./SkuForm";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

ModuleRegistry.registerModules([AllCommunityModule]);

const SkuTable = memo(function SkuTable({ filters, onRowClick }) {
    const gridRef = useRef(null);

    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [total, setTotal] = useState(0);
    const [filterTrigger, setFilterTrigger] = useState(0);
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [selectedSku, setSelectedSku] = useState(null);

    const gridFiltersRef = useRef({});
    const parentFiltersRef = useRef({});
    const sortRef = useRef([]);

    const { selectedBrandIds } = useGlobalCompanyBrandFilter();

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
                field: "name",
                headerName: "SKU Name",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "code",
                headerName: "SKU Code",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "upsell",
                headerName: "Upsell",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "productVariation.product.name",
                headerName: "Product Name",
                sortable: true,
                filter: "agTextColumnFilter",
                valueGetter: (params) =>
                    params.data?.productVariation?.product?.name || "-",
            },
            {
                field: "productVariation.product.code",
                headerName: "Product Code",
                sortable: true,
                filter: "agTextColumnFilter",
                valueGetter: (params) =>
                    params.data?.productVariation?.product?.code || "-",
            },
            {
                field: "productVariation.name",
                headerName: "Variation Name",
                sortable: true,
                filter: "agTextColumnFilter",
                valueGetter: (params) =>
                    params.data?.productVariation?.name || "-",
            },
            {
                field: "productVariation.upcCode",
                headerName: "Variation UPC Code",
                valueGetter: (params) =>
                    params.data?.productVariation?.upcCode || "-",
            },
            {
                field: "productVariation.product.categories",
                headerName: "Category",
                sortable: false,
                filter: false,
                valueGetter: (params) => {
                    const categories =
                        params.data?.productVariation?.product?.categories;
                    if (categories && Array.isArray(categories)) {
                        return categories.map((cat) => cat.name).join(", ");
                    }
                    return "-";
                },
            },
            {
                field: "quantity",
                headerName: "SKU Quantity",
                sortable: true,
                filter: "agNumberColumnFilter",
            },
            {
                field: "qtyDetail",
                headerName: "SKU Quantity Detail",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "description",
                headerName: "SKU Description",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "price",
                headerName: "Price",
                sortable: true,
                filter: "agNumberColumnFilter",
                valueGetter: (params) => params.data?.price ?? null,
                cellRenderer: (params) => {
                    if (params.value === null || params.value === undefined)
                        return "-";
                    const currency = params.data?.currency || "€";
                    return `${currency} ${Number(params.value).toFixed(2)}`;
                },
            },
            {
                field: "discount",
                headerName: "Discount",
                sortable: true,
                filter: "agNumberColumnFilter",
                valueGetter: (params) => params.data?.discount ?? null,
                cellRenderer: (params) => {
                    if (params.value === null || params.value === undefined)
                        return "-";
                    const currency = params.data?.currency || "€";
                    return `${currency} ${Number(params.value).toFixed(2)}`;
                },
            },
            {
                field: "priceToPay",
                headerName: "Price to Pay",
                sortable: true,
                filter: "agNumberColumnFilter",
                valueGetter: (params) => {
                    const price = parseFloat(params.data?.price || 0);
                    const discount = parseFloat(params.data?.discount || 0);
                    return price - discount;
                },
                cellRenderer: (params) => {
                    if (params.value === null || params.value === undefined)
                        return "-";
                    const currency = params.data?.currency || "€";
                    return `${currency} ${Number(params.value).toFixed(2)}`;
                },
            },
            {
                field: "rule",
                headerName: "Rule",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "createdAt",
                headerName: "Created At",
                sortable: true,
                filter: "agDateColumnFilter",
                filterParams: {
                    browserDatePicker: true,
                },
                valueFormatter: (p) =>
                    p.value ? new Date(p.value).toLocaleDateString() : "",
            },
            {
                headerName: "Actions",
                field: "actions",
                width: 120,
                sortable: false,
                filter: false,
                pinned: "right",
                cellRenderer: (params) => (
                    <SkuActions
                        record={params.data}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                ),
            },
        ],
        []
    );

    const defaultColDef = useMemo(
        () => ({
            resizable: true,
            flex: 1,
            minWidth: 150,
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
            // Get filter model from grid
            const filterModel = gridRef.current?.api?.getFilterModel();

            const convertedGridFilters = mapAgToApiFilters(filterModel || {});

            const apiFilters = {
                ...convertedGridFilters,
                ...parentFiltersRef.current,
            };

            const sortModel = sortRef.current;
            let sort;
            if (sortModel?.length) {
                sort = sortModel.map(({ colId, sort }) => ({
                    sortBy: colId,
                    dir: sort,
                }))[0];
            }

            const result = await getSkus(page, pageSize, apiFilters, sort);

            const dataToSet = result?.data || [];

            setRowData(dataToSet);
            setTotal(result?.pagination?.total || 0);

            if (result?.pagination?.page) setPage(result.pagination.page);
            if (result?.pagination?.limit) setPageSize(result.pagination.limit);
        } catch (e) {
            console.error("Failed to load SKUs:", e);
            setRowData([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, filterTrigger]);

    useEffect(() => {
        if (filters) {
            parentFiltersRef.current = filters;
            setFilterTrigger((prev) => prev + 1);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onFilterChanged = useCallback(() => {
        const filterModel = gridRef.current?.api?.getFilterModel();
        gridFiltersRef.current = filterModel || {};
        setPage(1);
        setFilterTrigger((prev) => prev + 1);
    }, []);

    const onSortChanged = useCallback(() => {
        const sortModel = gridRef.current?.api?.getColumnState();
        const activeSorts = sortModel?.filter((col) => col.sort != null);
        sortRef.current = activeSorts || [];
        setFilterTrigger((prev) => prev + 1);
    }, []);

    const handlePageChange = (newPage, newPageSize) => {
        setPage(newPage);
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
            setPage(1);
        }
    };

    const handleUpdate = (record) => {
        setSelectedSku(record);
        setIsUpdateModalVisible(true);
    };

    const handleDelete = async (record) => {
        try {
            await deleteSku(record.id);
            message.success("SKU deleted successfully");
            fetchData();
        } catch (error) {
            console.error("Error deleting SKU:", error);
            message.error(
                error?.response?.data?.message || "Failed to delete SKU"
            );
        }
    };

    const handleUpdateSuccess = () => {
        setIsUpdateModalVisible(false);
        setSelectedSku(null);
        fetchData();
    };

    return (
        <div style={{ height: "100%", width: "100%" }}>
            <div
                className="ag-theme-quartz"
                style={{ height: "calc(100vh - 250px)", width: "100%" }}
            >
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    gridOptions={gridOptions}
                    loading={loading}
                    onFilterChanged={onFilterChanged}
                    onSortChanged={onSortChanged}
                    pagination={false}
                    rowSelection="single"
                />
            </div>
            <div
                style={{
                    marginTop: "1rem",
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    onChange={handlePageChange}
                    showSizeChanger
                    pageSizeOptions={[100, 150, 175, 200]}
                    showTotal={(total) => `Total ${total} SKUs`}
                />
            </div>

            <Modal
                title="Update SKU"
                open={isUpdateModalVisible}
                onCancel={() => setIsUpdateModalVisible(false)}
                footer={null}
                width={800}
            >
                <SkuForm
                    initialValues={selectedSku}
                    onSuccess={handleUpdateSuccess}
                />
            </Modal>
        </div>
    );
});

export default SkuTable;
