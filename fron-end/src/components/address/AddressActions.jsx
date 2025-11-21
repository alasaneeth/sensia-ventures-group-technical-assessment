import { Button, Dropdown, Modal, Alert, message } from "antd";
import {
    MoreOutlined,
    PlusOutlined,
    EditOutlined,
    SwapOutlined,
} from "@ant-design/icons";
import { useState, useMemo } from "react";
import AddShipmentForm from "./AddShipmentForm";
import AddressForm from "./AddressForm";
import { updateAddress, updatOffersAddresses } from "../../api/addresses";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { getAddresses } from "../../api/addresses";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

function AddressActions({ record, setAddresses, fetchAddresses }) {
    const [isShipmentModalVisible, setIsShipmentModalVisible] = useState(false);
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [isChangeOffersModalVisible, setIsChangeOffersModalVisible] =
        useState(false);
    const [selectedNewAddress, setSelectedNewAddress] = useState(null);
    const [loadingChangeOffers, setLoadingChangeOffers] = useState(false);
    console.log('\n####### address record #########\n', record,'\n################\n');

    // Memoize extraArgs to prevent unnecessary re-renders
    const addressExtraArgs = useMemo(
        () => ({
            filters: {
                status: [{ ne: "closed" }],
                id: [{ ne: record.id }],
            },
        }),
        [record.id]
    );

    // Action items for the dropdown menu
    const actionItems = [
        {
            key: "update-address",
            label: "Update PO Box",
            icon: <EditOutlined />,
            onClick: () => {
                setIsUpdateModalVisible(true);
            },
        },
    ];

    if (record.status !== "closed") {
        actionItems.push({
            key: "add-shipment",
            label: "Add Shipment",
            icon: <PlusOutlined />,
            onClick: () => {
                setIsShipmentModalVisible(true);
            },
        });
    }
    // Add change offers action only for closed addresses with related offers
    else if (record.status === "closed" && record.relatedOffersCount > 0) {
        actionItems.push({
            key: "change-offers-address",
            label: "Change All Related Offers PO Box",
            icon: <SwapOutlined />,
            onClick: () => {
                setIsChangeOffersModalVisible(true);
                setSelectedNewAddress(null);
            },
        });
    }

    const handleShipmentSuccess = () => {
        setIsShipmentModalVisible(false);
        // Optionally refresh the table or show a success message
    };

    const handleShipmentCancel = () => {
        setIsShipmentModalVisible(false);
    };

    const handleUpdateSuccess = async (changedData) => {
        try {
            const response = await updateAddress(record.id, changedData);

            if (typeof response === "string") {
                message.error(response);
                return;
            }

            message.success("Address updated successfully");
            setIsUpdateModalVisible(false);

            // Update only the specific address in the addresses array
            setAddresses((prevAddresses) =>
                prevAddresses.map((addr) => {
                    console.log(
                        "\n################\n",
                        addr,
                        "\n################\n"
                    );
                    return addr.id === record.id
                        ? { ...addr, ...response } // Merge updated data with existing data
                        : addr;
                })
            );
        } catch (error) {
            console.error("Error updating address:", error);
            message.error("Failed to update address");
        }
    };

    const handleUpdateCancel = () => {
        setIsUpdateModalVisible(false);
    };

    const handleChangeOffersCancel = () => {
        setIsChangeOffersModalVisible(false);
        setSelectedNewAddress(null);
    };

    const handleAddressSelect = (address) => {
        setSelectedNewAddress(address);
    };

    const handleChangeOffersSubmit = async () => {
        if (!selectedNewAddress || !selectedNewAddress.id) {
            message.error("Please select a new PO Box address");
            return;
        }

        setLoadingChangeOffers(true);
        try {
            const result = await updatOffersAddresses(
                record.id,
                selectedNewAddress.id
            );

            if (result) {
                message.success(
                    `Successfully updated all offers using this PO Box`
                );
                setIsChangeOffersModalVisible(false);
                // Refetch the entire table to get updated counts
                fetchAddresses();
            } else {
                message.error("Failed to update offers");
            }
        } catch (error) {
            console.error("Error updating offers addresses:", error);
            message.error("Failed to update offers");
        } finally {
            setLoadingChangeOffers(false);
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
                open={isShipmentModalVisible}
                onCancel={handleShipmentCancel}
                footer={null}
                width={600}
                title={`Add Shipment for ${record.address}`}
                style={{ top: 20 }}
                bodyStyle={{
                    maxHeight: "calc(100vh - 120px)",
                    overflowY: "auto",
                }}
            >
                <AddShipmentForm
                    addressId={record.id}
                    onSuccess={handleShipmentSuccess}
                    onCancel={handleShipmentCancel}
                />
            </Modal>

            <Modal
                open={isUpdateModalVisible}
                onCancel={handleUpdateCancel}
                footer={null}
                width={800}
                title={`Update PO Box - ${record.address}`}
                style={{ top: 20 }}
                bodyStyle={{
                    maxHeight: "calc(100vh - 120px)",
                    overflowY: "auto",
                }}
            >
                <AddressForm
                    initialValues={record}
                    onSubmit={handleUpdateSuccess}
                    onCancel={handleUpdateCancel}
                />
            </Modal>

            <Modal
                open={isChangeOffersModalVisible}
                onCancel={handleChangeOffersCancel}
                title={`Change PO Box for ${record.relatedOffersCount} Related Offers`}
                footer={[
                    <Button key="cancel" onClick={handleChangeOffersCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={loadingChangeOffers}
                        onClick={handleChangeOffersSubmit}
                        disabled={!selectedNewAddress}
                    >
                        Update All Related Offers
                    </Button>,
                ]}
                width={700}
                style={{ top: 20 }}
                bodyStyle={{
                    maxHeight: "calc(100vh - 120px)",
                    overflowY: "auto",
                }}
            >
                <Alert
                    message="Warning"
                    description={
                        <>
                            <p>
                                You are about to change the return address for{" "}
                                <strong>
                                    {record.relatedOffersCount} offers
                                </strong>{" "}
                                that currently use this PO Box.
                            </p>
                            <p>
                                Current PO Box:{" "}
                                <strong>{record.address}</strong> (Status:{" "}
                                <strong>{record.status}</strong>)
                            </p>
                            <p>
                                Please select a new PO Box address for these
                                offers:
                            </p>
                        </>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <div style={{ marginBottom: 16 }}>
                    <h4>Select New PO Box Address:</h4>
                    <DynamicDropdownMenu
                        extraArgs={addressExtraArgs}
                        onSelect={handleAddressSelect}
                        placeholder="Select a PO Box address"
                        fetchFunction={(page, rowsPerPage, passedFilter) => {
                            const filters = {
                                ...passedFilter,
                                ...addressExtraArgs.filters,
                                brandId: [{ eq: record.brandId }],
                            };
                            return getAddresses(page, rowsPerPage, filters);
                        }}
                        searchBy="address"
                        setOptions={(data) => {
                            // Filter out the current address and closed addresses
                            return (
                                data
                                    // .filter(
                                    //     (address) =>
                                    //         address.id !== record.id &&
                                    //         address.status !== "closed"
                                    // )
                                    .map((address) => ({
                                        value: address.id,
                                        label: address.country
                                            ? `${address?.address} - ${address?.country}`
                                            : address.address,
                                        address,
                                    }))
                            );
                        }}
                    />
                </div>

                {selectedNewAddress && (
                    <Alert
                        message="Selected New Address"
                        description={
                            <>
                                <p>
                                    <strong>Address:</strong>{" "}
                                    {selectedNewAddress.address}
                                </p>
                                <p>
                                    <strong>Country:</strong>{" "}
                                    {selectedNewAddress.country || "N/A"}
                                </p>
                                <p>
                                    <strong>Status:</strong>{" "}
                                    {selectedNewAddress.status}
                                </p>
                            </>
                        }
                        type="info"
                        showIcon
                    />
                )}
            </Modal>
        </>
    );
}

export default AddressActions;
