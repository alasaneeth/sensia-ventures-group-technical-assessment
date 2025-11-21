import { Dropdown, Button, Checkbox, Spin } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useState, useEffect, useCallback } from "react";
import { getCategories } from "../../api/category";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

function CategoryMultiSelect({ onApply }) {
    const { selectedBrandIds } = useGlobalCompanyBrandFilter();
    const [categories, setCategories] = useState([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch categories when brands change
    useEffect(() => {
        const fetchCategories = async () => {
            if (!selectedBrandIds || selectedBrandIds.length === 0) {
                setCategories([]);
                setSelectedCategoryIds([]);
                return;
            }

            setLoading(true);
            try {
                const categoryFilters = {
                    brandId: [{ in: selectedBrandIds }],
                };
                const result = await getCategories(1, 1000, categoryFilters);
                setCategories(result?.data || []);
                // Reset selection when brands change
                setSelectedCategoryIds([]);
            } catch (error) {
                console.error("Error fetching categories:", error);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [selectedBrandIds]);

    // Handle category selection
    const handleCategoryChange = useCallback((checkedValues) => {
        setSelectedCategoryIds(checkedValues);
    }, []);

    // Handle apply button click
    const handleApply = useCallback(() => {
        if (onApply) {
            onApply(selectedCategoryIds);
        }
        setDropdownOpen(false);
    }, [selectedCategoryIds, onApply]);

    // Handle clear button click
    const handleClear = useCallback(() => {
        setSelectedCategoryIds([]);
        if (onApply) {
            onApply([]);
        }
        setDropdownOpen(false);
    }, [onApply]);

    // Category dropdown overlay
    const categoryDropdownOverlay = (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "6px",
                boxShadow:
                    "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
                minWidth: "250px",
                maxWidth: "350px",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {loading ? (
                <div
                    style={{
                        padding: "20px",
                        textAlign: "center",
                    }}
                >
                    <Spin size="small" />
                    <div style={{ marginTop: "8px" }}>Loading categories...</div>
                </div>
            ) : (
                <>
                    <div
                        style={{
                            padding: "8px",
                            maxHeight: "300px",
                            overflowY: "auto",
                        }}
                    >
                        {categories.length === 0 ? (
                            <div
                                style={{
                                    padding: "12px",
                                    color: "#999",
                                    fontStyle: "italic",
                                }}
                            >
                                No categories available
                            </div>
                        ) : (
                            <Checkbox.Group
                                value={selectedCategoryIds}
                                onChange={handleCategoryChange}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                }}
                            >
                                {categories.map((category) => (
                                    <Checkbox key={category.id} value={category.id}>
                                        {category.name}
                                    </Checkbox>
                                ))}
                            </Checkbox.Group>
                        )}
                    </div>
                    {categories.length > 0 && (
                        <div
                            style={{
                                borderTop: "1px solid #f0f0f0",
                                padding: "8px",
                                display: "flex",
                                gap: "8px",
                                justifyContent: "flex-end",
                            }}
                        >
                            <Button size="small" onClick={handleClear}>
                                Clear
                            </Button>
                            <Button
                                type="primary"
                                size="small"
                                onClick={handleApply}
                            >
                                Apply
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    const getButtonText = () => {
        if (loading) return "Loading...";
        if (selectedCategoryIds.length === 0) return "All Categories";
        if (selectedCategoryIds.length === 1) {
            const category = categories.find(
                (c) => c.id === selectedCategoryIds[0]
            );
            return category ? category.name : "1 Category";
        }
        return `${selectedCategoryIds.length} Categories`;
    };

    return (
        <Dropdown
            popupRender={() => categoryDropdownOverlay}
            trigger={["click"]}
            open={dropdownOpen}
            onOpenChange={setDropdownOpen}
            disabled={selectedBrandIds.length === 0 || categories.length === 0}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
        >
            <Button
                style={{
                    minWidth: 140,
                    textAlign: "left",
                    height: "32px",
                }}
                disabled={selectedBrandIds.length === 0 || categories.length === 0}
            >
                <span>{getButtonText()}</span>
                <DownOutlined style={{ float: "right", marginTop: "4px" }} />
            </Button>
        </Dropdown>
    );
}

export default CategoryMultiSelect;
