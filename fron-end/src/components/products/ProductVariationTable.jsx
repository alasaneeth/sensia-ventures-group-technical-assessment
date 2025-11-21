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
import {
    getProductVariations,
    deleteProductVariation,
} from "../../api/productVariation";
import { mapAgToApiFilters } from "../../util/tableHelpers";
import ProductVariationActions from "./ProductVariationActions";
import ProductVariationForm from "./ProductVariationForm";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

ModuleRegistry.registerModules([AllCommunityModule]);

const ProductVariationTable = memo(function ProductVariationTable({
    filters,
    onRowClick,
}) {
    const gridRef = useRef(null);

    const [rowData, setRowData] = useState([]);
    const [rawVariations, setRawVariations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [total, setTotal] = useState(0);
    const [filterTrigger, setFilterTrigger] = useState(0);
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [selectedProductVariation, setSelectedProductVariation] =
        useState(null);

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
            // Product fields
            {
                field: "product.name",
                headerName: "Product Name",
                sortable: false,
                filter: false,
                valueGetter: (params) => params.data?.product?.name || "-",
            },
            {
                field: "product.code",
                headerName: "Product Code",
                sortable: false,
                filter: false,
                valueGetter: (params) => params.data?.product?.code || "-",
            },
            {
                field: "product.internalCode",
                headerName: "Product Internal Code",
                sortable: false,
                filter: false,
                valueGetter: (params) =>
                    params.data?.product?.internalCode ?? "-",
            },
            {
                field: "product.representation",
                headerName: "Product Representation",
                sortable: false,
                filter: false,
                valueGetter: (params) =>
                    params.data?.product?.representation || "-",
            },
            {
                field: "brand.company.name",
                headerName: "Company",
                sortable: false,
                filter: false,
                valueGetter: (params) =>
                    params.data?.brand?.company?.name || "-",
            },
            {
                field: "brand.name",
                headerName: "Brand",
                sortable: false,
                filter: false,
                valueGetter: (params) => params.data?.brand?.name || "-",
            },
            // Product variation fields
            {
                field: "name",
                headerName: "Variation Name",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "code",
                headerName: "Variation Code",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "variation",
                headerName: "Variation",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "programTime",
                headerName: "Variation Program Time",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "posology",
                headerName: "Variation Posology",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "description",
                headerName: "Variation Description",
                sortable: true,
                filter: "agTextColumnFilter",
                width: 200,
            },
            {
                field: "pricingPerItem",
                headerName: "Variation Price/Item",
                sortable: true,
                filter: "agNumberColumnFilter",
                valueGetter: (params) => {
                    if (params.data?.pricingPerItem) {
                        const currency = params.data?.currency || "";
                        return `${params.data.pricingPerItem} ${currency}`.trim();
                    }
                    return "-";
                },
            },
            {
                field: "upcCode",
                headerName: "Variation UPC Code",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "formulaProductVariationFromLaboratory",
                headerName: "Variation Lab Status",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "supplementFacts",
                headerName: "Variation Supplement Facts",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "instructions",
                headerName: "Variation Instructions",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "manufacturedDescription",
                headerName: "Variation Manufactured Description",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "frontClaims",
                headerName: "Variation Front Claims",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "fdaStatements",
                headerName: "Variation FDA Statements",
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
                        params.data?.product?.categories &&
                        Array.isArray(params.data.product.categories)
                    ) {
                        return params.data.product.categories
                            .map((cat) => cat.name)
                            .join(", ");
                    }
                    return "-";
                },
            },
            {
                headerName: "Actions",
                field: "actions",
                width: 120,
                sortable: false,
                filter: false,
                pinned: "right",
                cellRenderer: (params) => (
                    <ProductVariationActions
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

            const result = await getProductVariations(
                page,
                pageSize,
                apiFilters,
                sort
            );

            const variations = result?.data || [];

            // Group variations by product so all variations for the same product
            // share the same blockId and background color (mark), while
            // blockOrder increases within the block.
            const variationsByProduct = new Map();
            variations.forEach((variation) => {
                const productId = variation.product?.id ?? `np-${variation.id}`;
                if (!variationsByProduct.has(productId)) {
                    variationsByProduct.set(productId, []);
                }
                variationsByProduct.get(productId).push(variation);
            });

            const renderData = [];
            let blockIdCounter = 0;

            Array.from(variationsByProduct.entries()).forEach(
                ([productId, productVariations], groupIndex) => {
                    const blockId = blockIdCounter++;
                    const mark = groupIndex % 2;

                    productVariations.forEach((variation, idx) => {
                        const row = {
                            ...variation,
                            _rowId: `${productId}:${variation.id}`,
                            blockId,
                            blockOrder: idx,
                            mark,
                            _blockSortData: variation,
                        };

                        renderData.push(row);
                    });
                }
            );

            setRawVariations(variations);
            setRowData(renderData);
            setTotal(result?.pagination?.total || 0);

            if (result?.pagination?.page) setPage(result.pagination.page);
            if (result?.pagination?.limit) setPageSize(result.pagination.limit);
        } catch (e) {
            console.error("Failed to load product variations:", e);
            setRawVariations([]);
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

    // Keep rows within the same block together after sorting
    const postSortRows = useCallback((params) => {
        params.nodes.sort((a, b) => {
            const aId = a.data?.blockId;
            const bId = b.data?.blockId;
            if (aId !== bId) return 0;
            return (a.data?.blockOrder ?? 0) - (b.data?.blockOrder ?? 0);
        });
    }, []);

    const getRowStyle = useCallback((params) => {
        const mark = params.data?.mark ?? 0;
        const colors = ["#ececec"];
        return { backgroundColor: colors[mark] };
    }, []);

    const handlePageChange = (newPage, newPageSize) => {
        setPage(newPage);
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
            setPage(1);
        }
    };

    const handleUpdate = (record) => {
        setSelectedProductVariation(record);
        setIsUpdateModalVisible(true);
    };

    const handleDelete = async (record) => {
        try {
            await deleteProductVariation(record.id);
            message.success("Product variation deleted successfully");
            fetchData();
        } catch (error) {
            console.error("Error deleting product variation:", error);
            message.error(
                error?.response?.data?.message ||
                    "Failed to delete product variation"
            );
        }
    };

    const handleUpdateSuccess = () => {
        setIsUpdateModalVisible(false);
        setSelectedProductVariation(null);
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
                    postSortRows={postSortRows}
                    getRowStyle={getRowStyle}
                    getRowId={(p) => p.data._rowId || String(p.data.id)}
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
                    showTotal={(total) => `Total ${total} product variations`}
                />
            </div>

            <Modal
                title="Update Product Variation"
                open={isUpdateModalVisible}
                onCancel={() => setIsUpdateModalVisible(false)}
                footer={null}
                width={900}
            >
                <ProductVariationForm
                    initialValues={selectedProductVariation}
                    onSuccess={handleUpdateSuccess}
                />
            </Modal>
        </div>
    );
});

export default ProductVariationTable;
