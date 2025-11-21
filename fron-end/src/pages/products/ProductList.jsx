import React, { useMemo, useState, useCallback } from "react";
import { Card } from "react-bootstrap";
import ProductTable from "../../components/products/ProductTable";
import CategoryMultiSelect from "../../components/products/CategoryMultiSelect";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

function ProductList() {
    const { selectedBrandIds } = useGlobalCompanyBrandFilter();
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

    // Handle category filter apply
    const handleCategoryApply = useCallback((categoryIds) => {
        setSelectedCategoryIds(categoryIds);
    }, []);

    // Build combined filters
    const filters = useMemo(() => {
        const combinedFilters = {};

        // Add brand filter
        if (selectedBrandIds && selectedBrandIds.length > 0) {
            combinedFilters.brandId = [{ in: selectedBrandIds }];
        }

        // Add category filter
        if (selectedCategoryIds && selectedCategoryIds.length > 0) {
            combinedFilters.categoryIds = selectedCategoryIds;
        }

        return Object.keys(combinedFilters).length > 0 ? combinedFilters : undefined;
    }, [selectedBrandIds, selectedCategoryIds]);

    const handleRowClick = (data) => {
        console.log("Product clicked:", data);
        // Add navigation or modal logic here if needed
    };

    return (
        <div>
            <Card>
                <Card.Header>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ margin: 0 }}>Products</h4>
                        <CategoryMultiSelect onApply={handleCategoryApply} />
                    </div>
                </Card.Header>
                <Card.Body>
                    <ProductTable
                        filters={filters}
                        onRowClick={handleRowClick}
                    />
                </Card.Body>
            </Card>
        </div>
    );
}

export default ProductList;
