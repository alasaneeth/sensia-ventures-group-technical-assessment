import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Checkbox, message, Spin, Button, Space } from "antd";
import { getCategories } from "../../api/category";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

const CategoryFilter = forwardRef((props, ref) => {
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [appliedCategories, setAppliedCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const { selectedBrandIds } = useGlobalCompanyBrandFilter();

    // Required by AG Grid: expose methods to the grid
    useImperativeHandle(ref, () => ({
        doesFilterPass: () => true, // We handle filtering on the backend
        isFilterActive: () => appliedCategories.length > 0,
        getModel: () => {
            if (appliedCategories.length === 0) return null;
            return { values: appliedCategories };
        },
        setModel: (model) => {
            const values = model ? model.values || [] : [];
            setAppliedCategories(values);
            setSelectedCategories(values);
        },
    }));

    // Fetch categories when brands change
    useEffect(() => {
        const fetchCategories = async () => {
            if (!selectedBrandIds || selectedBrandIds.length === 0) {
                setCategories([]);
                setSelectedCategories([]); // Reset selected categories when brands change
                return;
            }
            
            setLoading(true);
            try {
                const filters = {
                    brandId: [{ in: selectedBrandIds }],
                };
                const result = await getCategories(1, 1000, filters);
                setCategories(result?.data || []);
                setSelectedCategories([]); // Ensure all start unselected
            } catch (error) {
                console.error("Error fetching categories:", error);
                message.error("Failed to load categories");
            } finally {
                setLoading(false);
            }
        };
        
        fetchCategories();
    }, [selectedBrandIds]);

    const handleCheckboxChange = (categoryId, checked) => {
        const newSelection = checked
            ? [...selectedCategories, categoryId]
            : selectedCategories.filter(id => id !== categoryId);
        
        setSelectedCategories(newSelection);
    };

    const handleApply = () => {
        setAppliedCategories(selectedCategories);
        console.log('CategoryFilter: Applying filter with categories:', selectedCategories);
        console.log('CategoryFilter: Available props:', Object.keys(props));
        
        // Notify AG Grid that the filter has changed
        // Use setTimeout to ensure state is updated first
        setTimeout(() => {
            // Try all possible callback methods
            if (typeof props.filterChangedCallback === 'function') {
                console.log('CategoryFilter: Calling filterChangedCallback');
                props.filterChangedCallback();
            }
            
            if (props.api) {
                console.log('CategoryFilter: Calling api.onFilterChanged');
                props.api.onFilterChanged();
            }
            
            if (props.columnApi) {
                console.log('CategoryFilter: Calling columnApi.onFilterChanged');
                props.columnApi.onFilterChanged();
            }
            
            // Try to get the grid API and trigger filter change
            if (props.context && props.context.gridApi) {
                console.log('CategoryFilter: Calling context.gridApi.onFilterChanged');
                props.context.gridApi.onFilterChanged();
            }
            
            // Force AG Grid to refresh filters
            if (props.api && props.api.refreshFilters) {
                console.log('CategoryFilter: Calling api.refreshFilters');
                props.api.refreshFilters();
            }
        }, 0);
    };

    const handleClear = () => {
        setSelectedCategories([]);
        setAppliedCategories([]);
        // Notify AG Grid that the filter has changed
        // Use setTimeout to ensure state is updated first
        setTimeout(() => {
            if (typeof props.filterChangedCallback === 'function') {
                props.filterChangedCallback();
            }
            // Also try to trigger AG Grid's filter change event directly
            if (props.api) {
                props.api.onFilterChanged();
            }
        }, 0);
    };

    if (loading) {
        return (
            <div style={{ padding: '10px', width: '250px', textAlign: 'center' }}>
                <Spin size="small" />
                <div style={{ marginTop: '8px' }}>Loading categories...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '10px', width: '250px' }}>
            <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '10px' }}>
                {categories.length === 0 ? (
                    <div style={{ color: '#999', fontStyle: 'italic' }}>No categories available</div>
                ) : (
                    categories.map((category) => (
                        <div key={category.id} style={{ marginBottom: '8px' }}>
                            <Checkbox
                                checked={selectedCategories.includes(category.id)}
                                onChange={(e) => handleCheckboxChange(category.id, e.target.checked)}
                            >
                                {category.name}
                            </Checkbox>
                        </div>
                    ))
                )}
            </div>
            
            {/* Apply and Clear buttons */}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
                <Space>
                    <Button 
                        type="primary" 
                        size="small" 
                        onClick={handleApply}
                        disabled={selectedCategories.length === 0}
                    >
                        Apply
                    </Button>
                    <Button 
                        size="small" 
                        onClick={handleClear}
                        disabled={selectedCategories.length === 0 && appliedCategories.length === 0}
                    >
                        Clear
                    </Button>
                </Space>
            </div>
        </div>
    );
});

CategoryFilter.displayName = 'CategoryFilter';

export default CategoryFilter;
