import React, {
    useCallback,
    useMemo,
    useRef,
    useState,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Pagination } from "antd";
import { mapAgToApiFilters } from "../../util/tableHelpers";

ModuleRegistry.registerModules([AllCommunityModule]);

const Table = forwardRef(({
    // Data and API
    fetchData,
    rowData = [],
    loading = false,
    
    // Column configuration
    columnDefs = [],
    defaultColDef = {},
    
    // Pagination
    pagination = {
        current: 1,
        pageSize: 20,
        total: 0,
        pages: 1,
        showSizeChanger: true,
        pageSizeOptions: ["100", "150", "175", "200"],
        showQuickJumper: true,
    },
    
    // Parent-controlled pagination
    paginationControl = false, // Set to true if parent will handle pagination state
    onPaginationChange, // Callback when pagination changes (if paginationControl is true)
    
    // Grid options
    gridOptions = {},
    
    // Event handlers
    onFilterChange,
    onSortChange,
    onPageChange,
    onRowClick,
    
    // External filters (from props)
    filters = {},
    
    // Grid configuration
    domLayout = "autoHeight",
    minHeight = "400px",
    theme = "ag-theme-quartz",
    
    // Master detail configuration
    masterDetail = false,
    detailCellRendererParams = {},
    
    // Row selection
    rowSelection = "single",
    
    // Pagination visibility
    showPagination = true,
    
    // Custom overlays
    overlayLoadingTemplate = '<span class="ag-overlay-loading-center">Loading...</span>',
    overlayNoRowsTemplate = '<span class="ag-overlay-loading-center">No data available</span>',
    
    // Style customization
    getRowStyle,
    
    // Additional props
    ...additionalProps
}, ref) => {
    const gridRef = useRef();
    const filtersRef = useRef({});
    const sortRef = useRef([]);
    
    // Use internal state for pagination only if not controlled by parent
    const [internalPage, setInternalPage] = useState(pagination.current || 1);
    const [internalPageSize, setInternalPageSize] = useState(pagination.pageSize || 100);
    const [filterTrigger, setFilterTrigger] = useState(0);
    
    // Use either parent-controlled pagination or internal state
    const currentPage = paginationControl ? pagination.current : internalPage;
    const currentPageSize = paginationControl ? pagination.pageSize : internalPageSize;

    // Expose grid API through ref - memoize to prevent unnecessary re-renders
    const refApi = useMemo(() => ({
        getGridApi: () => gridRef.current?.api,
        getColumnApi: () => gridRef.current?.columnApi,
        getFilters: () => filtersRef.current,
        getSorts: () => sortRef.current,
        clearFilters: () => {
            gridRef.current?.api?.setFilterModel(null);
        },
        refreshData: () => {
            setFilterTrigger(prev => prev + 1);
        }
    }), []);
    
    useImperativeHandle(ref, () => refApi);

    // Enhanced default column definition with improved filter behavior
    const enhancedDefaultColDef = useMemo(() => ({
        resizable: true,
        minWidth: 110,
        sortable: true,
        filter: true,
        filterParams: {
            buttons: ["apply", "clear"],
            closeOnApply: true,
            maxNumConditions: 1,
            // Auto-apply filters without needing to click apply
            debounceMs: 300,
            // Custom clear button behavior to automatically apply when clearing
            onClearCallback: () => {
                // We'll trigger the filter change in the next tick
                setTimeout(() => {
                    setFilterTrigger(prev => prev + 1);
                }, 0);
            },
        },
        ...defaultColDef,
    }), [defaultColDef]);

    // Enhanced grid options with better defaults
    const enhancedGridOptions = useMemo(() => ({
        suppressMultiSort: false,
        multiSortKey: "ctrl",
        autoSizeStrategy: { type: "fitCellContents" },
        animateRows: true,
        suppressPaginationPanel: true,
        onRowClicked: onRowClick ? (event) => onRowClick(event.data) : undefined,
        // Fix height issues when no data
        getRowHeight: () => undefined, // Use default row height
        ...gridOptions,
    }), [gridOptions, onRowClick]);

    // Handle filter changes with automatic API call
    const onFilterChanged = useCallback((params) => {
        // Get the filter model from the grid
        const model = params.api.getFilterModel();
        filtersRef.current = model || {};
        
        // Check if this is a filter clear event (model is empty and we had filters before)
        // We don't need to do anything special here because we've added onClearCallback
        // to the filter params which will trigger the filter change
        
        // Combine AG Grid filters with external filters
        const apiFilters = mapAgToApiFilters(filtersRef.current);
        
        // Add external filters
        if (filters) {
            Object.keys(filters).forEach((key) => {
                apiFilters[key] = filters[key];
            });
        }

        // Reset to first page when filters change
        if (!paginationControl) {
            setInternalPage(1);
        } else if (onPaginationChange) {
            // If parent controls pagination, notify about page reset
            // We'll do this in a separate effect to avoid circular updates
            setTimeout(() => {
                onPaginationChange(1, currentPageSize);
            }, 0);
        }
        
        // Call external filter change handler if provided
        if (onFilterChange) {
            onFilterChange({
                agFilters: filtersRef.current,
                apiFilters,
                page: 1,
                pageSize: currentPageSize,
                sort: sortRef.current,
            });
        }
        
        // Trigger data fetch - this will happen for both apply and clear
        // since we've added onClearCallback to the filter params
        setFilterTrigger(prev => prev + 1);
    }, [filters, onFilterChange, currentPageSize, paginationControl, onPaginationChange]);

    // Handle sort changes
    const onSortChanged = useCallback((params) => {
        const cols = params.api.getColumns?.() || [];
        const sortModel = cols
            .map((c) => ({
                colId: c.getColId(),
                sort: c.getSort?.(),
                sortIndex: c.getSortIndex?.() ?? 0,
            }))
            .filter((c) => c.sort)
            .sort((a, b) => a.sortIndex - b.sortIndex)
            .map(({ colId, sort }) => ({ colId, sort }));

        // Update the sort ref
        sortRef.current = sortModel;
        
        // Always reset to first page when sort changes
        if (!paginationControl) {
            setInternalPage(1);
        } else if (onPaginationChange) {
            // If parent controls pagination, notify about page reset
            // We'll do this in a separate effect to avoid circular updates
            setTimeout(() => {
                onPaginationChange(1, currentPageSize);
            }, 0);
        }
        
        // Call external sort change handler if provided
        if (onSortChange) {
            onSortChange({
                sortModel,
                // Always reset page to 1 on any sort change
                page: 1,
                pageSize: currentPageSize,
                filters: filtersRef.current,
            });
        }
        
        // Trigger data fetch
        setFilterTrigger(prev => prev + 1);
    }, [onSortChange, currentPageSize, paginationControl, onPaginationChange]);

    // Handle pagination changes
    const handlePageChange = useCallback((nextPage, nextPageSize) => {
        // Update internal state if not parent-controlled
        if (!paginationControl) {
            setInternalPage(nextPage);
            if (nextPageSize !== currentPageSize) {
                setInternalPageSize(nextPageSize);
            }
            
            // Trigger data fetch for internal pagination
            setFilterTrigger(prev => prev + 1);
        }
        
        // Call parent pagination change handler if provided
        if (paginationControl && onPaginationChange) {
            // Use setTimeout to avoid circular updates
            setTimeout(() => {
                onPaginationChange(nextPage, nextPageSize || currentPageSize);
            }, 0);
        }
        
        // Call page change handler if provided
        if (onPageChange) {
            onPageChange({
                page: nextPage,
                pageSize: nextPageSize || currentPageSize,
                filters: filtersRef.current,
                sort: sortRef.current,
            });
        }
    }, [currentPageSize, onPageChange, paginationControl, onPaginationChange]);

    // Fetch data when dependencies change
    useEffect(() => {
        if (fetchData) {
            const apiFilters = mapAgToApiFilters(filtersRef.current);
            
            // Add external filters
            if (filters) {
                Object.keys(filters).forEach((key) => {
                    apiFilters[key] = filters[key];
                });
            }

            // Prepare sort model for API
            let sort;
            if (sortRef.current?.length) {
                sort = sortRef.current.map(({ colId, sort }) => ({
                    sortBy: colId,
                    dir: sort,
                }))[0];
            }

            fetchData({
                page: currentPage,
                pageSize: currentPageSize,
                filters: apiFilters,
                sort,
            });
        }
    }, [filterTrigger]);

    const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / currentPageSize));

    // Container style with minimum height to prevent shrinking
    const containerStyle = useMemo(() => ({
        width: "100%",
        minHeight: minHeight,
        display: "flex",
        flexDirection: "column",
    }), [minHeight]);

    // Grid container style
    const gridContainerStyle = useMemo(() => ({
        width: "100%",
        flex: 1,
        minHeight: rowData.length === 0 ? "300px" : "auto", // Ensure minimum height when no data
    }), [rowData.length]);

    return (
        <div style={containerStyle}>
            <div className={theme} style={gridContainerStyle}>
                <AgGridReact
                    ref={gridRef}
                    domLayout={domLayout}
                    gridOptions={enhancedGridOptions}
                    columnDefs={columnDefs}
                    defaultColDef={enhancedDefaultColDef}
                    rowData={rowData}
                    loading={loading}
                    overlayLoadingTemplate={overlayLoadingTemplate}
                    overlayNoRowsTemplate={overlayNoRowsTemplate}
                    onFilterChanged={onFilterChanged}
                    onSortChanged={onSortChanged}
                    rowSelection={rowSelection}
                    masterDetail={masterDetail}
                    detailCellRendererParams={detailCellRendererParams}
                    getRowStyle={getRowStyle}
                    {...additionalProps}
                />
            </div>

            {/* Pagination */}
            {showPagination && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: 8,
                        gap: 12,
                        flexShrink: 0, // Prevent pagination from shrinking
                    }}
                >
                    <div style={{ fontSize: 12 }}>
                        Page <b>{currentPage}</b> of <b>{totalPages}</b> — Total rows:{" "}
                        <b>{pagination.total || 0}</b>
                    </div>
                    <Pagination
                        current={currentPage}
                        pageSize={currentPageSize}
                        total={pagination.total || 0}
                        showSizeChanger={pagination.showSizeChanger}
                        pageSizeOptions={pagination.pageSizeOptions}
                        showQuickJumper={pagination.showQuickJumper}
                        onChange={handlePageChange}
                        onShowSizeChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
});

Table.displayName = "Table";

export default Table;
