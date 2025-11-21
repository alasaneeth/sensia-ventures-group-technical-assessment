import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Table, message, Pagination } from "antd";
import { getPaymentMethods } from "../../api/campaign";
import PaymentMethodActions from "./PaymentMethodActions";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

function PaymentMethodsList() {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0,
        pages: 1,
    });

    // Use global brand filter from header
    const { selectedBrandIds, brands } = useGlobalCompanyBrandFilter();

    const columns = useMemo(
        () => [
            {
                title: "ID",
                dataIndex: "id",
                key: "id",
                width: 80,
            },
            {
                title: "Country",
                dataIndex: "country",
                key: "country",
                render: (text) => (text ? text.toUpperCase() : ""),
            },
            {
                title: "Payment Method",
                dataIndex: "paymentMethod",
                key: "paymentMethod",
                render: (text) => {
                    if (!text) return "-";


                    return text
                        .map(
                            (method) =>
                                method.trim().charAt(0).toUpperCase() +
                                method.trim().slice(1)
                        )
                        .join(", ");
                },
            },
            {
                title: "Brand",
                dataIndex: "brand",
                key: "brandName",
                width: 150,
                render: (_, record) => record?.brand?.name || "-",
            },
            {
                title: "Company Name",
                dataIndex: "brand.company",
                key: "companyName",
                width: 150,
                render: (_, record) => record?.brand?.company?.name || "-",
            },
            {
                title: "Actions",
                key: "actions",
                width: 120,
                render: (_, record) => (
                    <PaymentMethodActions
                        record={record}
                        refreshList={fetchPaymentMethods}
                    />
                ),
            },
        ],
        []
    );

    const fetchPaymentMethods = useCallback(async () => {
        setLoading(true);
        try {
            // Build brand filter only
            const filters = {};
            
            // Add brand filter - only apply if not all items are selected (optimization)
  
                    filters.brandId = [{ in: selectedBrandIds }];
 

            const result = await getPaymentMethods(
                pagination.current,
                pagination.pageSize,
                Object.keys(filters).length > 0 ? filters : undefined
            );

            if (typeof result === "string") {
                message.error(result);
                return;
            }

            setPaymentMethods(result.data || []);
            setPagination((prev) => ({
                ...prev,
                total: result.pagination?.total || 0,
                current: result.pagination?.page || prev.current,
                pageSize: result.pagination?.limit || prev.pageSize,
                pages: result.pagination?.pages || 1,
            }));
        } catch (err) {
            console.error(err);
            message.error("Failed to fetch payment methods");
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize, selectedBrandIds, brands.length]);

    useEffect(() => {
        fetchPaymentMethods();
    }, [fetchPaymentMethods]);

    const handlePageChange = (nextPage, nextPageSize) => {
        setPagination({
            ...pagination,
            current: nextPage,
            pageSize: nextPageSize,
        });
    };


    return (
        <div>
            <Table
                columns={columns}
                dataSource={paymentMethods}
                rowKey="id"
                loading={loading}
                pagination={false}
            />
            <div style={{ marginTop: 16, textAlign: "right" }}>
                <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    showSizeChanger
                    pageSizeOptions={["100", "150", "175", "200"]}
                    showQuickJumper
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                    showTotal={(total) => `Total ${total} items`}
                />
            </div>
        </div>
    );
}

export default PaymentMethodsList;
