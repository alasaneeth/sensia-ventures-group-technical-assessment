import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { message, Modal, Form, Input, Button, Pagination, Divider } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { getCompanies, updateCompany, deleteCompany } from "../../api/companies";
import CompanyActions from "./CompanyActions";
import BrandTable from "./BrandTable";
import BrandForm from "./BrandForm";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

function CompanyTable() {
    const gridRef = useRef(null);
    const [form] = Form.useForm();
    
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0,
        pages: 1
    });
    
    // Modal states
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedCompanyForBrands, setSelectedCompanyForBrands] = useState(null);
    const [showAddBrandForm, setShowAddBrandForm] = useState(false);
    
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
            headerName: 'Company Name',
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
                <CompanyActions 
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
        rowSelection: 'single',
        onRowClicked: (params) => {
            setSelectedCompanyForBrands(params.data);
            setShowAddBrandForm(false);
        },
    }), []);

    // Handle update company
    const handleUpdate = (company) => {
        setSelectedCompany(company);
        form.setFieldsValue({ 
            name: company.name,
            description: company.description || ''
        });
        setIsUpdateModalVisible(true);
    };
    
    // Handle delete company
    const handleDelete = (company) => {
        setSelectedCompany(company);
        setIsDeleteModalVisible(true);
    };
    
    // Handle update submit
    const handleUpdateSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            const result = await updateCompany(selectedCompany.id, { 
                name: values.name,
                description: values.description || null
            });
            
            if (typeof result === 'string') {
                message.error(result);
            } else {
                message.success('Company updated successfully');
                setIsUpdateModalVisible(false);
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error('Error updating company:', error);
            message.error('Failed to update company');
        } finally {
            setLoading(false);
        }
    };
    
    // Handle delete confirm
    const handleDeleteConfirm = async () => {
        try {
            setLoading(true);
            
            const result = await deleteCompany(selectedCompany.id);
            
            if (result !== true && typeof result === 'string') {
                message.error(result);
            } else {
                message.success('Company deleted successfully');
                setIsDeleteModalVisible(false);
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error('Error deleting company:', error);
            message.error('Failed to delete company');
        } finally {
            setLoading(false);
        }
    };
    
    // Modal cancel handlers
    const handleUpdateCancel = () => {
        setIsUpdateModalVisible(false);
        setSelectedCompany(null);
        form.resetFields();
    };
    
    const handleDeleteCancel = () => {
        setIsDeleteModalVisible(false);
        setSelectedCompany(null);
    };
    
    // Fetch companies data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getCompanies(
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
    }, [pagination.current, pagination.pageSize]);
    
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

    const [brandRefreshTrigger, setBrandRefreshTrigger] = useState(0);

    const handleBrandCreated = () => {
        setBrandRefreshTrigger(prev => prev + 1);
        setShowAddBrandForm(false);
    };

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="ag-theme-quartz" style={{ width: '100%', height: selectedCompanyForBrands ? '40dvh' : '75dvh' }}>
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
            
            {/* Update Company Modal */}
            <Modal
                title="Update Company"
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
                        label="Company Name"
                        rules={[{ required: true, message: 'Please enter the company name' }]}
                    >
                        <Input placeholder="Enter company name" />
                    </Form.Item>
                    
                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea 
                            placeholder="Enter company description (optional)" 
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
            
            {/* Delete Company Confirmation Modal */}
            <Modal
                title="Delete Company"
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
                <p>Are you sure you want to delete this company?</p>
                {selectedCompany && (
                    <>
                        <p>
                            <strong>Company Name:</strong> {selectedCompany.name}
                        </p>
                        {selectedCompany.description && (
                            <p>
                                <strong>Description:</strong> {selectedCompany.description}
                            </p>
                        )}
                    </>
                )}
            </Modal>

            {/* Brands Section */}
            {selectedCompanyForBrands && (
                <>
                    <Divider style={{ margin: '20px 0' }} />
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>
                                Brands for: <strong>{selectedCompanyForBrands.name}</strong>
                            </h3>
                            <Button 
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setShowAddBrandForm(!showAddBrandForm);
                                }}
                            >
                                {showAddBrandForm ? 'Hide Add Brand Form' : 'Add New Brand'}
                            </Button>
                        </div>
                        
                        {showAddBrandForm && (
                            <div style={{ marginBottom: 16 }}>
                                <BrandForm 
                                    companyId={selectedCompanyForBrands.id}
                                    onSuccess={handleBrandCreated}
                                />
                            </div>
                        )}
                        
                        <BrandTable companyId={selectedCompanyForBrands.id} refreshTrigger={brandRefreshTrigger} />
                    </div>
                </>
            )}
        </div>
    );
}

export default CompanyTable;

