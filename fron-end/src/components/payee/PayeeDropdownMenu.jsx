import { useState, useEffect, useRef, useCallback } from "react";
import { Select, Spin } from "antd";
import { getPayeeNames } from "../../api/payeeNames";

function PayeeDropdownMenu({
    onSelect,
    selectedValue,
    placeholder = "Select Payee",
    disabled = false,
    refreshTrigger = 0, // Add this prop to trigger refresh
}) {
    const [payees, setPayees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState(null);

    // prevents duplicate concurrent requests
    const isFetchingRef = useRef(false);
    // helps prevent stale append when request changes mid-flight
    const isMountedRef = useRef(true);

    const fetchPayeeNamesData = useCallback(
        async (pageNum = 1, reset = false, currentFilters = null) => {
            if (loading || isFetchingRef.current) return;

            isFetchingRef.current = true;
            setLoading(true);

            try {
                const result = await getPayeeNames(pageNum, 10, currentFilters);

                // if component unmounted while request was in flight, ignore result
                // if (!isMountedRef.current) return;

                if (typeof result === "string") {
                    console.error("Error fetching chains:", result);
                    return;
                }

                const newChains = result?.data ?? [];
                const totalPages = result?.pagination?.pages ?? 1;

                setHasMore(pageNum < totalPages);
                setPayees((prev) =>
                    reset ? newChains : [...prev, ...newChains]
                );
            } catch (err) {
                console.error("Error fetching chains:", err);
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        },
        [loading]
    );

    // Load chains on mount
    useEffect(() => {
        setPayees([]);
        setHasMore(true);
        setPage(1);
        fetchPayeeNamesData(1, true, null);

        return () => {
            isMountedRef.current = false;
        };
    }, []); // fetchChainsData not included to avoid re-run loops

    // Refresh when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger > 0) {
            setPayees([]);
            setHasMore(true);
            setPage(1);
            setFilters(null);
            setSearchQuery("");
            fetchPayeeNamesData(1, true, null);
        }
    }, [refreshTrigger]);

    const handlePopupScroll = (e) => {
        if (!hasMore || loading) return;
        const t = e.target;
        const nearBottom = t.scrollTop + t.clientHeight >= t.scrollHeight - 24;
        if (nearBottom) {
            const next = page + 1;
            setPage(next);
            fetchPayeeNamesData(next, false, filters);
        }
    };

    // Handle search input change
    const handleSearch = (value) => {
        setSearchQuery(value);
        setPage(1);
        setHasMore(true);
        
        // Create filter object
        const newFilters = value ? {
            name: [{ iLike: `%${value}%` }]
        } : null;
        
        setFilters(newFilters);
        fetchPayeeNamesData(1, true, newFilters);
    };

    const handleSelect = (value) => {
        const selected = payees.find((c) => c.id === value);
        onSelect?.(selected ?? null);
    };

    const options = payees.map((c) => {
        return {
            value: c.id,
            label: c.title || c.name,
        };
    });

    const dropdownRender = (menu) => (
        <div>
            {menu}
            {loading && (
                <div style={{ textAlign: "center", padding: 8 }}>
                    <Spin size="small" />
                </div>
            )}
        </div>
    );

    return (
        <Select
            placeholder={placeholder}
            value={selectedValue}
            onSelect={handleSelect}
            style={{ width: "100%", minWidth: 200 }}
            disabled={disabled}
            showSearch
            // Backend search - trigger on search input
            onSearch={handleSearch}
            filterOption={false} // Disable client-side filtering
            options={options}
            popupRender={dropdownRender}
            notFoundContent={
                loading ? <Spin size="small" /> : "No payees found"
            }
            onPopupScroll={handlePopupScroll}
            onOpenChange={(open) => {
                // (optional) lazy refresh when re-opening
                if (open && payees.length === 0 && !loading) {
                    setPage(1);
                    setHasMore(true);
                    fetchPayeeNamesData(1, true, filters);
                }
            }}
            virtual
        />
    );
}

export default PayeeDropdownMenu;
