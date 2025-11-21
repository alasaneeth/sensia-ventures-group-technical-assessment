import { Dropdown, Button, Checkbox, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useState, useCallback } from "react";
import {
    setSelectedCompanyIds,
    setSelectedBrandIds,
    setBrands,
} from "../../redux/stateSlices/companyBrandFilter";
import { getBrandsFor } from "../../api/brands";

function CompanyBrandFilterV1() {
    const dispatch = useDispatch();
    
    // Get state from Redux
    const { selectedCompanyIds, selectedBrandIds, companies, brands } = useSelector(
        (state) => state.companyBrandFilter
    );

    const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
    const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
    const [brandsLoading, setBrandsLoading] = useState(false);

    // Handle company selection
    const handleCompanyChange = useCallback(
        async (checkedValues) => {
            // Prevent deselecting all companies
            if (checkedValues.length === 0) {
                message.warning("At least one company must be selected");
                return;
            }

            dispatch(setSelectedCompanyIds(checkedValues));

            // Fetch brands for selected companies
            if (checkedValues.length > 0) {
                setBrandsLoading(true);
                try {
                    // Fetch all brands for selected companies in a single request
                    const allBrands = await getBrandsFor(checkedValues);

                    if (typeof allBrands !== "string" && Array.isArray(allBrands)) {
                        dispatch(setBrands(allBrands));

                        // Auto-select all brands
                        const allBrandIds = allBrands.map((b) => b.id);
                        dispatch(setSelectedBrandIds(allBrandIds));
                    }
                } catch (error) {
                    console.error("Error fetching brands:", error);
                } finally {
                    setBrandsLoading(false);
                }
            } else {
                dispatch(setBrands([]));
                dispatch(setSelectedBrandIds([]));
            }
        },
        [dispatch]
    );

    // Handle brand selection
    const handleBrandChange = useCallback(
        (checkedValues) => {
            // Prevent deselecting all brands
            if (checkedValues.length === 0) {
                message.warning("At least one brand must be selected");
                return;
            }
            
            dispatch(setSelectedBrandIds(checkedValues));
        },
        [dispatch]
    );

    // Company dropdown overlay
    const companyDropdownOverlay = (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "6px",
                boxShadow:
                    "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
                minWidth: "200px",
                maxWidth: "300px",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                style={{
                    padding: "8px",
                    maxHeight: "300px",
                    overflowY: "auto",
                }}
            >
                <Checkbox.Group
                    value={selectedCompanyIds}
                    onChange={handleCompanyChange}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    {companies.map((company) => (
                        <Checkbox key={company.id} value={company.id}>
                            {company.name}
                        </Checkbox>
                    ))}
                </Checkbox.Group>
            </div>
        </div>
    );

    // Brand dropdown overlay
    const brandDropdownOverlay = (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "6px",
                boxShadow:
                    "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
                minWidth: "200px",
                maxWidth: "300px",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div
                style={{
                    padding: "8px",
                    maxHeight: "300px",
                    overflowY: "auto",
                }}
            >
                <Checkbox.Group
                    value={selectedBrandIds}
                    onChange={handleBrandChange}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    {brands.map((brand) => (
                        <Checkbox key={brand.id} value={brand.id}>
                            {brand.name}
                        </Checkbox>
                    ))}
                </Checkbox.Group>
            </div>
        </div>
    );

    const getCompanyButtonText = () => {
        if (selectedCompanyIds.length === 0) return "Select Companies";
        if (selectedCompanyIds.length === 1) {
            const company = companies.find((c) => c.id === selectedCompanyIds[0]);
            return company ? company.name : "Select Companies";
        }
        return `${selectedCompanyIds.length} Companies Selected`;
    };

    const getBrandButtonText = () => {
        if (brandsLoading) return "Loading brands...";
        if (selectedBrandIds.length === 0) return "Select Brands";
        if (selectedBrandIds.length === brands.length && brands.length > 0) {
            return `All Brands (${brands.length})`;
        }
        return `${selectedBrandIds.length} of ${brands.length} Brands`;
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 12,
            }}
        >
            {/* Company Dropdown */}
            <Dropdown
                popupRender={() => companyDropdownOverlay}
                trigger={["click"]}
                open={companyDropdownOpen}
                onOpenChange={setCompanyDropdownOpen}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
            >
                <Button
                    style={{
                        width: 180,
                        minWidth: 140,
                        textAlign: "left",
                        height: "32px",
                    }}
                >
                    <span>{getCompanyButtonText()}</span>
                    <DownOutlined style={{ float: "right", marginTop: "4px" }} />
                </Button>
            </Dropdown>

            {/* Brand Dropdown */}
            <Dropdown
                popupRender={() => brandDropdownOverlay}
                trigger={["click"]}
                open={brandDropdownOpen}
                onOpenChange={setBrandDropdownOpen}
                disabled={selectedCompanyIds.length === 0}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
            >
                <Button
                    type="primary"
                    style={{
                        height: "32px",
                    }}
                    loading={brandsLoading}
                    disabled={selectedCompanyIds.length === 0}
                >
                    <span>{getBrandButtonText()}</span>
                    <DownOutlined style={{ float: "right", marginTop: "4px" }} />
                </Button>
            </Dropdown>
        </div>
    );
}

export default CompanyBrandFilterV1;