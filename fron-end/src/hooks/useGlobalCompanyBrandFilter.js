import { useMemo } from "react";
import { useSelector } from "react-redux";

/**
 * Custom hook to get the global company/brand filter state and build API filters
 * 
 * @returns {Object} Object containing:
 *   - selectedCompanyIds: Array of selected company IDs
 *   - selectedBrandIds: Array of selected brand IDs
 *   - companies: Array of all companies
 *   - brands: Array of all brands
 *   - apiFilters: Object with companyId and brandId filters ready for API calls
 */
export const useGlobalCompanyBrandFilter = () => {
    const { selectedCompanyIds, selectedBrandIds, companies, brands } = useSelector(
        (state) => state.companyBrandFilter
    );

    // Build API filters object - memoized to prevent infinite loops
    const apiFilters = useMemo(() => {
        const filters = {};

        // Add brand filter - only apply if not all items are selected (optimization)
        if (selectedBrandIds.length > 0 && brands.length > 0) {
            if (selectedBrandIds.length < brands.length) {
                filters.brandId = [{ in: selectedBrandIds }];
            }
        }

        return Object.keys(filters).length > 0 ? filters : undefined;
    }, [selectedBrandIds, brands.length]);

    return {
        selectedCompanyIds,
        selectedBrandIds,
        companies,
        brands,
        apiFilters,
    };
};

