import React, { useMemo, useState, useCallback } from "react";
import { Card } from "react-bootstrap";
import BundleSkuTable from "../../components/skus/BundleSkuTable";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

function BundleSkuList() {
    const { selectedBrandIds } = useGlobalCompanyBrandFilter();

    // Build combined filters
    const filters = useMemo(() => {
        const combinedFilters = {};

        // Add brand filter
        if (selectedBrandIds && selectedBrandIds.length > 0) {
            combinedFilters.brandId = [{ in: selectedBrandIds }];
        }

        return Object.keys(combinedFilters).length > 0 ? combinedFilters : undefined;
    }, [selectedBrandIds]);

    const handleRowClick = (data) => {
        console.log("Bundle SKU clicked:", data);
        // Add navigation or modal logic here if needed
    };

    return (
        <div>
            <Card>
                <Card.Header>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ margin: 0 }}>Bundle SKUs</h4>
                    </div>
                </Card.Header>
                <Card.Body>
                    <BundleSkuTable
                        filters={filters}
                        onRowClick={handleRowClick}
                    />
                </Card.Body>
            </Card>
        </div>
    );
}

export default BundleSkuList;
