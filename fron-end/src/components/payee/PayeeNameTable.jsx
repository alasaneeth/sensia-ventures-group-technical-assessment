import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
    message,
    Modal,
    Form,
    Input,
    Button,
    Pagination,
    Row,
    Col,
} from "antd";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import {
    getPayeeNames,
    updatePayeename,
    deletePayeeName,
} from "../../api/payeeNames";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import PayeeNameActions from "./PayeeNameActions";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

function PayeeNameTable() {
    const gridRef = useRef(null);
    const [form] = Form.useForm();

    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [, setSearchParams] = useSearchParams();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0,
        pages: 1,
    });

    // Use global brand filter from header
    const { selectedBrandIds, brands } = useGlobalCompanyBrandFilter();

    // Modal states
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedPayee, setSelectedPayee] = useState(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [selectedBrandId, setSelectedBrandId] = useState(null);

    // Handle update payee
    const handleUpdate = useCallback(
        (payee) => {
            setSelectedPayee(payee);
            const companyId =
                payee?.brand?.companyId || payee?.company?.id || null;
            const brandId = payee?.brandId || payee?.brand?.id || null;
            setSelectedCompanyId(companyId);
            setSelectedBrandId(brandId);
            form.setFieldsValue({
                name: payee.name,
                companyId: companyId,
                brandId: brandId,
            });
            setIsUpdateModalVisible(true);
        },
        [form]
    );

    // Handle delete payee
    const handleDelete = useCallback((payee) => {
        setSelectedPayee(payee);
        setIsDeleteModalVisible(true);
    }, []);

    // Define column definitions for AG Grid
    const columnDefs = useMemo(
        () => [
            {
                field: "name",
                headerName: "Payee Name",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 200,
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
                headerName: "Company Name",
                field: "brand.company.name",
                sortable: true,
                filter: "agTextColumnFilter",
                flex: 1,
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.brand?.company?.name || "N/A";
                },
            },
            {
                headerName: "Actions",
                field: "actions",
                sortable: false,
                filter: false,
                width: 90,
                pinned: "right",
                cellRenderer: (params) => (
                    <PayeeNameActions
                        record={params.data}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                ),
            },
        ],
        [handleUpdate, handleDelete]
    );

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

    // Handle company selection in update form
    const handleCompanySelect = (company) => {
        const companyId = company?.id || null;
        setSelectedCompanyId(companyId);
        setSelectedBrandId(null); // Reset brand when company changes
        form.setFieldsValue({
            companyId: companyId,
            brandId: null,
        });
        form.validateFields(["companyId", "brandId"]);
    };

    // Handle brand selection in update form
    const handleBrandSelect = (brand) => {
        const brandId = brand?.id || null;
        setSelectedBrandId(brandId);
        form.setFieldsValue({ brandId: brandId });
        form.validateFields(["brandId"]);
    };

    // Handle update submit
    const handleUpdateSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (!selectedCompanyId) {
                message.error("Please select a company");
                form.setFields([
                    { name: "companyId", errors: ["Please select a company"] },
                ]);
                setLoading(false);
                return;
            }

            if (!selectedBrandId) {
                message.error("Please select a brand");
                form.setFields([
                    { name: "brandId", errors: ["Please select a brand"] },
                ]);
                setLoading(false);
                return;
            }

            const result = await updatePayeename(selectedPayee.id, {
                payload: {
                    name: values.name,
                    brandId: selectedBrandId, // companyId is ignored
                },
            });

            if (typeof result === "string") {
                message.error(result);
            } else {
                message.success("Payee name updated successfully");
                setIsUpdateModalVisible(false);
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error("Error updating payee name:", error);
            message.error("Failed to update payee name");
        } finally {
            setLoading(false);
        }
    };

    // Handle delete confirm
    const handleDeleteConfirm = async () => {
        try {
            setLoading(true);

            const result = await deletePayeeName(selectedPayee.id);

            if (result !== true && typeof result === "string") {
                message.error(result);
            } else {
                message.success("Payee name deleted successfully");
                setIsDeleteModalVisible(false);
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error("Error deleting payee name:", error);
            message.error("Failed to delete payee name");
        } finally {
            setLoading(false);
        }
    };

    // Modal cancel handlers
    const handleUpdateCancel = () => {
        setIsUpdateModalVisible(false);
        setSelectedPayee(null);
        setSelectedCompanyId(null);
        setSelectedBrandId(null);
        form.resetFields();
    };

    const handleDeleteCancel = () => {
        setIsDeleteModalVisible(false);
        setSelectedPayee(null);
    };

    // Fetch payee names data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Build brand filter only
            const filters = {};

            // Add brand filter - only apply if not all items are selected (optimization)

            filters.brandId = [{ in: selectedBrandIds }];

            const result = await getPayeeNames(
                pagination.current,
                pagination.pageSize,
                Object.keys(filters).length > 0 ? filters : undefined
            );

            if (typeof result === "string") {
                message.error(result);
                return;
            }

            setRowData(result.data || []);
            setPagination((prev) => ({
                ...prev,
                total: result.pagination?.total || 0,
                current: result.pagination?.page || prev.current,
                pageSize: result.pagination?.limit || prev.pageSize,
                pages: Math.ceil(
                    (result.pagination?.total || 0) /
                        (result.pagination?.limit || prev.pageSize)
                ),
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
        fetchData();
    }, [fetchData]);

    // Update URL when pagination changes
    useEffect(() => {
        setSearchParams({
            page: pagination.current.toString(),
            rows_per_page: pagination.pageSize.toString(),
        });
    }, [pagination.current, pagination.pageSize, setSearchParams]);

    // Handle pagination change
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
                style={{ width: "100%", height: "75dvh" }}
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

            {/* Update Payee Name Modal */}
            <Modal
                title="Update Payee Name"
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
                        name="name"
                        label="Payee Name"
                        rules={[
                            {
                                required: true,
                                message: "Please enter the payee name",
                            },
                        ]}
                    >
                        <Input placeholder="Enter payee name" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="companyId"
                                label="Company"
                                rules={[
                                    {
                                        required: true,
                                        message: "Please select a company",
                                        validator: (_, value) => {
                                            if (!selectedCompanyId) {
                                                return Promise.reject(
                                                    new Error(
                                                        "Please select a company"
                                                    )
                                                );
                                            }
                                            return Promise.resolve();
                                        },
                                    },
                                ]}
                            >
                                <DynamicDropdownMenu
                                    onSelect={handleCompanySelect}
                                    selectedValue={selectedCompanyId}
                                    placeholder="Select a company"
                                    fetchFunction={(
                                        page,
                                        rowsPerPage,
                                        passedFilter
                                    ) =>
                                        getCompanies(
                                            page,
                                            rowsPerPage,
                                            passedFilter
                                        ).then((result) => ({
                                            pagination:
                                                result?.pagination || {},
                                            data: result?.data || [],
                                        }))
                                    }
                                    searchBy="name"
                                    setOptions={(data) => {
                                        return data.map((c) => {
                                            return {
                                                value: c.id,
                                                label:
                                                    c.name || `Company ${c.id}`,
                                            };
                                        });
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="brandId"
                                label="Brand"
                                rules={[
                                    {
                                        required: true,
                                        message: "Please select a brand",
                                        validator: (_, value) => {
                                            if (!selectedBrandId) {
                                                return Promise.reject(
                                                    new Error(
                                                        "Please select a brand"
                                                    )
                                                );
                                            }
                                            return Promise.resolve();
                                        },
                                    },
                                ]}
                            >
                                <DynamicDropdownMenu
                                    key={selectedCompanyId || "no-company"}
                                    onSelect={handleBrandSelect}
                                    selectedValue={selectedBrandId}
                                    placeholder={
                                        selectedCompanyId
                                            ? "Select a brand"
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
                                            pagination:
                                                result?.pagination || {},
                                            data: result?.data || [],
                                        }));
                                    }}
                                    searchBy="name"
                                    setOptions={(data) => {
                                        return data.map((b) => {
                                            return {
                                                value: b.id,
                                                label:
                                                    b.name || `Brand ${b.id}`,
                                            };
                                        });
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

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

            {/* Delete Payee Name Confirmation Modal */}
            <Modal
                title="Delete Payee Name"
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
                <p>Are you sure you want to delete this payee name?</p>
                {selectedPayee && (
                    <p>
                        <strong>Payee Name:</strong> {selectedPayee.name}
                    </p>
                )}
            </Modal>
        </div>
    );
}

export default PayeeNameTable;
