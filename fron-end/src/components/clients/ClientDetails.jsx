import {
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Divider,
    Input,
    InputNumber,
    message,
    Row,
    Select,
    TimePicker,
    Typography,
} from "antd";
import { useRef, useState, useEffect } from "react";
import { useWindowSize } from "../../hooks/useWindowSize";
import { updateClient } from "../../api/client";
import CountryDropdown from "../ui/CountryDropdown";
import dayjs from "dayjs";

function ClientDetails({ clientOffer, onUpdate }) {
    const dataCopy = {
        // firstName: clientOffer?.|| clientOffer.client.
        firstName: clientOffer?.firstName || clientOffer?.client?.firstName,
        lastName: clientOffer?.lastName || clientOffer?.client?.lastName,
        gender: clientOffer?.gender || clientOffer?.client?.gender,
        country: clientOffer?.country || clientOffer?.client?.country,
        city: clientOffer?.city || clientOffer?.client?.city,
        state: clientOffer?.state || clientOffer?.client?.state,
        zipCode: clientOffer?.zipCode || clientOffer?.client?.zipCode,
        address1: clientOffer?.address1 || clientOffer?.client?.address1,
        address2: clientOffer?.address2 || clientOffer?.client?.address2,
        address3: clientOffer?.address3 || clientOffer?.client?.address3,
        birthDate: clientOffer?.birthDate || clientOffer?.client?.birthDate,
        phone: clientOffer?.phone || clientOffer?.client?.phone,
        isBlacklisted:
            clientOffer?.isBlacklisted || clientOffer?.client?.isBlacklisted,
        listOwner: clientOffer?.listOwner || clientOffer?.client?.listOwner,
    };

    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);

    // Save them to update the client data when the user submit
    const clientData = useRef(dataCopy);

    async function handleClick() {
        if (!editMode) {
            setEditMode(true);
            return;
        }

        try {
            const data = {};
            // Extract the data that changed from the orignal data given via props
            Object.keys(clientData.current).forEach((key) => {
                if (
                    clientData.current[key] !== clientOffer[key] ||
                    clientData.current[key] !== clientOffer[key]
                ) {
                    data[key] = clientData.current[key];
                }
            });

            setLoading(true);
            let result = null;
            console.log("Sending this is the : ", clientOffer);
            if (clientOffer?.client?.id)
                result = await updateClient(clientOffer?.client?.id, data);
            else if (clientOffer?.id)
                result = await updateClient(clientOffer?.id, data);
            else throw new Error("No client id found");

            if (typeof result === "string") {
                message.error(result);
                console.error(result);

                return;
            }

            onUpdate?.();

            message.success("Client updated successfully");
        } catch (err) {
            message.error("Failed to update client");
        } finally {
            setLoading(false);
            setEditMode(false);
        }
    }

    async function handleBlackList() {
        try {
            setLoading(true);
            const data = {
                isBlacklisted: !clientData.current.isBlacklisted,
            };

            let result = null;
            console.log("Sending this is the : ", clientOffer);
            if (clientOffer?.client?.id)
                result = await updateClient(clientOffer?.client?.id, data);
            else if (clientOffer?.id)
                result = await updateClient(clientOffer?.id, data);
            else throw new Error("No client id found");

            if (typeof result === "string") {
                message.error(result);
                console.error(result);
                return;
            }

            onUpdate?.();
            // On success update the clientOffer
            clientData.current.isBlacklisted =
                !clientData.current.isBlacklisted;

            message.success(
                `Client ${
                    clientData.current.isBlacklisted
                        ? "added to"
                        : "removed from"
                } blacklist successfully`
            );
        } catch (err) {
            message.error("Soemthing went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Card
                title="Client Details"
                style={{ height: "100%", overflow: "auto" }}
                extra={
                    <>
                        {editMode && (
                            <Button
                                onClick={() => {
                                    clientData.current = dataCopy;

                                    setEditMode(false);
                                }}
                                style={{ marginRight: 8 }}
                                type="default"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="primary"
                            onClick={handleClick}
                            disabled={loading}
                        >
                            {editMode ? "Save" : "Edit"}
                        </Button>

                        <Button
                            type="primary"
                            style={{
                                color: "#fafafa",
                                backgroundColor: "#ff3737",
                                marginLeft: "10px",
                            }}
                            onClick={handleBlackList}
                            disabled={loading}
                        >
                            {clientData.current.isBlacklisted
                                ? "Remove From Blacklist"
                                : "Add To Blacklist"}
                        </Button>
                    </>
                }
                styles={{
                    header: {
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        backgroundColor: "#fff",
                    },
                }}
            >
                <div
                    style={{
                        overflowX: "auto",
                        overflowY: "hidden",
                        whiteSpace: "nowrap",
                        width: "100%",
                    }}
                >
                    <Descriptions
                        bordered
                        column={1}
                        style={{
                            width: "100%",
                            // minWidth: width < 768 ? "100%" : "1000px", // Adjust minimum width based on screen size
                            tableLayout: "fixed",
                        }}
                    >
                        <Descriptions.Item
                            label="First Name"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Input
                                    onChange={(e) => {
                                        clientData.current.firstName =
                                            e.target.value;
                                    }}
                                    defaultValue={clientData.current.firstName}
                                />
                            ) : (
                                clientData.current.firstName
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label="Last Name"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Input
                                    onChange={(e) => {
                                        clientData.current.lastName =
                                            e.target.value;
                                    }}
                                    defaultValue={clientData.current.lastName}
                                />
                            ) : (
                                clientData.current.lastName
                            )}
                        </Descriptions.Item>

                        {/* <Descriptions.Item
                            label="Title"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Select
                                    placeholder="Select title"
                                    onChange={(value) => {
                                        clientData.current.title = value;
                                    }}
                                    defaultValue={clientData.current.title}
                                >
                                    <Select.Option value="Mr">Mr</Select.Option>
                                    <Select.Option value="Mrs">
                                        Mrs
                                    </Select.Option>
                                    <Select.Option value="Ms">Ms</Select.Option>
                                    <Select.Option value="Dr">Dr</Select.Option>
                                    <Select.Option value="Prof">
                                        Prof
                                    </Select.Option>
                                </Select>
                            ) : (
                                clientData.current.title
                            )}
                        </Descriptions.Item> */}

                        {/* <Descriptions.Item
                            label="Additional Name"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Input
                                    onChange={(e) => {
                                        clientData.current.additionalName =
                                            e.target.value;
                                    }}
                                    defaultValue={
                                        clientData.current.additionalName
                                    }
                                />
                            ) : (
                                clientData.current.additionalName
                            )}
                        </Descriptions.Item> */}

                        <Descriptions.Item
                            label="Address Line 1"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Input
                                    onChange={(e) => {
                                        clientData.current.address1 =
                                            e.target.value;
                                    }}
                                    defaultValue={clientData.current.address1}
                                />
                            ) : (
                                clientData.current.address1
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label="Address Line 2"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Input
                                    onChange={(e) => {
                                        clientData.current.address2 =
                                            e.target.value;
                                    }}
                                    defaultValue={clientData.current.address2}
                                />
                            ) : (
                                clientData.current.address2
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label="Address Line 3"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Input
                                    onChange={(e) => {
                                        clientData.current.address3 =
                                            e.target.value;
                                    }}
                                    defaultValue={clientData.current.address3}
                                />
                            ) : (
                                clientData.current.address3
                            )}
                        </Descriptions.Item>



                        <Descriptions.Item
                            label="Country"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <CountryDropdown
                                    value={clientData.current.country}
                                    onChange={(country) => {
                                        clientData.current.country = country;
                                    }}
                                />
                            ) : (
                                clientData.current.country
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label="City"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Input
                                    onChange={(e) => {
                                        clientData.current.city =
                                            e.target.value;
                                    }}
                                    defaultValue={clientData.current.city}
                                />
                            ) : (
                                clientData.current.city
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label="Zip / Postal Code"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Input
                                    onChange={(e) => {
                                        clientData.current.zipCode =
                                            e.target.value;
                                    }}
                                    defaultValue={clientData.current.zipCode}
                                />
                            ) : (
                                clientData.current.zipCode
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label="Gender"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Select
                                    placeholder="Select gender"
                                    onChange={(value) => {
                                        clientData.current.gender = value;
                                    }}
                                    defaultValue={clientData.current.gender}
                                >
                                    <Select.Option value="male">Male</Select.Option>
                                    <Select.Option value="female">
                                        Female
                                    </Select.Option>
                                    <Select.Option value="not sure">Not Sure</Select.Option>
                                </Select>
                            ) : (
                                clientData.current.gender || "-"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label="State"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Input
                                    onChange={(e) => {
                                        clientData.current.state =
                                            e.target.value;
                                    }}
                                    defaultValue={clientData.current.state}
                                />
                            ) : (
                                clientData.current.state || "-"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label="Phone"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Input
                                    onChange={(e) => {
                                        clientData.current.phone =
                                            e.target.value;
                                    }}
                                    defaultValue={clientData.current.phone}
                                />
                            ) : (
                                clientData.current.phone || "-"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label="List Owner"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Input
                                    onChange={(e) => {
                                        clientData.current.listOwner =
                                            e.target.value;
                                    }}
                                    defaultValue={clientData.current.listOwner}
                                />
                            ) : (
                                clientData.current.listOwner || "-"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label="Birth Date"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <DatePicker
                                    onChange={(date) => {
                                        clientData.current.birthDate = date
                                            ? date.format("YYYY-MM-DD")
                                            : null;
                                    }}
                                    defaultValue={
                                        clientData.current.birthDate
                                            ? dayjs(
                                                  clientData.current.birthDate
                                              )
                                            : null
                                    }
                                />
                            ) : clientData.current.birthDate ? (
                                dayjs(clientData.current.birthDate).format(
                                    "YYYY-MM-DD"
                                )
                            ) : (
                                "-"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label="Blacklisted"
                            styles={{
                                label: { width: "25%" },
                                content: { width: "75%" },
                            }}
                            span={1}
                        >
                            {editMode ? (
                                <Select
                                    onChange={(value) => {
                                        clientData.current.isBlacklisted =
                                            value;
                                    }}
                                    defaultValue={
                                        clientData.current.isBlacklisted
                                    }
                                >
                                    <Select.Option value={true}>
                                        Yes
                                    </Select.Option>
                                    <Select.Option value={false}>
                                        No
                                    </Select.Option>
                                </Select>
                            ) : clientData.current.isBlacklisted ? (
                                "Yes"
                            ) : (
                                "No"
                            )}
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            </Card>
        </>
    );
}

export default ClientDetails;
