import { useState, useEffect, useMemo } from "react";
import { Table, Button, Upload, message, Card, Typography, Space, Form } from "antd";
import {
    UploadOutlined,
    FileExcelOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import { getImportHistory, uploadImportedFile } from "../../api/client";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

const { Title } = Typography;

function ImportTable() {
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [importHistory, setImportHistory] = useState([]);
    const [refreshKey, setRefreshKey] = useState(new Date());
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [selectedBrandId, setSelectedBrandId] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0,
    });

    const { selectedBrandIds } = useGlobalCompanyBrandFilter();

    // Build brand filter from global state
    const filters = useMemo(() => {
        if (selectedBrandIds && selectedBrandIds.length > 0) {
            return {
                brandId: [{ in: selectedBrandIds }],
            };
        }
        return undefined;
    }, [selectedBrandIds]);

    // Reset selected brand when company changes
    useEffect(() => {
        setSelectedBrandId(null);
    }, [selectedCompanyId]);

    // Fetch import history on component mount and when refreshKey changes
    useEffect(() => {
        async function fetchImportHistory() {
            setLoading(true);
            try {
                const history = await getImportHistory({
                    page: pagination.current,
                    rowsPerPage: pagination.pageSize,
                    filters,
                });
                if (typeof history === "string") return message.error(history);

                setImportHistory(history.data);
                setPagination((prev) => ({
                    ...prev,
                    total: history.pagination?.total || 0,
                    current: history.pagination?.page || prev.current,
                    pageSize: history.pagination?.limit || prev.pageSize,
                }));
            } catch (error) {
                console.error("Error fetching import history:", error);
                message.error("Failed to load import history");
            } finally {
                setLoading(false);
            }
        }

        fetchImportHistory();
    }, [refreshKey, pagination.current, pagination.pageSize, filters]);

    // Handle file upload
    async function handleUpload() {
        if (fileList.length === 0) {
            message.warning("Please select a file to upload");
            return;
        }

        if (!selectedCompanyId) {
            message.warning("Please select a company");
            return;
        }

        if (!selectedBrandId) {
            message.warning("Please select a brand");
            return;
        }

        const file = fileList[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("companyId", selectedCompanyId);
        formData.append("brandId", selectedBrandId);

        setLoading(true);
        try {
            const result = await uploadImportedFile(formData);
            message.success(`${file.name} uploaded successfully`);
            console.log(result);
            setFileList([]);
            setSelectedCompanyId(null);
            setSelectedBrandId(null);
            // Refresh the history table
            setRefreshKey(new Date());
        } catch (error) {
            console.error("Error uploading file:", error);
            message.error(`Failed to upload ${file.name}`);
        } finally {
            setLoading(false);
        }
    }

    // Handle table change (pagination, filters, sorter)
    function handleTableChange(paginationParams, filters, sorter) {
        setPagination((prev) => ({
            ...prev,
            current: paginationParams.current,
            pageSize: paginationParams.pageSize,
        }));
    }

    // Configure upload props
    const uploadProps = {
        onRemove: (file) => {
            setFileList([]);
        },
        beforeUpload: (file) => {
            // Check file type
            const isCSVOrExcel =
                file.type === "text/csv" ||
                file.type ===
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                file.type === "application/vnd.ms-excel" ||
                file.type === "text/plain";

            if (!isCSVOrExcel) {
                message.error("You can only upload CSV or Excel files!");
                return Upload.LIST_IGNORE;
            }

            // Check file size (limit to 10MB)
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error("File must be smaller than 10MB!");
                return Upload.LIST_IGNORE;
            }

            setFileList([file]);
            return false; // Prevent auto upload
        },
        fileList,
        maxCount: 1,
    };

    // Define table columns
    const columns = [
        {
            title: "File Name",
            dataIndex: "fileName",
            key: "fileName",
            render: (text) => {
                const isExcel = text.endsWith(".xlsx") || text.endsWith(".xls");
                const icon = isExcel ? (
                    <FileExcelOutlined style={{ color: "#52c41a" }} />
                ) : (
                    <FileTextOutlined style={{ color: "#1890ff" }} />
                );
                return (
                    <Space>
                        {icon}
                        {text}
                    </Space>
                );
            },
        },
        {
            title: "Import Date",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (text) => new Date(text).toLocaleString(),
            sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            defaultSortOrder: "descend",
        },
    ];

    return (
        <div style={{ padding: "20px" }}>
            <Title level={2}>Import Client Database</Title>

            <Card title="Upload New File" style={{ marginBottom: 20 }}>
                <Form layout="vertical" style={{ marginBottom: 16 }}>
                    <Form.Item label="Company" required>
                        <DynamicDropdownMenu
                            onSelect={(company) => setSelectedCompanyId(company?.id)}
                            selectedValue={selectedCompanyId}
                            placeholder="Select a company"
                            fetchFunction={async (page, rowsPerPage, passedFilter) => {
                                const result = await getCompanies(
                                    page,
                                    rowsPerPage,
                                    passedFilter
                                );
                                return {
                                    pagination: result?.pagination || {},
                                    data: result?.data || [],
                                };
                            }}
                            searchBy="name"
                            setOptions={(data) => {
                                return data.map((c) => ({
                                    value: c.id,
                                    label: c.name || `Company ${c.id}`,
                                }));
                            }}
                        />
                    </Form.Item>

                    <Form.Item label="Brand" required>
                        <DynamicDropdownMenu
                            key={`brand-${selectedCompanyId}`}
                            disabled={!selectedCompanyId}
                            onSelect={(brand) => setSelectedBrandId(brand?.id)}
                            selectedValue={selectedBrandId}
                            placeholder="Select a brand"
                            fetchFunction={async (page, rowsPerPage, passedFilter) => {
                                const result = await getBrands(
                                    selectedCompanyId,
                                    page,
                                    rowsPerPage,
                                    passedFilter
                                );
                                return {
                                    pagination: result?.pagination || {},
                                    data: result?.data || [],
                                };
                            }}
                            searchBy="name"
                            setOptions={(data) => {
                                return data.map((b) => ({
                                    value: b.id,
                                    label: b.name,
                                }));
                            }}
                        />
                    </Form.Item>
                </Form>

                <Upload {...uploadProps} disabled={!selectedCompanyId || !selectedBrandId}>
                    <Button 
                        icon={<UploadOutlined />}
                        disabled={!selectedCompanyId || !selectedBrandId}
                    >
                        Select File
                    </Button>
                </Upload>
                <Button
                    type="primary"
                    onClick={handleUpload}
                    disabled={fileList.length === 0 || !selectedCompanyId || !selectedBrandId}
                    loading={loading}
                    style={{ marginTop: 16 }}
                >
                    Upload
                </Button>
                <div style={{ marginTop: 16 }}>
                    <Typography.Text type="secondary">
                        Supported file formats: CSV, Excel (.xlsx, .xls)
                    </Typography.Text>
                </div>
            </Card>

            <Card title="Import History">
                <Table
                    columns={columns}
                    dataSource={importHistory}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showSizeChanger: true,
                        pageSizeOptions: ["100", "150", "175", "200"],
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} import history records`,
                        position: ["bottomCenter"],
                    }}
                    onChange={handleTableChange}
                />
            </Card>
        </div>
    );
}

export default ImportTable;
