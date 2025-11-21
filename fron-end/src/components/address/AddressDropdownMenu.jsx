import { useState, useEffect, useRef, useCallback } from "react";
import { Select, Spin } from "antd";
import { getAddresses } from "../../api/addresses";

function AddressDropdownMenu({
    onSelect,
    selectedValue,
    placeholder = "Select Address",
    disabled = false,
    inPopup = false,
}) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState(null);

    // guards to prevent duplicate requests during fast scrolls/renders
    const isFetchingRef = useRef(false);

    const fetchAddresses = useCallback(
        async (pageNum = 1, reset = false, currentFilters = null) => {
            if (loading || isFetchingRef.current) return;

            isFetchingRef.current = true;
            setLoading(true);

            try {
                const result = await getAddresses(pageNum, 10, currentFilters);

                if (typeof result === "string") {
                    console.error("Error fetching addresses:", result);
                    return;
                }

                const newAddresses = result?.data ?? [];
                const totalPages = result?.pagination?.totalPages ?? 1;

                setHasMore(pageNum < totalPages);

                setAddresses((prev) =>
                    reset ? newAddresses : [...prev, ...newAddresses]
                );
            } catch (err) {
                console.error("Error fetching addresses:", err);
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        },
        [loading]
    );

    // Initial load
    useEffect(() => {
        setAddresses([]);
        setHasMore(true);
        setPage(1);
        fetchAddresses(1, true, null);

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // When user scrolls the dropdown list, load more when near the bottom
    const handlePopupScroll = (e) => {
        if (!hasMore || loading) return;
        const target = e.target;
        const nearBottom =
            target.scrollTop + target.clientHeight >= target.scrollHeight - 24; // small threshold

        if (nearBottom) {
            const next = page + 1;
            setPage(next);
            fetchAddresses(next, false, filters);
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
                  address: [{ iLike: `%${value}%` }],
              }
            : null;

        setFilters(newFilters);
        fetchAddresses(1, true, newFilters);
    };

    const handleSelect = (value) => {
        const selectedAddress = addresses.find((c) => c.id === value);
        onSelect?.(selectedAddress);
    };

    // AntD v5: better to pass `options` over children
    const options = addresses.map((address) => ({
        value: address.id,
        label: address.country
            ? `${address.address} - ${address.country}`
            : address.address,
        address, // Store the full address object for reference
    }));

    // Planing to remove it from here. as long as it's small and doesn't have any state that's fine
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

    // Handle native select change
    const handleNativeSelectChange = (e) => {
        const value = e.target.value;
        if (value) {
            const selectedAddress = addresses.find(
                (a) => a.id.toString() === value
            );
            onSelect?.(selectedAddress);
        }
    };

    // Render either HTML select or Ant Design Select based on inPopup prop
    if (inPopup) {
        return (
            <select
                disabled={disabled}
                value={selectedValue || ""}
                onChange={handleNativeSelectChange}
                style={{
                    width: "100%",
                    minWidth: "200px",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #d9d9d9",
                    fontSize: "14px",
                }}
                onClick={(e) => {
                    // Stop propagation to prevent ReactFlow from capturing the click
                    e.stopPropagation();
                }}
            >
                <option value="" disabled>
                    {placeholder}
                </option>
                {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                        {address.country
                            ? `${address.address} - ${address.country}`
                            : address.address}
                    </option>
                ))}
                {loading && <option disabled>Loading more addresses...</option>}
                {addresses.length === 0 && !loading && (
                    <option disabled>No addresses found</option>
                )}
            </select>
        );
    }

    return (
        <Select
            disabled={disabled}
            placeholder={placeholder}
            value={selectedValue}
            onSelect={(value) => handleSelect(value)}
            style={{ width: "100%", minWidth: 200 }}
            showSearch
            // Backend search - trigger on search input
            onSearch={handleSearch}
            filterOption={false} // Disable client-side filtering
            options={options}
            popupRender={dropdownRender}
            notFoundContent={
                loading ? <Spin size="small" /> : "No addresses found"
            }
            onPopupScroll={handlePopupScroll}
            // optional: only load when opened and reset when closed/opened
            onOpenChange={(open) => {
                if (open && addresses.length === 0) {
                    setPage(1);
                    fetchAddresses(1, true, filters);
                }
            }}
            virtual
        />
    );
}

export default AddressDropdownMenu;
