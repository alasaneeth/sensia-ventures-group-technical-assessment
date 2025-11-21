import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Checkbox, Dropdown, message, Radio } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import {
    setCompanies as setCompaniesInRedux,
    setBrands as setBrandsInRedux,
    setSelectedCompanyIds as setSelectedCompanyIdsRedux,
    setSelectedBrandIds as setSelectedBrandIdsRedux,
} from "../../redux/stateSlices/companyBrandFilter";

/**
 * Universal Company and Brand Filter Dropdown Component
 * Manages company and brand selection with automatic Redux synchronization
 *
 * @param {Object} props
 * @param {boolean} props.showBrands - Whether to show brand dropdown (default: true)
 * @param {boolean} props.brandsOptional - Whether brands are optional (default: true)
 * @param {boolean} props.autoSelectAll - Whether to auto-select all on initial load (default: true)
 * @param {string} props.companyButtonText - Custom text for company button (optional)
 * @param {string} props.brandButtonText - Custom text for brand button (optional)
 * @param {string} props.style - Custom style for container (optional)
 */
function CompanyBrandFilter({
    showBrands = true,
    brandsOptional = true,
    autoSelectAll = true,
    companyButtonText,
    brandButtonText,
    style = {},
}) {
    const dispatch = useDispatch();

    // Subscribe to Redux state
    const {
        selectedCompanyIds: reduxSelectedCompanyIds,
        selectedBrandIds: reduxSelectedBrandIds,
        companies: reduxCompanies,
        brands: reduxBrands,
    } = useSelector((state) => state.companyBrandFilter);

    // Local state for UI interactions and loading states
    const [companiesLoading, setCompaniesLoading] = useState(false);
    const [brandsLoading, setBrandsLoading] = useState(false);
    const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
    const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);

    // Refs to track user interactions
    const userExplicitlyUnselectedCompanies = useRef(false);
    const userExplicitlyUnselectedBrands = useRef(false);
    const isInitialCompanyLoad = useRef(true);
    const isInitialBrandLoad = useRef(true);

    // Computed values from Redux state
    const selectedCompanyId =
        reduxSelectedCompanyIds && reduxSelectedCompanyIds.length > 0
            ? reduxSelectedCompanyIds[0]
            : null;

    // Fetch companies
    const fetchCompanies = useCallback(async () => {
        setCompaniesLoading(true);
        try {
            const result = await getCompanies(1, 1000);
            if (typeof result === "string") {
                message.error(result);
                return;
            }
            const companiesData = result.data || [];
            // Update Redux store with companies list
            dispatch(setCompaniesInRedux(companiesData));

            // Auto-select first company on initial load
            if (
                isInitialCompanyLoad.current &&
                result.data &&
                result.data.length > 0
            ) {
                isInitialCompanyLoad.current = false;
                const firstId = result.data[0].id;
                // Dispatch to Redux
                dispatch(setSelectedCompanyIdsRedux([firstId]));
            } else if (isInitialCompanyLoad.current) {
                isInitialCompanyLoad.current = false;
            }
        } catch (err) {
            console.error("Error fetching companies:", err);
        } finally {
            setCompaniesLoading(false);
        }
    }, [autoSelectAll, dispatch]);

    // Fetch brands based on selected companies
    const fetchBrands = useCallback(
        async (preserveSelection = false, currentBrandIds = []) => {
            if (!showBrands || !selectedCompanyId) {
                dispatch(setBrandsInRedux([]));
                if (!preserveSelection) {
                    dispatch(setSelectedBrandIdsRedux([]));
                }
                return;
            }

            setBrandsLoading(true);
            try {
                // Fetch brands for the selected company only
                const result = await getBrands(selectedCompanyId, 1, 1000);
                const brandsData =
                    typeof result !== "string" && result.data
                        ? result.data
                        : [];
                // Update Redux store with brands list
                dispatch(setBrandsInRedux(brandsData));

                if (!preserveSelection) {
                    // Auto-select all brands on initial load if enabled
                    if (
                        autoSelectAll &&
                        isInitialBrandLoad.current &&
                        brandsData.length > 0 &&
                        currentBrandIds.length === 0
                    ) {
                        isInitialBrandLoad.current = false;
                        const allBrandIds = brandsData.map((b) => b.id);
                        // Dispatch to Redux
                        dispatch(setSelectedBrandIdsRedux(allBrandIds));
                    } else {
                        isInitialBrandLoad.current = false;
                        // Filter selectedBrandIds to only include brands that are still available
                        const availableBrandIds = brandsData.map((b) => b.id);
                        const filteredSelectedBrandIds = currentBrandIds.filter(
                            (id) => availableBrandIds.includes(id)
                        );
                        // Dispatch to Redux
                        dispatch(setSelectedBrandIdsRedux(filteredSelectedBrandIds));
                    }
                } else {
                    isInitialBrandLoad.current = false;
                    // Filter selectedBrandIds to only include brands that are still available
                    const availableBrandIds = brandsData.map((b) => b.id);
                    const filteredSelectedBrandIds = currentBrandIds.filter(
                        (id) => availableBrandIds.includes(id)
                    );
                    // Dispatch to Redux
                    dispatch(setSelectedBrandIdsRedux(filteredSelectedBrandIds));
                }
            } catch (err) {
                console.error("Error fetching brands:", err);
            } finally {
                setBrandsLoading(false);
            }
        },
        [showBrands, autoSelectAll, dispatch]
    );

    // Load companies on mount
    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    // Update brands when company selection changes
    useEffect(() => {
        if (selectedCompanyId && showBrands) {
            fetchBrands(false, reduxSelectedBrandIds);
        } else if (!selectedCompanyId && showBrands) {
            dispatch(setBrandsInRedux([]));
            dispatch(setSelectedBrandIdsRedux([]));
        }
    }, [reduxSelectedCompanyIds, showBrands, fetchBrands, dispatch]);

    // Company handlers
    const handleCompanyChange = useCallback(
        (value) => {
            userExplicitlyUnselectedCompanies.current = false;
            // Dispatch to Redux
            dispatch(setSelectedCompanyIdsRedux([value]));
        },
        [dispatch]
    );

    const companySelectedCount = selectedCompanyId ? 1 : 0;
    const companyTotalCount = reduxCompanies.length;

    const handleCompanyDropdownOpenChange = (open) => {
        setCompanyDropdownOpen(open);
        if (!open && selectedCompanyId) {
            userExplicitlyUnselectedCompanies.current = false;
        }
    };

    const getCompanyButtonText = () => {
        if (companyButtonText) return companyButtonText;
        if (companiesLoading) return "Loading companies...";
        if (companySelectedCount === 0) return "Select Company";
        const selectedCompany = reduxCompanies.find(
            (c) => c.id === selectedCompanyId
        );
        return selectedCompany ? selectedCompany.name : "Select Company";
    };

    // Brand handlers
    const handleBrandSelectAll = useCallback(() => {
        userExplicitlyUnselectedBrands.current = false;
        const allIds = reduxBrands.map((b) => b.id);
        // Dispatch to Redux
        dispatch(setSelectedBrandIdsRedux(allIds));
    }, [reduxBrands, dispatch]);

    const handleBrandUnselectAll = useCallback(() => {
        userExplicitlyUnselectedBrands.current = true;
        // Dispatch to Redux
        dispatch(setSelectedBrandIdsRedux([]));
    }, [dispatch]);

    const handleBrandCheckboxChange = useCallback(
        (checkedValues) => {
            if (checkedValues.length > 0) {
                userExplicitlyUnselectedBrands.current = false;
            }
            // Dispatch to Redux
            dispatch(setSelectedBrandIdsRedux(checkedValues));
        },
        [dispatch]
    );

    const isAllBrandsSelected =
        reduxBrands.length > 0 && reduxSelectedBrandIds.length === reduxBrands.length;
    const brandSelectedCount = reduxSelectedBrandIds.length;
    const brandTotalCount = reduxBrands.length;

    const handleBrandDropdownOpenChange = (open) => {
        setBrandDropdownOpen(open);
        if (
            open &&
            reduxSelectedBrandIds.length === 0 &&
            reduxBrands.length > 0 &&
            !brandsLoading &&
            !userExplicitlyUnselectedBrands.current &&
            autoSelectAll
        ) {
            handleBrandSelectAll();
        }
        if (!open && reduxSelectedBrandIds.length > 0) {
            userExplicitlyUnselectedBrands.current = false;
        }
    };

    const getBrandButtonText = () => {
        if (brandButtonText) return brandButtonText;
        if (brandsLoading) return "Loading brands...";
        if (brandSelectedCount === 0) return "Select Brand";
        if (isAllBrandsSelected) return `All Brands (${brandTotalCount})`;
        return `${brandSelectedCount} of ${brandTotalCount} selected`;
    };

    // Company dropdown overlay (custom to prevent auto-close)
    const companyDropdownOverlay = (
        <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
                backgroundColor: "#fff",
                borderRadius: "6px",
                boxShadow:
                    "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
                minWidth: "200px",
            }}
        >
            <div
                style={{
                    padding: "8px",
                    maxHeight: "300px",
                    overflowY: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <Radio.Group
                    value={selectedCompanyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    {reduxCompanies.map((company) => (
                        <Radio
                            key={company.id}
                            value={company.id}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            {company.name}
                        </Radio>
                    ))}
                </Radio.Group>
            </div>
        </div>
    );

    // Brand dropdown overlay (custom to prevent auto-close)
    const brandDropdownOverlay = (
        <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
                backgroundColor: "#fff",
                borderRadius: "6px",
                boxShadow:
                    "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
                minWidth: "250px",
            }}
        >
            <div
                style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #f0f0f0",
                    cursor: "pointer",
                }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isAllBrandsSelected) {
                        handleBrandUnselectAll();
                    } else {
                        handleBrandSelectAll();
                    }
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <Checkbox
                    checked={isAllBrandsSelected}
                    indeterminate={
                        !isAllBrandsSelected &&
                        brandSelectedCount > 0 &&
                        brandSelectedCount < brandTotalCount
                    }
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isAllBrandsSelected) {
                            handleBrandUnselectAll();
                        } else {
                            handleBrandSelectAll();
                        }
                    }}
                    onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    Select All
                </Checkbox>
            </div>
            <div
                style={{
                    padding: "8px",
                    maxHeight: "300px",
                    overflowY: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <Checkbox.Group
                    value={reduxSelectedBrandIds}
                    onChange={handleBrandCheckboxChange}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                />
        </div>
        <div
            style={{
                padding: "8px",
                maxHeight: "300px",
                overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <Checkbox.Group
                value={reduxSelectedBrandIds}
                onChange={handleBrandCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                }}
            >
                {reduxBrands.map((brand) => (
                    <Checkbox
                        key={brand.id}
                        value={brand.id}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {brand.name}
                    </Checkbox>
                ))}
            </Checkbox.Group>
            </div>
                    </Button>
                </Dropdown>
            )}
        </div>
    )

export default CompanyBrandFilter;
