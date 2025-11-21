import { AgGridReact } from "ag-grid-react";
import { getCountries } from "../../api/countries";
import { message, Pagination, Modal, Space, Tag, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useState, useMemo, useCallback } from "react";
import CountryActions from "./CountryActions";
import CountryForm from "./CountryForm";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

function CountryTable() {
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
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
                headerName: "ID",
                field: "id",
                sortable: true,
                filter: "agNumberColumnFilter",
                width: 100,
            },
            {
                headerName: "Country",
                field: "country",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 200,
                valueFormatter: (params) => {
                    if (!params.value) return "";
                    return (
                        params.value.charAt(0).toUpperCase() +
                        params.value.slice(1)
                    );
                },
            },
            {
                headerName: "Company Name",
                field: "brand.company.name",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.brand?.company?.name || "-";
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
                headerName: "Actions",
                field: "actions",
                width: 120,
                sortable: false,
                filter: false,
                cellRenderer: (params) => {
                    return (
                        <CountryActions
                            record={params.data}
                            setCountries={setCountries}
                            fetchCountries={fetchCountries}
                        />
                    );
                },
                pinned: "right",
            },
        ],
        []
    );

    // Extract fetchCountries function to be reusable
    const fetchCountries = useCallback(async () => {
        setLoading(true);
        try {
            // Build brand filter only
            const filters = {};

            // Add brand filter - only apply if not all items are selected (optimization)

            filters.brandId = [{ in: selectedBrandIds }];

            const result = await getCountries(
                pagination.current,
                pagination.pageSize,
                Object.keys(filters).length > 0 ? filters : undefined
            );

            if (typeof result === "string") {
                message.error(result);
                return;
            }

            setCountries(result.data || []);
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
        fetchCountries();
    }, [fetchCountries]);

    // Reset to first page when filter changes
    useEffect(() => {
        setPagination((prev) => ({ ...prev, current: 1 }));
    }, [selectedBrandIds, brands.length]);

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

    const handleAdd = () => {
        setIsAddModalVisible(true);
    };

    const handleAddSubmit = () => {
        setIsAddModalVisible(false);
        fetchCountries();
    };

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header with Add Button */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    Add Country
                </Button>
            </div>

            <Modal
                title="Add Country"
                open={isAddModalVisible}
                onCancel={() => setIsAddModalVisible(false)}
                footer={null}
                width={600}
            >
                <CountryForm
                    onSubmit={handleAddSubmit}
                    onCancel={() => setIsAddModalVisible(false)}
                />
            </Modal>

            <div
                className="ag-theme-quartz"
                style={{ width: "100%", height: "75dvh" }}
            >
                <AgGridReact
                    rowData={countries}
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

export default CountryTable;
