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
import { getBundleSkus, deleteBundleSku } from "../../api/bundleSku";
import { mapAgToApiFilters } from "../../util/tableHelpers";
import BundleSkuActions from "./BundleSkuActions";
import BundleSkuForm from "./BundleSkuForm";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

ModuleRegistry.registerModules([AllCommunityModule]);

const BundleSkuTable = memo(function BundleSkuTable({ filters, onRowClick }) {
    const gridRef = useRef(null);

    const [rowData, setRowData] = useState([]);
    const [originalData, setOriginalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [total, setTotal] = useState(0);
    const [filterTrigger, setFilterTrigger] = useState(0);
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [selectedBundleSku, setSelectedBundleSku] = useState(null);

    const gridFiltersRef = useRef({});
    const parentFiltersRef = useRef({});
    const sortRef = useRef([]);
    const lastReqRef = useRef(0);

    const { selectedBrandIds } = useGlobalCompanyBrandFilter();

    const columnDefs = useMemo(
        () => [
            {
                field: "bundleSkuId",
                headerName: "Bundle SKU ID",
                width: 100,
                sortable: true,
                filter: "agNumberColumnFilter",
            },
            {
                field: "brand.company.name",
                headerName: "Company",
                width: 140,
                sortable: true,
                filter: false,
                valueGetter: (params) =>
                    params.data?.brand?.company?.name || "-",
            },
            {
                field: "brand.name",
                headerName: "Brand",
                width: 140,
                sortable: true,
                filter: false,
                valueGetter: (params) => params.data?.brand?.name || "-",
            },
            {
                field: "code",
                headerName: "Bundle SKU Code",
                width: 140,
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "name",
                headerName: "Bundle Name",
                width: 160,
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "description",
                headerName: "Bundle Description",
                width: 160,
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "price",
                headerName: "Bundle Price",
                width: 140,
                sortable: true,
                filter: false,
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
                headerName: "Bundle Discount",
                width: 140,
                sortable: true,
                filter: false,
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
                headerName: "Bundle Price to Pay",
                width: 160,
                sortable: true,
                filter: false,
                valueGetter: (params) => params.data?.priceToPay ?? null,
                cellRenderer: (params) => {
                    if (params.value === null || params.value === undefined)
                        return "-";
                    const currency = params.data?.currency || "€";
                    return `${currency} ${Number(params.value).toFixed(2)}`;
                },
            },
            // SKU Fields - Sorting disabled
            {
                field: "skuCode",
                headerName: "SKU Code",
                width: 120,
                sortable: false,
                filter: "agTextColumnFilter",
            },
            {
                field: "skuName",
                headerName: "SKU Name",
                width: 140,
                sortable: false,
                filter: "agTextColumnFilter",
            },
            {
                field: "skuPrice",
                headerName: "SKU Price",
                width: 110,
                sortable: false,
                filter: false,
                cellRenderer: (params) => {
                    if (params.value === null || params.value === undefined)
                        return "-";
                    const currency = params.data?.skuCurrency || "€";
                    return `${currency} ${Number(params.value).toFixed(2)}`;
                },
            },
            {
                field: "skuDiscount",
                headerName: "SKU Discount",
                width: 120,
                sortable: false,
                filter: false,
                cellRenderer: (params) => {
                    if (params.value === null || params.value === undefined)
                        return "-";
                    const currency = params.data?.skuCurrency || "€";
                    return `${currency} ${Number(params.value).toFixed(2)}`;
                },
            },
            {
                field: "skuPriceToPay",
                headerName: "Price to Pay",
                width: 130,
                sortable: false,
                filter: false,
                cellRenderer: (params) => {
                    if (params.value === null || params.value === undefined)
                        return "-";
                    const currency = params.data?.skuCurrency || "€";
                    return `${currency} ${Number(params.value).toFixed(2)}`;
                },
            },
            {
                field: "skuQuantity",
                headerName: "SKU Quantity",
                width: 120,
                sortable: false,
                filter: false,
            },
            {
                field: "skuQtyDetail",
                headerName: "Qty Detail",
                width: 120,
                sortable: false,
                filter: "agTextColumnFilter",
            },
            {
                field: "skuUpsell",
                headerName: "Upsell",
                width: 100,
                sortable: false,
                filter: "agTextColumnFilter",
            },
            {
                field: "skuRule",
                headerName: "Rule",
                width: 100,
                sortable: false,
                filter: "agTextColumnFilter",
            },
            {
                field: "productName",
                headerName: "Product Name",
                width: 160,
                sortable: false,
                filter: "agTextColumnFilter",
            },
            {
                field: "productCode",
                headerName: "Product Code",
                width: 140,
                sortable: false,
                filter: "agTextColumnFilter",
            },
            {
                field: "variationName",
                headerName: "Variation Name",
                width: 160,
                sortable: false,
                filter: "agTextColumnFilter",
            },
            {
                field: "variationUpcCode",
                headerName: "Variation UPC Code",
                width: 170,
                sortable: false,
                filter: "agTextColumnFilter",
            },
            {
                headerName: "Actions",
                field: "actions",
                width: 120,
                sortable: false,
                filter: false,
                pinned: "right",
                cellRenderer: (params) => {
                    if (params.data.blockOrder !== 0) return null;
                    return (
                        <BundleSkuActions
                            record={params.data}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                        />
                    );
                },
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
        const reqId = ++lastReqRef.current;
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

            const result = await getBundleSkus(
                page,
                pageSize,
                apiFilters,
                sort
            );

            if (reqId !== lastReqRef.current) return; // stale, ignore

            const renderData = [];
            let blockIdCounter = 0;

            result.data?.forEach((bundleSku, rowIndex) => {
                const blockId = blockIdCounter++;
                const mark = rowIndex % 2;

                const baseBundleSku = {
                    bundleSkuId: bundleSku.id,
                    ...bundleSku,
                };

                if (!bundleSku.skus || bundleSku.skus.length === 0) {
                    renderData.push({
                        ...baseBundleSku,
                        id: bundleSku.id,
                        _rowId: `${bundleSku.id}:root`,
                        blockId,
                        blockOrder: 0,
                        mark,
                        _blockSortData: bundleSku,
                        bundleName: bundleSku.name,
                    });
                    return;
                }

                // Per-SKU rows
                bundleSku.skus.forEach((sku, i) => {
                    const row = {
                        ...baseBundleSku,
                        id: bundleSku.id,
                        _rowId: `${bundleSku.id}:${sku.id}`,
                        blockId,
                        blockOrder: i,
                        mark,
                        skuCode: sku.code,
                        skuName: sku.name,
                        skuPrice: sku.price,
                        skuDiscount: sku.discount,
                        skuPriceToPay: sku.priceToPay,
                        skuQuantity: sku.quantity,
                        skuQtyDetail: sku.qtyDetail,
                        skuUpsell: sku.upsell,
                        skuRule: sku.rule,
                        skuCurrency: sku.currency,
                        productName: sku.productVariation?.product?.name || "-",
                        productCode: sku.productVariation?.product?.code || "-",
                        variationName: sku.productVariation?.name || "-",
                        variationUpcCode: sku.productVariation?.upcCode || "-",
                    };
                    if (i === 0) row._blockSortData = row;
                    renderData.push(row);
                });
            });

            setOriginalData(result.data);
            setRowData(renderData);
            setTotal(result?.pagination?.total || 0);

            if (result?.pagination?.page) setPage(result.pagination.page);
            if (result?.pagination?.limit) setPageSize(result.pagination.limit);
        } catch (e) {
            if (reqId === lastReqRef.current) {
                console.error("Failed to load bundle SKUs:", e);
                setRowData([]);
                setTotal(0);
            }
        } finally {
            if (reqId === lastReqRef.current) setLoading(false);
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
        const cols = gridRef.current?.api?.getColumns?.() || [];
        const sortModel = cols
            .map((c) => ({
                colId: c.getColId(),
                sort: c.getSort?.(),
                sortIndex: c.getSortIndex?.() ?? 0,
            }))
            .filter((c) => c.sort)
            .sort((a, b) => a.sortIndex - b.sortIndex)
            .map(({ colId, sort }) => ({ colId, sort }));

        sortRef.current = sortModel;
        setFilterTrigger((prev) => prev + 1);
    }, []);

    const postSortRows = useCallback((params) => {
        params.nodes.sort((a, b) => {
            const aId = a.data?.blockId,
                bId = b.data?.blockId;
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
        setSelectedBundleSku(record);
        setIsUpdateModalVisible(true);
    };

    const handleDelete = async (record) => {
        try {
            await deleteBundleSku(record.id);
            message.success("Bundle SKU deleted successfully");
            fetchData();
        } catch (error) {
            console.error("Error deleting bundle SKU:", error);
            message.error(
                error?.response?.data?.message || "Failed to delete bundle SKU"
            );
        }
    };

    const handleUpdateSuccess = () => {
        setIsUpdateModalVisible(false);
        setSelectedBundleSku(null);
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
                    getRowStyle={getRowStyle}
                    postSortRows={postSortRows}
                    getRowId={(p) => p.data._rowId}
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
                    showTotal={(total) => `Total ${total} bundle SKUs`}
                />
            </div>

            <Modal
                title="Update Bundle SKU"
                open={isUpdateModalVisible}
                onCancel={() => setIsUpdateModalVisible(false)}
                footer={null}
                width={800}
            >
                <BundleSkuForm
                    initialValues={selectedBundleSku}
                    onSuccess={handleUpdateSuccess}
                />
            </Modal>
        </div>
    );
});

export default BundleSkuTable;
