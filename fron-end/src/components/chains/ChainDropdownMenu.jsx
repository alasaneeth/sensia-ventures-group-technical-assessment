import { useState, useEffect, useRef, useCallback } from "react";
import { Select, Spin } from "antd";
import { fetchChains } from "../../api/offer";

// In the future enable the filter on client side
function ChainDropdownMenu({
    onSelect,
    selectedValue,
    placeholder = "Select Chain",
    disabled = false,
}) {
    const [chains, setChains] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState(null);

    // prevents duplicate concurrent requests
    const isFetchingRef = useRef(false);
    // helps prevent stale append when request changes mid-flight
    const isMountedRef = useRef(true);

    const fetchChainsData = useCallback(
        async (pageNum = 1, reset = false, currentFilters = null) => {
            if (isFetchingRef.current) return;

            isFetchingRef.current = true;
            setLoading(true);

            try {
                const result = await fetchChains(pageNum, 10, currentFilters);
                console.log(result);

                // if component unmounted while request was in flight, ignore result
                // if (!isMountedRef.current) return;

                if (typeof result === "string") {
                    console.error("Error fetching chains:", result);
                    return;
                }

                const newChains = result?.data ?? [];
                console.log("This is data: ", result.data);
                const totalPages = result?.pagination?.pages ?? 1;

                setHasMore(pageNum < totalPages);
                setChains((prev) =>
                    reset ? newChains : [...prev, ...newChains]
                );
            } catch (err) {
                console.error("Error fetching chains:", err);
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        },
        [] // No dependencies needed - using ref for loading check
    );

    // Load chains on mount
    useEffect(() => {
        setChains([]);
        setHasMore(true);
        setPage(1);
        fetchChainsData(1, true, null);

        return () => {
            isMountedRef.current = false;
        };
    }, []); // fetchChainsData not included to avoid re-run loops

    const handlePopupScroll = (e) => {
        if (!hasMore || loading) return;
        const t = e.target;
        const nearBottom = t.scrollTop + t.clientHeight >= t.scrollHeight - 24;
        if (nearBottom) {
            const next = page + 1;
            setPage(next);
            fetchChainsData(next, false, filters);
        }
    };

    // Handle search input change
    const handleSearch = (value) => {
        setSearchQuery(value);
        setPage(1);
        setHasMore(true);

        // Create filter object
        const newFilters = value
            ? {
                  title: [{ iLike: `%${value}%` }],
              }
            : null;

        setFilters(newFilters);
        fetchChainsData(1, true, newFilters);
    };

    const handleSelect = (value) => {
        const selected = chains.find((c) => c.id === value);
        onSelect?.(selected ?? null);
    };

    const options = chains.map((c) => {
        console.log(c);
        return {
            value: c.id,
            label: c.title || `Chain ${c.id}`,
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
                loading ? <Spin size="small" /> : "No chains found"
            }
            onPopupScroll={handlePopupScroll}
            onOpenChange={(open) => {
                // (optional) lazy refresh when re-opening
                if (open && chains.length === 0 && !loading) {
                    setPage(1);
                    setHasMore(true);
                    fetchChainsData(1, true, filters);
                }
            }}
            virtual
        />
    );
}

export default ChainDropdownMenu;
