import React, { useState, useEffect } from "react";
import { Select, Spin } from "antd";
import { getProductVariations } from "../../api/productVariation";

const { Option } = Select;

function ProductVariationSelector({ value, onChange }) {
    const [variations, setVariations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    useEffect(() => {
        fetchVariations();
    }, []);

    const fetchVariations = async () => {
        setLoading(true);
        try {
            const result = await getProductVariations(1, 100); // Fetch first 100
            const dataToSet = result?.data || [];
            setVariations(dataToSet);
        } catch (error) {
            console.error("Failed to load product variations:", error);
            setVariations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (selectedValue) => {
        const selectedVariation = variations.find(
            (v) => v.id === selectedValue
        );
        if (onChange) {
            onChange(selectedValue, selectedVariation);
        }
    };

    const filterOption = (input, option) => {
        const variation = variations.find((v) => v.id === option.value);
        if (!variation) return false;

        const searchLower = input.toLowerCase();
        return (
            variation.productVariationCode?.toLowerCase().includes(searchLower) ||
            variation.productVariationDescription?.toLowerCase().includes(searchLower) ||
            variation.product?.productName?.toLowerCase().includes(searchLower)
        );
    };

    return (
        <Select
            showSearch
            value={value}
            placeholder="Select a product variation"
            optionFilterProp="children"
            onChange={handleChange}
            onSearch={setSearchValue}
            filterOption={filterOption}
            loading={loading}
            notFoundContent={loading ? <Spin size="small" /> : "No variations found"}
            style={{ width: "100%" }}
        >
            {variations.map((variation) => (
                <Option key={variation.id} value={variation.id}>
                    [{variation.productVariationCode}] -{" "}
                    {variation.productVariationDescription ||
                        variation.productVariation ||
                        "No description"}
                </Option>
            ))}
        </Select>
    );
}

export default ProductVariationSelector;

