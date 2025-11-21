import React, { useMemo } from "react";
import { Card } from "react-bootstrap";
import CategoryTable from "../../components/products/CategoryTable";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

function CategoryList() {
    const { selectedBrandIds } = useGlobalCompanyBrandFilter();

    // Build brand filter on the fly
    const brandFilters = useMemo(() => {
        if (selectedBrandIds && selectedBrandIds.length > 0) {
            return {
                brandId: [{ in: selectedBrandIds }],
            };
        }
        return undefined;
    }, [selectedBrandIds]);

    const handleRowClick = (data) => {
        console.log("Category clicked:", data);
        // Add navigation or modal logic here if needed
    };

    return (
        <div>
            <Card>
                <Card.Header>
                    <h4>Categories</h4>
                </Card.Header>
                <Card.Body>
                    <CategoryTable
                        filters={brandFilters}
                        onRowClick={handleRowClick}
                    />
                </Card.Body>
            </Card>
        </div>
    );
}

export default CategoryList;
