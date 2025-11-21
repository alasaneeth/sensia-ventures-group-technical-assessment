import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { message, Pagination, Modal, Form, Input, Button } from "antd";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { fetchChains, updateChain, deleteChain } from "../../api/offer";
import ChainActions from "./ChainActions";
import { mapAgToApiFilters } from "../../util/tableHelpers";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Chain table component
 * @param {Object} props
 * @param {boolean} props.showActions - Whether to show the actions column
 * @param {Array} props.customData - Custom data to display instead of fetching from API
 * @param {Function} props.onRowClick - Function to call when a row is clicked
 * @param {Function} props.onRowSelect - Function to call when a row is selected
 * @param {boolean} props.selectable - Whether rows are selectable
 */
function ChainTable({
    showActions = true,
    customData = null,
    onRowSelect = null,
    selectable = false,
    inModal = false,
}) {
    const gridRef = useRef(null);
    const [form] = Form.useForm();

    // Track selected row key
    const [selectedRowKey, setSelectedRowKey] = useState(null);
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: inModal ? 2 : 100,
        total: 0,
        pages: 1,
    });

    // Modal states
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedChain, setSelectedChain] = useState(null);

    // Edit form states for Company and Brand
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [selectedBrandId, setSelectedBrandId] = useState(null);

    const filtersRef = useRef({});
    const [updatingOffer, setUpdatingOffer] = useState(false);
    const [filterTrigger, setFilterTrigger] = useState(0);

    // Use global brand filter from header
    const { selectedBrandIds, brands } = useGlobalCompanyBrandFilter();

    // Define column definitions for AG Grid
    const columnDefs = useMemo(() => {
        const baseColumns = [
            {
                field: "id",
                headerName: "Chain ID",
                width: 100,
                sortable: true,
                filter: "agNumberColumnFilter",
            },
            {
                field: "title",
                headerName: "Code",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
            },
            // {
            //     field: 'description',
            //     headerName: 'Description',
            //     sortable: true,
            //     filter: 'agTextColumnFilter',
            //     flex: 2,
            //     minWidth: 200,
            //     valueFormatter: (params) => params.value || 'No description',
            // },
            {
                headerName: "Company",
                field: "brand.company.name",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.brand?.company?.name || null;
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
                    return params.data?.brand?.name || null;
                },
            },
            {
                field: "createdAt",
                headerName: "Created At",
                sortable: true,
                filter: "agDateColumnFilter",
                width: 150,
                valueFormatter: (params) =>
                    params.value
                        ? new Date(params.value).toLocaleDateString()
                        : "-",
            },
        ];

        // Add actions column if showActions is true
        if (showActions) {
            baseColumns.push({
                headerName: "Actions",
                field: "actions",
                sortable: false,
                filter: false,
                width: 90,
                pinned: "right",
                cellRenderer: (params) => (
                    <ChainActions
                        record={params.data}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                ),
            });
        }

        return baseColumns;
    }, [showActions]);

    // Default column definition
    const defaultColDef = useMemo(
        () => ({
            resizable: true,
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

    // Grid options
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

    // Handle update chain
    const handleUpdate = (chain) => {
        setSelectedChain(chain);
        const companyId = chain.companyId || chain.company?.id;
        const brandId = chain.brandId || chain.brand?.id;

        setSelectedCompanyId(companyId);
        setSelectedBrandId(brandId);

        form.setFieldsValue({
            title: chain.title,
            companyId,
            brandId,
        });
        setIsUpdateModalVisible(true);
    };

    // Handle company selection in update form
    const handleCompanySelect = useCallback(
        (company) => {
            const companyId = company?.id || null;
            setSelectedCompanyId(companyId);
            form.setFieldsValue({ companyId });

            // Reset brand when company changes
            if (selectedCompanyId !== companyId) {
                setSelectedBrandId(null);
                form.setFieldsValue({ brandId: null });
            }
        },
        [form, selectedCompanyId]
    );

    // Handle brand selection in update form
    const handleBrandSelect = useCallback(
        (brand) => {
            const brandId = brand?.id || null;
            setSelectedBrandId(brandId);
            form.setFieldsValue({ brandId });
        },
        [form]
    );

    // Handle delete chain
    const handleDelete = (chain) => {
        setSelectedChain(chain);
        setIsDeleteModalVisible(true);
    };

    // Handle update submit
    const handleUpdateSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (!values.companyId) {
                message.error("Please select a company");
                setLoading(false);
                return;
            }

            const result = await updateChain(selectedChain.id, {
                payload: {
                    title: values.title,
                    companyId: values.companyId,
                    brandId: values.brandId || null,
                },
            });

            if (typeof result === "string") {
                message.error(result);
            } else {
                message.success("Chain updated successfully");
                setIsUpdateModalVisible(false);
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error("Error updating chain:", error);
            message.error("Failed to update chain");
        } finally {
            setLoading(false);
        }
    };

    // Handle delete confirm
    const handleDeleteConfirm = async () => {
        try {
            setLoading(true);

            const result = await deleteChain(selectedChain.id);

            if (result !== true && typeof result === "string") {
                message.error(result);
            } else {
                message.success("Chain deleted successfully");
                setIsDeleteModalVisible(false);
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error("Error deleting chain:", error);
            message.error("Failed to delete chain");
        } finally {
            setLoading(false);
        }
    };

    // Fetch chains data or use custom data
    const fetchData = useCallback(async () => {
        if (customData) {
            // Use custom data if provided
            setRowData(customData);
            setPagination((prev) => ({
                ...prev,
                total: customData.length,
                pages: Math.ceil(customData.length / pagination.pageSize),
            }));
        } else {
            // Otherwise fetch from API
            setLoading(true);
            try {
                const filters = mapAgToApiFilters(filtersRef.current);

                // Add brand filter only

                filters.brandId = [{ in: selectedBrandIds }];

                const result = await fetchChains(
                    pagination.current,
                    pagination.pageSize,
                    filters
                );
                if (typeof result === "string") {
                    message.error(result);
                    return;
                }
                const { data, pagination: paginationData } = result;
                setRowData(data || []);
                setPagination((prev) => ({
                    ...prev,
                    total: paginationData?.total || 0,
                    pages: Math.ceil(
                        (paginationData?.total || 0) / pagination.pageSize
                    ),
                }));
            } catch (error) {
                console.error("Error fetching chains:", error);
                message.error("Failed to fetch chains");
            } finally {
                setLoading(false);
            }
        }
    }, [
        pagination.current,
        pagination.pageSize,
        customData,
        selectedBrandIds,
        brands.length,
    ]);

    useEffect(() => {
        fetchData();
    }, [fetchData, filterTrigger]);

    // Handle pagination change
    const handlePageChange = (nextPage, nextPageSize) => {
        setPagination({
            ...pagination,
            current: nextPage,
            pageSize: nextPageSize,
        });
    };

    // Row selection functionality
    const onRowSelected = useCallback(
        (event) => {
            if (selectable && event.node.isSelected()) {
                setSelectedRowKey(event.data.id);
                if (onRowSelect) {
                    onRowSelect(event.data);
                }
            }
        },
        [selectable, onRowSelect]
    );

    // Row click handler
    const onRowClicked = useCallback(
        (event) => {
            if (selectable) {
                const node = event.node;
                node.setSelected(true, true);
            }
        },
        [selectable]
    );

    const onFilterChanged = useCallback((params) => {
        const model = params.api.getFilterModel();
        filtersRef.current = model || {};
        setPagination((prev) => ({
            ...prev,
            current: 1,
        }));
        setFilterTrigger((prev) => prev + 1);
    }, []);

    // Modal cancel handlers
    const handleUpdateCancel = () => {
        setIsUpdateModalVisible(false);
        setSelectedChain(null);
        setSelectedCompanyId(null);
        setSelectedBrandId(null);
        form.resetFields();
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalVisible(false);
        setSelectedChain(null);
    };

    return (
        <div
            style={{ width: "100%", display: "flex", flexDirection: "column" }}
        >
            <div
                className="ag-theme-quartz"
                style={{ width: "100%", height: "75dvh" }}
            >
                <AgGridReact
                    ref={gridRef}
                    gridOptions={gridOptions}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowData={rowData}
                    domLayout="normal"
                    rowSelection={selectable ? "single" : undefined}
                    onRowSelected={onRowSelected}
                    onRowClicked={onRowClicked}
                    onFilterChanged={onFilterChanged}
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

            {/* Update Chain Modal */}
            <Modal
                title="Update Chain"
                open={isUpdateModalVisible}
                onCancel={handleUpdateCancel}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateSubmit}
                >
                    <Form.Item
                        name="title"
                        label="Chain Code"
                        rules={[
                            {
                                required: true,
                                message: "Please enter the chain code",
                            },
                        ]}
                    >
                        <Input placeholder="Enter chain code" />
                    </Form.Item>

                    <Form.Item
                        name="companyId"
                        label="Company"
                        rules={[
                            {
                                required: true,
                                message: "Please select a company",
                            },
                        ]}
                    >
                        <DynamicDropdownMenu
                            onSelect={handleCompanySelect}
                            selectedValue={selectedCompanyId}
                            placeholder="Select Company"
                            fetchFunction={(page, rowsPerPage, passedFilter) =>
                                getCompanies(
                                    page,
                                    rowsPerPage,
                                    passedFilter
                                ).then((result) => ({
                                    pagination: result?.pagination || {},
                                    data: result?.data || [],
                                }))
                            }
                            searchBy="name"
                            setOptions={(data) => {
                                return data.map((c) => {
                                    return {
                                        value: c.id,
                                        label: c.name || `Company ${c.id}`,
                                    };
                                });
                            }}
                        />
                    </Form.Item>

                    <Form.Item name="brandId" label="Brand">
                        <DynamicDropdownMenu
                            key={selectedCompanyId || "no-company"} // Force remount when company changes
                            onSelect={handleBrandSelect}
                            selectedValue={selectedBrandId}
                            placeholder={
                                selectedCompanyId
                                    ? "Select Brand (Optional)"
                                    : "Please select a company first"
                            }
                            disabled={!selectedCompanyId}
                            fetchFunction={(
                                page,
                                rowsPerPage,
                                passedFilter
                            ) => {
                                if (!selectedCompanyId) {
                                    return Promise.resolve({
                                        pagination: {},
                                        data: [],
                                    });
                                }
                                return getBrands(
                                    selectedCompanyId,
                                    page,
                                    rowsPerPage,
                                    passedFilter
                                ).then((result) => ({
                                    pagination: result?.pagination || {},
                                    data: result?.data || [],
                                }));
                            }}
                            searchBy="name"
                            setOptions={(data) => {
                                return data.map((b) => {
                                    return {
                                        value: b.id,
                                        label: b.name || `Brand ${b.id}`,
                                    };
                                });
                            }}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                        >
                            Update
                        </Button>
                        <Button
                            style={{ marginLeft: 8 }}
                            onClick={handleUpdateCancel}
                        >
                            Cancel
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Delete Chain Confirmation Modal */}
            <Modal
                title="Delete Chain"
                open={isDeleteModalVisible}
                onCancel={handleDeleteCancel}
                footer={[
                    <Button key="cancel" onClick={handleDeleteCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="delete"
                        type="primary"
                        danger
                        loading={loading}
                        onClick={handleDeleteConfirm}
                    >
                        Delete
                    </Button>,
                ]}
            >
                <p>Are you sure you want to delete this chain?</p>
                {selectedChain && (
                    <p>
                        <strong>Chain Code:</strong> {selectedChain.title}
                    </p>
                )}
            </Modal>
        </div>
    );
}

export default ChainTable;
