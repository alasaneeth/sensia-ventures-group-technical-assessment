import { Button, Dropdown, Modal, message } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import CountryForm from "./CountryForm";
import { deleteCountry } from "../../api/countries";

function CountryActions({ record, setCountries, fetchCountries }) {
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    // Action items for the dropdown menu
    const actionItems = [
        {
            key: "update-country",
            label: "Update Country",
            icon: <EditOutlined />,
            onClick: () => {
                setIsUpdateModalVisible(true);
            },
        },
        {
            key: "delete-country",
            label: "Delete Country",
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {
                setIsDeleteModalVisible(true);
            },
        },
    ];

    const handleUpdate = async () => {
        setIsUpdateModalVisible(false);
        fetchCountries();
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            const result = await deleteCountry(record.id);
            
            if (result !== true && typeof result === "string") {
                message.error(result);
            } else {
                message.success("Country deleted successfully");
                setIsDeleteModalVisible(false);
                fetchCountries();
            }
        } catch (error) {
            console.error("Error deleting country:", error);
            message.error("Failed to delete country");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dropdown
                menu={{ items: actionItems }}
                trigger={["click"]}
                placement="bottomRight"
            >
                <Button
                    type="text"
                    icon={<MoreOutlined />}
                    onClick={(e) => e.stopPropagation()}
                />
            </Dropdown>

            <Modal
                title="Update Country"
                open={isUpdateModalVisible}
                onCancel={() => setIsUpdateModalVisible(false)}
                footer={null}
                width={600}
            >
                <CountryForm
                    initialValues={record}
                    onSubmit={handleUpdate}
                    onCancel={() => setIsUpdateModalVisible(false)}
                />
            </Modal>

            <Modal
                title="Delete Country"
                open={isDeleteModalVisible}
                onOk={handleDelete}
                onCancel={() => setIsDeleteModalVisible(false)}
                confirmLoading={loading}
                okText="Delete"
                okButtonProps={{ danger: true }}
            >
                <p>
                    Are you sure you want to delete the country{" "}
                    <strong>{record.country}</strong>? This action cannot be undone.
                </p>
            </Modal>
        </>
    );
}

export default CountryActions;

