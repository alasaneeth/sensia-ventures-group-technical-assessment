import { useState, useEffect, useRef, useCallback } from "react";
import { Select, Spin } from "antd";
import { fetchChains } from "../../api/offer";

// In the future fix this more
function DynamicDropdownMenu({
    onSelect,
    selectedValue,
    placeholder = "Select",
    disabled = false,
    fetchFunction,
    searchBy,
    extraArgs = null,
    setOptions,
}) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState(null);

    // prevents duplicate concurrent requests
    const isFetchingRef = useRef(false);
    // helps prevent stale append when request changes mid-flight
    const isMountedRef = useRef(true);

    const fetchData = useCallback(
        async (pageNum = 1, reset = false, currentFilters = null) => {
            if (isFetchingRef.current) return;

            isFetchingRef.current = true;
            setLoading(true);

            // For now crash (you must btw)
            if (!fetchFunction) throw new Error("You must pass fetch function");

            try {
                const result = await fetchFunction?.(
                    pageNum,
                    10,
                    currentFilters
                );

                // if component unmounted while request was in flight, ignore result
                // if (!isMountedRef.current) return;

                if (typeof result === "string") {
                    console.error("Error fetching chains:", result);
                    return;
                }

                const newChains = result?.data ?? [];
                const totalPages = result?.pagination?.pages ?? 1;

                setHasMore(pageNum < totalPages);
                setData((prev) =>
                    reset ? newChains : [...prev, ...newChains]
                );
            } catch (err) {
                console.error("Error fetching chains:", err);
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        },
        [extraArgs]
    );

    // Serialize extraArgs to detect actual changes (not reference changes)
    // const serializedExtraArgs = useMemo(() => JSON.stringify(extraArgs), [extraArgs]);

    // Load chains on mount and when extraArgs changes
    useEffect(() => {
        setData([]);
        setHasMore(true);
        setPage(1);
        setSearchQuery("");
        setFilters(null);

        // Call fetchData directly without depending on it
        const loadData = async () => {
            if (isFetchingRef.current) return;

            isFetchingRef.current = true;
            setLoading(true);

            if (!fetchFunction) throw new Error("You must pass fetch function");

            try {
                const result = await fetchFunction?.(
                    1,
                    10,
                    null
                );

                if (typeof result === "string") {
                    console.error("Error fetching data:", result);
                    return;
                }

                const newData = result?.data ?? [];
                const totalPages = result?.pagination?.pages ?? 1;

                setHasMore(1 < totalPages);
                setData(newData);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        };

        loadData();

        return () => {
            isMountedRef.current = false;
        };
    }, [extraArgs, fetchFunction]);

    const handlePopupScroll = (e) => {
        if (!hasMore || loading) return;
        const t = e.target;
        const nearBottom = t.scrollTop + t.clientHeight >= t.scrollHeight - 24;
        if (nearBottom) {
            const next = page + 1;
            setPage(next);
            fetchData(next, false, filters);
        }
    };

    // Handle search input change
    const handleSearch = (value) => {
        setSearchQuery(value);
        setPage(1);
        setHasMore(true);

        // Create filter object
        let newFilters;
        if (value) {
            newFilters = {
                [searchBy]: [{ iLike: `%${value}%` }],
            };
        } else {
            newFilters = null;
        }

        setFilters(newFilters);
        fetchData(1, true, newFilters);
    };

    const handleSelect = (value) => {
        const selected = data.find((c) => c.id === value);
        onSelect?.(selected ?? null);
    };

    const options = setOptions ? setOptions(data) : [];

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
            notFoundContent={loading ? <Spin size="small" /> : "No data found"}
            onPopupScroll={handlePopupScroll}
            onOpenChange={(open) => {
                // (optional) lazy refresh when re-opening
                if (open && data.length === 0 && !loading) {
                    setPage(1);
                    setHasMore(true);
                    fetchData(1, true, filters);
                }
            }}
            virtual
        />
    );
}

export default DynamicDropdownMenu;
