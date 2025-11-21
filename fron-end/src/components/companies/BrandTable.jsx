import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { message, Modal, Form, Input, Button, Pagination } from "antd";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { getBrands, updateBrand, deleteBrand } from "../../api/brands";
import BrandActions from "./BrandActions";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

function BrandTable({ companyId, refreshTrigger }) {
    const gridRef = useRef(null);
    const [form] = Form.useForm();
    
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0,
        pages: 1
    });
    
    // Modal states
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState(null);
    
    // Define column definitions for AG Grid
    const columnDefs = useMemo(() => [
        {
            field: 'id',
            headerName: 'ID',
            sortable: true,
            filter: 'agNumberColumnFilter',
            width: 80,
        },
        {
            field: 'name',
            headerName: 'Brand Name',
            sortable: true,
            filter: 'agTextColumnFilter',
            flex: 1,
            minWidth: 200,
        },
        {
            field: 'description',
            headerName: 'Description',
            sortable: true,
            filter: 'agTextColumnFilter',
            flex: 1,
            minWidth: 250,
            valueGetter: (params) => params.data?.description || '-',
        },
        {
            field: 'createdAt',
            headerName: 'Created At',
            sortable: true,
            filter: 'agDateColumnFilter',
            width: 180,
            valueGetter: (params) => {
                if (!params.data?.createdAt) return '-';
                return new Date(params.data.createdAt).toLocaleString();
            },
        },
        {
            headerName: 'Actions',
            field: 'actions',
            sortable: false,
            filter: false,
            width: 90,
            pinned: 'right',
            cellRenderer: (params) => (
                <BrandActions 
                    record={params.data} 
                    onUpdate={handleUpdate} 
                    onDelete={handleDelete} 
                />
            ),
        }
    ], []);
    
    // Default column definition
    const defaultColDef = useMemo(() => ({
        resizable: true,
        sortable: true,
        filter: true,
        filterParams: {
            buttons: ['apply', 'clear'],
            closeOnApply: true,
            maxNumConditions: 1,
        },
    }), []);
    
    // Grid options
    const gridOptions = useMemo(() => ({
        suppressMultiSort: false,
        multiSortKey: 'ctrl',
        animateRows: true,
        suppressPaginationPanel: true,
        suppressColumnVirtualisation: true,
    }), []);

    // Handle update brand
    const handleUpdate = (brand) => {
        setSelectedBrand(brand);
        form.setFieldsValue({ 
            name: brand.name,
            description: brand.description || ''
        });
        setIsUpdateModalVisible(true);
    };
    
    // Handle delete brand
    const handleDelete = (brand) => {
        setSelectedBrand(brand);
        setIsDeleteModalVisible(true);
    };
    
    // Handle update submit
    const handleUpdateSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            const result = await updateBrand(selectedBrand.id, { 
                name: values.name,
                description: values.description || null
            });
            
            if (typeof result === 'string') {
                message.error(result);
            } else {
                message.success('Brand updated successfully');
                setIsUpdateModalVisible(false);
                setSelectedBrand(null);
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error('Error updating brand:', error);
            message.error('Failed to update brand');
        } finally {
            setLoading(false);
        }
    };
    
    // Handle delete confirm
    const handleDeleteConfirm = async () => {
        try {
            setLoading(true);
            
            const result = await deleteBrand(selectedBrand.id);
            
            if (result !== true && typeof result === 'string') {
                message.error(result);
            } else {
                message.success('Brand deleted successfully');
                setIsDeleteModalVisible(false);
                setSelectedBrand(null);
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error('Error deleting brand:', error);
            message.error('Failed to delete brand');
        } finally {
            setLoading(false);
        }
    };
    
    // Modal cancel handlers
    const handleUpdateCancel = () => {
        setIsUpdateModalVisible(false);
        setSelectedBrand(null);
        form.resetFields();
    };
    
    const handleDeleteCancel = () => {
        setIsDeleteModalVisible(false);
        setSelectedBrand(null);
    };
    
    // Fetch brands data
    const fetchData = useCallback(async () => {
        if (!companyId) {
            setRowData([]);
            return;
        }

        setLoading(true);
        try {
            const result = await getBrands(
                companyId,
                pagination.current,
                pagination.pageSize
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
                pages: Math.ceil((result.pagination?.total || 0) / (result.pagination?.limit || prev.pageSize))
            }));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [companyId, pagination.current, pagination.pageSize]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    // Handle pagination change
    const handlePageChange = (nextPage, nextPageSize) => {
        setPagination({
            ...pagination,
            current: nextPage,
            pageSize: nextPageSize,
        });
    };

    if (!companyId) {
        return (
            <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                Select a company to view its brands
            </div>
        );
    }

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="ag-theme-quartz" style={{ width: '100%', height: '50dvh' }}>
                <AgGridReact
                    ref={gridRef}
                    gridOptions={gridOptions}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowData={rowData}
                    domLayout="normal"
                    overlayLoadingTemplate={'<span class="ag-overlay-loading-center">Loading...</span>'}
                    loading={loading}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: 8,
                    gap: 12,
                }}
            >
                <div style={{ fontSize: 12 }}>
                    Page <b>{pagination.current}</b> of{' '}
                    <b>{pagination.pages}</b> — Total rows:{' '}
                    <b>{pagination.total}</b>
                </div>
                <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    showSizeChanger
                    pageSizeOptions={['100', '150', '175', '200']}
                    showQuickJumper
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                />
            </div>
            
            {/* Update Brand Modal */}
            <Modal
                title="Update Brand"
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
                        label="Brand Name"
                        rules={[{ required: true, message: 'Please enter the brand name' }]}
                    >
                        <Input placeholder="Enter brand name" />
                    </Form.Item>
                    
                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea 
                            placeholder="Enter brand description (optional)" 
                            rows={4}
                        />
                    </Form.Item>
                    
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Update
                        </Button>
                        <Button style={{ marginLeft: 8 }} onClick={handleUpdateCancel}>
                            Cancel
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            
            {/* Delete Brand Confirmation Modal */}
            <Modal
                title="Delete Brand"
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
                    </Button>
                ]}
            >
                <p>Are you sure you want to delete this brand?</p>
                {selectedBrand && (
                    <>
                        <p>
                            <strong>Brand Name:</strong> {selectedBrand.name}
                        </p>
                        {selectedBrand.description && (
                            <p>
                                <strong>Description:</strong> {selectedBrand.description}
                            </p>
                        )}
                    </>
                )}
            </Modal>
        </div>
    );
}

export default BrandTable;

