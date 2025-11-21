import React, {
    useCallback,
    useMemo,
    useRef,
    useState,
    useEffect,
    memo,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { Pagination, Modal, message, Button } from "antd";
import { fetchOffers, getOffer, deleteOffer } from "../../api/offer";
import OfferActions from "./OfferActions";
import EditOffer from "./EditOffer";
import OfferSkusTable from "../skusv1/OfferSkusTable";
import { checkGermany } from "../../util/germanyConverter";
import { dateComparator, mapAgToApiFilters } from "../../util/tableHelpers";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Component for rendering SKUs link
const SkusRenderer = (props) => {
    if (!props.value) return "-";

    return (
        <span
            style={{
                textDecoration: "underline",
                cursor: "pointer",
                color: "#1890ff",
            }}
            onClick={() => props.context.handleViewSkus(props.data.id)}
        >
            SKUs
        </span>
    );
};

const OfferTable = memo(function OfferTable({
    selectable = false,
    onSelect,
    renderColumns = null,
    takeNotInChain = true,
    filters = null,
}) {
    const gridRef = useRef(null);

    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [total, setTotal] = useState(0);

    const filtersRef = useRef({});
    const sortRef = useRef([]);

    // Use global brand filter from header
    const { selectedBrandIds, brands } = useGlobalCompanyBrandFilter();

    // State for SKUs modal
    const [isSkusModalVisible, setIsSkusModalVisible] = useState(false);
    const [selectedOfferSkus, setSelectedOfferSkus] = useState([]);
    const [loadingSkus, setLoadingSkus] = useState(false);
    const [selectedOfferTitle, setSelectedOfferTitle] = useState("");

    // State for delete confirmation modal
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedOfferId, setSelectedOfferId] = useState(null);
    const [selectedOfferTitleToDelete, setSelectedOfferTitleToDelete] =
        useState("");
    const [deletingOffer, setDeletingOffer] = useState(false);

    // State for update modal
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [selectedOfferToUpdate, setSelectedOfferToUpdate] = useState(null);
    const [updatingOffer, setUpdatingOffer] = useState(false);

    // Handle viewing SKUs for an offer
    const handleViewSkus = async (offerId) => {
        setLoadingSkus(true);
        setIsSkusModalVisible(true);

        try {
            const offerDetails = await getOffer(offerId);

            if (typeof offerDetails === "string") {
                message.error(offerDetails);
                return;
            }

            setSelectedOfferTitle(offerDetails.title);
            setSelectedOfferSkus(offerDetails.skus || []);
        } catch (error) {
            console.error("Error fetching offer details:", error);
            message.error("Failed to load SKUs for this offer");
        } finally {
            setLoadingSkus(false);
        }
    };

    const columnDefs = useMemo(
        () => [
            {
                field: "id",
                headerName: "ID",
                width: 90,
                sortable: true,
                filter: "agNumberColumnFilter",
                valueGetter: (p) => (p.data?.id ? BigInt(p.data.id) : null),
            },
            {
                field: "brand.company",
                headerName: "Company",
                sortable: true,
                filter: "agTextColumnFilter",
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.brand?.company?.name || "N/A";
                },
            },
            {
                field: "brand",
                headerName: "Brand",
                sortable: true,
                filter: "agTextColumnFilter",
                minWidth: 150,
                valueGetter: (params) => {
                    return params.data?.brand?.name || "-";
                },
            },
            {
                field: "title",
                headerName: "Code",
                sortable: true,
                filter: "agTextColumnFilter",
                width: 200,
            },
            {
                field: "type",
                headerName: "Type",
                sortable: true,
                filter: "agTextColumnFilter",
                valueFormatter: (params) => params.value || "-",
            },
            {
                field: "description",
                headerName: "Description",
                sortable: true,
                filter: "agTextColumnFilter",
                width: 200,
                valueFormatter: (params) => params.value || "-",
            },
            {
                field: "porter",
                headerName: "Porter",
                sortable: true,
                filter: "agTextColumnFilter",
                valueFormatter: (params) => params.value || "-",
            },
            {
                field: "owner",
                headerName: "Owner",
                sortable: true,
                filter: "agTextColumnFilter",
                valueFormatter: (params) => params.value || "-",
            },
            {
                field: "theme",
                headerName: "Theme",
                sortable: true,
                filter: "agTextColumnFilter",
                valueFormatter: (params) => params.value || "-",
            },
            {
                field: "grade",
                headerName: "Grade",
                sortable: true,
                filter: "agTextColumnFilter",
                valueFormatter: (params) => params.value || "-",
            },
            {
                field: "language",
                headerName: "Language",
                sortable: true,
                filter: "agTextColumnFilter",
                valueFormatter: (params) => params.value || "-",
            },
            {
                field: "origin",
                headerName: "Origin",
                sortable: true,
                filter: "agTextColumnFilter",
                valueFormatter: (params) => params.value || "-",
            },
            {
                field: "country",
                headerName: "Country",
                sortable: true,
                filter: "agTextColumnFilter",
                valueFormatter: (params) => checkGermany(params.value) || "-",
            },
            {
                field: "skuExists",
                headerName: "SKUs",
                sortable: false,
                filter: false,
                cellRenderer: SkusRenderer,
            },
            {
                headerName: "Actions",
                field: "actions",
                width: 120,
                sortable: false,
                filter: false,
                pinned: "right",
                cellRenderer: (params) => (
                    <OfferActions
                        record={params.data}
                        onDelete={handleDeleteOffer}
                        onUpdate={handleUpdateOffer}
                    />
                ),
                hide: selectable,
            },
        ],
        [selectable]
    );

    const defaultColDef = useMemo(
        () => ({
            sortable: true,
            filter: true,
            resizable: true,
            filterParams: {
                buttons: ["apply", "clear"],
                closeOnApply: true,
                maxNumConditions: 1,
            },
        }),
        []
    );

    const gridOptions = useMemo(
        () => ({
            suppressMultiSort: false,
            multiSortKey: "ctrl",
            autoSizeStrategy: { type: "fitCellContents" },
            animateRows: true,
            suppressPaginationPanel: true,
            onRowClicked: onSelect
                ? (event) => onSelect(event.data)
                : undefined,
            context: {
                handleViewSkus,
            },
        }),
        [onSelect]
    );

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const apiFilters = mapAgToApiFilters(filtersRef.current);

            // Merge parent filters with table filters
            const mergedFilters = {
                ...(filters ? filters : {}),
                ...apiFilters,
            };

            // Add brand filter only
            // Only apply filter if not all items are selected (optimization)

            mergedFilters.brandId = [{ in: selectedBrandIds }];

            const sortModel = sortRef.current;
            let sort;
            if (sortModel?.length) {
                sort = sortModel.map(({ colId, sort }) => ({
                    sortBy: colId,
                    dir: sort,
                }))[0];
            }

            const result = await fetchOffers(
                page,
                pageSize,
                takeNotInChain,
                mergedFilters,
                [],
                sort
            );

            if (typeof result === "string") {
                message.error(result);
                return;
            }

            setRowData(result.data || []);
            setTotal(result.pagination?.total || 0);
        } catch (error) {
            console.error("Error fetching offers:", error);
            setRowData([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [
        page,
        pageSize,
        selectedBrandIds,
        brands.length,
        takeNotInChain,
        filters,
    ]);

    const [filterTrigger, setFilterTrigger] = useState(0);

    useEffect(() => {
        fetchData();
    }, [fetchData, filterTrigger]);

    const onFilterChanged = useCallback((params) => {
        const model = params.api.getFilterModel();
        filtersRef.current = model || {};
        setPage(1);
        setFilterTrigger((prev) => prev + 1);
    }, []);

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

        sortRef.current = sortModel;
        setPage(1);
        setFilterTrigger((prev) => prev + 1);
    }, []);

    // Handle delete offer button click
    const handleDeleteOffer = useCallback((offer) => {
        setSelectedOfferId(offer.id);
        setSelectedOfferTitleToDelete(offer.title || "this offer");
        setIsDeleteModalVisible(true);
    }, []);

    // Handle confirm delete
    const handleConfirmDelete = useCallback(async () => {
        if (!selectedOfferId) return;

        setDeletingOffer(true);
        try {
            const result = await deleteOffer(selectedOfferId);

            if (result === true) {
                message.success(
                    `Offer "${selectedOfferTitleToDelete}" deleted successfully`
                );
                // Refresh the data
                setFilterTrigger((prev) => prev + 1);
            } else {
                message.error(result || "Failed to delete offer");
            }
        } catch (error) {
            console.error("Error deleting offer:", error);
            message.error("An error occurred while deleting the offer");
        } finally {
            setDeletingOffer(false);
            setIsDeleteModalVisible(false);
            setSelectedOfferId(null);
            setSelectedOfferTitleToDelete("");
        }
    }, [selectedOfferId, selectedOfferTitleToDelete]);

    // Handle cancel delete
    const handleCancelDelete = useCallback(() => {
        setIsDeleteModalVisible(false);
        setSelectedOfferId(null);
        setSelectedOfferTitleToDelete("");
    }, []);

    // Handle update offer button click
    const handleUpdateOffer = useCallback(async (offer) => {
        setUpdatingOffer(true);
        try {
            // Fetch the full offer details
            const offerDetails = await getOffer(offer.id);

            if (typeof offerDetails === "string") {
                message.error(offerDetails);
                return;
            }

            setSelectedOfferToUpdate(offerDetails);
            setIsUpdateModalVisible(true);
        } catch (error) {
            console.error("Error fetching offer details:", error);
            message.error("Failed to load offer details");
        } finally {
            setUpdatingOffer(false);
        }
    }, []);

    // Handle update success
    const handleUpdateSuccess = useCallback(() => {
        setIsUpdateModalVisible(false);
        setSelectedOfferToUpdate(null);
        // Refresh the data
        setFilterTrigger((prev) => prev + 1);
    }, []);

    // Handle cancel update
    const handleCancelUpdate = useCallback(() => {
        setIsUpdateModalVisible(false);
        setSelectedOfferToUpdate(null);
    }, []);

    const handlePageChange = (nextPage, nextPageSize) => {
        setPage(nextPage);
        if (nextPageSize !== pageSize) setPageSize(nextPageSize);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div style={{ width: "100%" }}>
            <div
                className="ag-theme-quartz"
                style={{
                    width: "100%",
                    height: "500px", // Fixed height for the grid
                }}
            >
                <AgGridReact
                    domLayout="normal"
                    ref={gridRef}
                    gridOptions={gridOptions}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowData={rowData}
                    overlayLoadingTemplate={
                        '<span class="ag-overlay-loading-center">Loading...</span>'
                    }
                    overlayNoRowsTemplate={
                        '<span class="ag-overlay-loading-center">No data available</span>'
                    }
                    styleNonce=""
                    loading={loading}
                    onFilterChanged={onFilterChanged}
                    onSortChanged={onSortChanged}
                    getRowHeight={() => 35}
                />
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: 8,
                    gap: 12,
                }}
            >
                <div style={{ fontSize: 12 }}>
                    Page <b>{page}</b> of <b>{totalPages}</b> — Total rows:{" "}
                    <b>{total}</b>
                </div>
                <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    showSizeChanger
                    pageSizeOptions={["100", "150", "175", "200"]}
                    showQuickJumper
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                />
            </div>

            {/* Modal for displaying offer SKUs */}
            <Modal
                title={`SKUs for ${selectedOfferTitle}`}
                open={isSkusModalVisible}
                onCancel={() => setIsSkusModalVisible(false)}
                footer={null}
                width={700}
            >
                <OfferSkusTable
                    selectable={false}
                    skus={selectedOfferSkus}
                    loading={loadingSkus}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                title="Delete Offer"
                open={isDeleteModalVisible}
                onCancel={handleCancelDelete}
                footer={[
                    <Button key="cancel" onClick={handleCancelDelete}>
                        Cancel
                    </Button>,
                    <Button
                        key="delete"
                        type="primary"
                        danger
                        loading={deletingOffer}
                        onClick={handleConfirmDelete}
                    >
                        Yes, Delete
                    </Button>,
                ]}
                width={500}
                destroyOnClose
            >
                <p>
                    Are you sure you want to delete the offer "
                    {selectedOfferTitleToDelete}"? This action cannot be undone.
                </p>
            </Modal>

            {/* Update Offer Modal */}
            <Modal
                title="Update Offer"
                open={isUpdateModalVisible}
                onCancel={handleCancelUpdate}
                footer={null}
                width={800}
                destroyOnClose
            >
                {selectedOfferToUpdate && (
                    <EditOffer
                        offer={selectedOfferToUpdate}
                        onSuccess={handleUpdateSuccess}
                        onCancel={handleCancelUpdate}
                    />
                )}
            </Modal>
        </div>
    );
});

export default OfferTable;
