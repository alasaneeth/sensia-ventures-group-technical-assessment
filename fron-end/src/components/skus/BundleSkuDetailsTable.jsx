import React, { useMemo, memo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Empty } from "antd";

ModuleRegistry.registerModules([AllCommunityModule]);

const BundleSkuDetailsTable = memo(function BundleSkuDetailsTable({ bundleSkuData }) {
    // Flatten SKUs from bundle for display
    const rowData = useMemo(() => {
        if (!bundleSkuData?.skus || !Array.isArray(bundleSkuData.skus)) {
            return [];
        }

        return bundleSkuData.skus.map((sku) => ({
            ...sku,
            bundleCode: bundleSkuData.code,
            bundleDescription: bundleSkuData.description,
        }));
    }, [bundleSkuData]);

    const columnDefs = useMemo(
        () => [
            {
                field: "id",
                headerName: "SKU ID",
                width: 90,
                sortable: true,
                filter: "agNumberColumnFilter",
                valueGetter: (p) => (p.data?.id ? BigInt(p.data.id) : null),
            },
            {
                field: "bundleCode",
                headerName: "Bundle SKU Code",
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
                field: "productVariation.description",
                headerName: "Product Variation Description",
                sortable: true,
                filter: "agTextColumnFilter",
                valueGetter: (params) =>
                    params.data?.productVariation?.description || "-",
            },
            {
                field: "productVariation.product.categories",
                headerName: "Category",
                sortable: false,
                filter: false,
                valueGetter: (params) => {
                    const categories = params.data?.productVariation?.product?.categories;
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
                valueFormatter: (p) =>
                    p.value ? parseFloat(p.value).toFixed(2) : "0.00",
            },
            {
                field: "discount",
                headerName: "Discount",
                sortable: true,
                filter: "agNumberColumnFilter",
                valueFormatter: (p) =>
                    p.value ? parseFloat(p.value).toFixed(2) : "0.00",
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
                valueFormatter: (p) =>
                    p.value ? parseFloat(p.value).toFixed(2) : "0.00",
            },
            {
                field: "rule",
                headerName: "Rule",
                sortable: true,
                filter: "agTextColumnFilter",
            },
            {
                field: "ifGiftVisible",
                headerName: "If Gift Visible",
                sortable: true,
                filter: "agSetColumnFilter",
                valueFormatter: (p) => (p.value ? "Yes" : "No"),
            },
            {
                field: "currency",
                headerName: "Currency",
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
        }),
        []
    );

    if (!rowData || rowData.length === 0) {
        return <Empty description="No SKUs in this bundle" />;
    }

    return (
        <div style={{ height: "100%", width: "100%" }}>
            <div
                className="ag-theme-quartz"
                style={{ height: "calc(100vh - 300px)", width: "100%" }}
            >
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    gridOptions={gridOptions}
                    pagination={false}
                    rowSelection="single"
                />
            </div>
        </div>
    );
});

export default BundleSkuDetailsTable;
