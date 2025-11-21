import { Button, Dropdown, Modal } from "antd";
import {
    MoreOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import InvoiceForm from "../invoice/InvoiceForm";
import AddInovice from "../../pages/accounting/AddInovice";
import { updateInvoice } from "../../api/accounting";
import { message } from "antd";

function InvoiceActions({ record }) {
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Action items for the dropdown menu
    const actionItems = [
        {
            key: "edit-invoice",
            label: "Edit Invoice",
            icon: <EditOutlined />,
            onClick: () => {
                setIsModalVisible(true);
            },
        },
        // {
        //     key: 'delete-invoice',
        //     label: 'Delete Invoice',
        //     icon: <DeleteOutlined />,
        //     danger: true,
        //     onClick: () => {
        //         // For now, just log the record - user will implement the delete functionality
        //         console.log('Delete invoice:', record);
        //     }
        // },
    ];

    const handleModalClose = () => {
        setIsModalVisible(false);
    };

    const handleSubmit = async (changedData) => {
        try {
            const result = await updateInvoice(record.id, changedData);

            if (result && result.data) {
                message.success("Invoice updated successfully!");
                setIsModalVisible(false);
                // Optionally refresh the page or update the data
                window.location.reload();
            } else {
                message.error(typeof result === 'string' ? result : "Failed to update invoice");
            }
        } catch (error) {
            console.error("Error updating invoice:", error);
            message.error("Error updating invoice");
        }
    };

    return (
        <>
            <Dropdown
                menu={{ items: actionItems }}
                placement="bottomRight"
                trigger={["click"]}
            >
                <Button
                    type="text"
                    icon={<MoreOutlined />}
                    className="icon-btn"
                />
            </Dropdown>

            <Modal
                open={isModalVisible}
                onCancel={handleModalClose}
                footer={null}
                width={700}
            >
                <AddInovice
                    mode={`Edit Invoice ${record.code}`}
                    initialValues={{
                        partner: record.partner,
                        subject: record.subject,
                        code: record.code,
                        price: record.price,
                        currency: record.currency,
                        createdAt: record.createdAt
                            ? new Date(record.createdAt)
                            : undefined,
                        brandId: record.brandId || record.brand?.id,
                        brand: record.brand,
                        company: record.brand?.company,
                    }}
                    onSubmit={handleSubmit}
                    onCancel={handleModalClose}
                />
            </Modal>
        </>
    );
}

export default InvoiceActions;
