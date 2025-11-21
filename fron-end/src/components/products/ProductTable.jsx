import React, {
    useCallback,
    useMemo,
    useRef,
    useState,
    useEffect,
    memo,
    forwardRef,
    useImperativeHandle,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Pagination, Modal, message, Select } from "antd";
import { getProducts, deleteProduct } from "../../api/product";
import { mapAgToApiFilters } from "../../util/tableHelpers";
import ProductActions from "./ProductActions";
import ProductForm from "./ProductForm";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

ModuleRegistry.registerModules([AllCommunityModule]);

const ProductTable = memo(function ProductTable({ filters, onRowClick }) {
    const gridRef = useRef(null);

    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [total, setTotal] = useState(0);
    const [filterTrigger, setFilterTrigger] = useState(0);
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

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
                headerName: "Product Name",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "code",
                headerName: "Product Code",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "internalCode",
                headerName: "Internal Code",
                sortable: true,
                filter: "agNumberColumnFilter",
            },
            {
                field: "representation",
                headerName: "Representation",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "categories",
                headerName: "Categories",
                sortable: false,
                filter: false,
                valueGetter: (params) => {
                    if (
                        params.data?.categories &&
                        Array.isArray(params.data.categories)
                    ) {
                        return params.data.categories
                            .map((cat) => cat.name)
                            .join(", ");
                    }
                    return "-";
                },
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
                    <ProductActions
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

            const result = await getProducts(page, pageSize, apiFilters, sort);

            const dataToSet = result?.data || [];

            setRowData(dataToSet);
            setTotal(result?.pagination?.total || 0);

            if (result?.pagination?.page) setPage(result.pagination.page);
            if (result?.pagination?.limit) setPageSize(result.pagination.limit);
        } catch (e) {
            console.error("Failed to load products:", e);
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
        setSelectedProduct(record);
        setIsUpdateModalVisible(true);
    };

    const handleDelete = async (record) => {
        try {
            await deleteProduct(record.id);
            message.success("Product deleted successfully");
            fetchData();
        } catch (error) {
            console.error("Error deleting product:", error);
            message.error(
                error?.response?.data?.message || "Failed to delete product"
            );
        }
    };

    const handleUpdateSuccess = () => {
        setIsUpdateModalVisible(false);
        setSelectedProduct(null);
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
                    showTotal={(total) => `Total ${total} products`}
                />
            </div>

            <Modal
                title="Update Product"
                open={isUpdateModalVisible}
                onCancel={() => setIsUpdateModalVisible(false)}
                footer={null}
                width={800}
            >
                <ProductForm
                    initialValues={selectedProduct}
                    onSuccess={handleUpdateSuccess}
                />
            </Modal>
        </div>
    );
});

export default ProductTable;
