import { useState, useEffect } from "react";
import { Form, Input, Button, message, Space } from "antd";
import { useSelector } from "react-redux";
import { createChain } from "../../api/offer";
import { useDispatch } from "react-redux";
import { clearOfferChain } from "../../redux/stateSlices/offersSlice";
import DynamicDropdownMenu from "../ui/DynamicDropdownMenu";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";

function OfferChainForm() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const chainData = useSelector((state) => state.offers.chainData);
    const chainNodes = useSelector((state) => state.offers.chainNodes);
    const dispatch = useDispatch();

    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [selectedBrandId, setSelectedBrandId] = useState(null);

    async function handleSubmit(values) {
        // Check if we have at least two nodes in the chain
        if (!chainData?.offers || Object.keys(chainData.offers).length === 0) {
            message.error("At least one offer is required to create a chain");
            return;
        }

        if (!selectedCompanyId) {
            message.error("Please select a company");
            return;
        }
        if (!selectedBrandId) {
            message.error("Please select a brand");
            return;
        }

        setLoading(true);
        try {
            const { title, description } = values;

            // Find the first offer from chainNodes with isFirst flag
            const firstOfferNode = chainNodes.find((node) => node.isFirst);
            if (!firstOfferNode) {
                message.error("No first offer found in chain");
                return;
            }

            const { offers } = chainData;

            // Create a mapping of offer IDs to return addresses
            const offerReturnAddresses = chainNodes.reduce((acc, node) => {
                if (node.id && node.returnAddress) {
                    acc.push({
                        offerId: node.id,
                        returnAddress: node.returnAddress.id,
                    });
                }
                return acc;
            }, []);

            console.log("Offer return addresses:", offerReturnAddresses);

            // // Check if all nodes have return addresses
            // const nodesWithoutAddress = chainNodes.filter(node => !node.returnAddress);
            // if (nodesWithoutAddress.length > 0) {
            //     console.log('Nodes without return addresses:', nodesWithoutAddress);
            //     message.error(`${nodesWithoutAddress.length} offers don't have return addresses set. Please set return addresses for all offers before creating the chain.`);
            //     setLoading(false);
            //     return;
            // }

            // Make sure all offers in the chain have return addresses
            // const allOffersHaveAddresses = chainNodes.every(node => node.returnAddress && node.returnAddress.id);
            // if (!allOffersHaveAddresses) {
            //     message.error('All offers in the chain must have return addresses');
            //     setLoading(false);
            //     return;
            // }

            const result = await createChain(
                title,
                description,
                offers,
                firstOfferNode.id,
                offerReturnAddresses,
                selectedCompanyId,
                selectedBrandId
            );
            if (typeof result === "string") {
                return message.error(result);
            }
            message.success("Offer chain created successfully");
            form.resetFields();
            setSelectedCompanyId(null);
            setSelectedBrandId(null);
            dispatch(clearOfferChain());
        } catch (error) {
            console.error("Error creating offer chain:", error);
            message.error("Failed to create offer chain");
        } finally {
            setLoading(false);
        }
    }

    function handleReset() {
        dispatch(clearOfferChain());
        form.resetFields();
        setSelectedCompanyId(null);
        setSelectedBrandId(null);
        message.info("Chain has been reset");
    }

    const handleCompanySelect = (company) => {
        const companyId = company?.id || null;
        setSelectedCompanyId(companyId);
        form.setFieldsValue({ companyId });
        // Reset brand when company changes
        setSelectedBrandId(null);
        form.setFieldsValue({ brandId: null });
    };

    const handleBrandSelect = (brand) => {
        const brandId = brand?.id || null;
        setSelectedBrandId(brandId);
        form.setFieldsValue({ brandId });
    };

    return (
        <div className="offer-chain-form">
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ title: "", description: "" }}
            >
                <Form.Item
                    name="title"
                    label="Chain Code"
                    rules={[
                        {
                            required: true,
                            message: "Please enter a title for the chain",
                        },
                    ]}
                >
                    <Input placeholder="Enter chain code" />
                </Form.Item>

                <Form.Item
                    name="companyId"
                    label="Company"
                    rules={[
                        { required: true, message: "Please select a company" },
                    ]}
                >
                    <DynamicDropdownMenu
                        onSelect={handleCompanySelect}
                        selectedValue={selectedCompanyId}
                        placeholder="Select Company"
                        fetchFunction={(page, rowsPerPage, passedFilter) =>
                            getCompanies(page, rowsPerPage, passedFilter).then(
                                (result) => ({
                                    pagination: result?.pagination || {},
                                    data: result?.data || [],
                                })
                            )
                        }
                        searchBy="name"
                        setOptions={(data) => {
                            return data.map((c) => ({
                                value: c.id,
                                label: c.name || `Company ${c.id}`,
                            }));
                        }}
                    />
                </Form.Item>

                <Form.Item
                    name="brandId"
                    label="Brand"
                    rules={[
                        { required: true, message: "Please select a brand" },
                    ]}
                >
                    <DynamicDropdownMenu
                        onSelect={handleBrandSelect}
                        selectedValue={selectedBrandId}
                        placeholder="Select Brand"
                        disabled={!selectedCompanyId}
                        fetchFunction={(page, rowsPerPage, passedFilter) => {
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
                        key={selectedCompanyId} // Force remount when company changes
                        setOptions={(data) => {
                            return data.map((b) => ({
                                value: b.id,
                                label: b.name || `Brand ${b.id}`,
                            }));
                        }}
                    />
                </Form.Item>

                {/* <Form.Item
                    name="description"
                    label="Chain Description"
                >
                    <Input.TextArea 
                        placeholder="Enter chain description" 
                        rows={2}
                    />
                </Form.Item> */}

                <Form.Item>
                    <Space
                        style={{
                            width: "100%",
                            justifyContent: "space-between",
                        }}
                    >
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            style={{ flex: 1 }}
                        >
                            Create Chain
                        </Button>
                        <Button
                            danger
                            onClick={handleReset}
                            style={{ flex: 1 }}
                        >
                            Reset Chain
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    );
}

export default OfferChainForm;
