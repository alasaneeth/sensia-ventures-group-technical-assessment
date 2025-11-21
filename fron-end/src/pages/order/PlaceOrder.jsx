import { useEffect, useState } from "react";
import { Typography, message, Spin, Alert, Button } from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
    
    getClientById,
    getClients,
} from "../../api/client";

import { searchForClientOffer, searchByClientChainOffer } from "../../api/offer";
// Comment out chain-related import
// import { fetchChainById, getOffer } from "../api/offer";
import {
    // getLastCamChain
    // ,
    getOffer,
} from "../../api/offer";
import { getLastCamChain } from "../../api/campaign";

// Import the new component sections
import SearchSection from "../../components/order/sections/SearchSection";
import ClientSelectionSection from "../../components/order/sections/ClientSelectionSection";
// Comment out chain-related component
// import ChainSelectionSection from "../components/order/sections/ChainSelectionSection";
import OfferSelectionSection from "../../components/order/sections/OfferSelectionSection";
import FinalSection from "../../components/order/sections/FinalSection";
import PageHeader from "../../components/ui/PageHeader";
import { useLocale } from "antd/es/locale";
import { useLocation, useSearchParams } from "react-router-dom";

const { Title } = Typography;

// This component has been refactored into smaller, more manageable components
// Each section of the order flow is now handled by its own component

function PlaceOrder() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [offerCode, setOfferCode] = useState("");
    const [clientOffer, setClientOffer] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingChains, setLoadingChains] = useState(false);
    const [loadingOffers, setLoadingOffers] = useState(false);
    const [loadingSkus, setLoadingSkus] = useState(false);
    const [searchKey, setSearchKey] = useState("33ddd33ffks3foegf23etgedf");
    const [isUpdated, setIsUpdated] = useState(false);
    const [clients, setClients] = useState([]);
    const [searchType, setSearchType] = useState("client"); // This will be 'code', 'client' or 'offer'
    const [selectedSkus, setSelectedSkus] = useState([]);
    const [selectedSkuRows, setSelectedSkuRows] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        total: 0,
    });

    // New state variables for the multi-step order process
    const [currentWindow, setCurrentWindow] = useState("search"); // search, clients, chains, offers, skus
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedChain, setSelectedChain] = useState(null);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [offerDetails, setOfferDetails] = useState(null);
    const [chainData, setChainData] = useState(null);
    const [searchValue, setSearchValue] = useState("");
    const [clientFilters, setClientFilters] = useState(null);

    async function handleSearch(searchBy) {
        if (searchType === "code") {
            handleSearchByCode(searchBy);
        } else {
            // For client name or zip code searches, prepare filters
            prepareClientFilters();
        }
    }

    function prepareClientFilters() {
        if (!searchValue.trim()) {
            message.warning(
                `Please enter a ${
                    searchType === "zip"
                        ? "zip code"
                        : searchType === "address1,address2,address3"
                        ? "address"
                        : "client name"
                }`
            );
            return;
        }

        // Reset selected SKUs when searching
        setSelectedSkus([]);
        setSelectedSkuRows([]);

        // Prepare filters based on search type
        let filters = {};

        if (searchType === "zip") {
            // For zip code search
            filters = {
                zipCode: [{ iLike: `%${searchValue.trim()}%` }],
            };
        } else if (searchType === "client") {
            // For client name search
            filters = {
                fullName: [{ eq: searchValue.trim() }],
            };
        } else if (searchType === "address1,address2,address3") {
            filters = {
                address1: [{ iLike: `%${searchValue.trim()}%` }],
                address2: [{ iLike: `%${searchValue.trim()}%` }],
                address3: [{ iLike: `%${searchValue.trim()}%` }],
                or: ["address1", "address2", "address3"],
            };
        }

        // Set the filters to be used by ClientTableV1
        setClientFilters(filters);
    }

    async function handleSearchByCode(code) {
        if (!code.trim()) {
            message.warning("Please enter an offer code");
            return;
        }

        setLoading(true);
        // Reset selected SKUs when searching by code
        setSelectedSkus([]);
        setSelectedSkuRows([]);

        try {
            // Call the API to search for client offer by code
            const response = await searchForClientOffer(code.trim());

            console.log("Here look at this: ", response);
            if (response.data) {
                setClientOffer(response.data);
                console.log("it must set the client offer");
                setOfferDetails(response.data?.currentSequence?.currentOffer);
                setOfferCode(code);
                // console.log("Client offer data:", response.data);
                // console.log(
                //     "SKUs from code search:",
                //     response.data?.currentSequence?.currentOffer?.skus
                // );
                message.success("Offer found successfully");
            } else {
                message.error("Offer code not found");
                setClientOffer(null);
            }
        } catch (error) {
            message.error("Failed to search for offer");
            setClientOffer(null);
        } finally {
            setLoading(false);
        }
    }

    function handleUpdate() {
        console.log("Got Called babe");
        setIsUpdated(true);
    }

    function handleReset() {
        // Reset everything
        console.log("REALLY ?");
        setSearchValue("");
        setCurrentWindow("search");
        setSelectedClient(null);
        // setSelectedChain(null); // Commented out
        setSelectedOffer(null);
        setOfferDetails(null);
        // setChainData(null); // Commented out
        setClientOffer("");
        setOfferCode("");
        setSelectedSkus([]);
        setSelectedSkuRows([]);
        setSearchKey(Date.now().toString());
        setClients([]);
        setClientFilters(null);
        // Remove client search param
        setSearchParams({});
        // message.success("Order placed successfully!");
    }

    useEffect(() => {
        // Reset all the data
        setClientOffer("");
        setOfferCode(null);
        setSearchValue("");
        setSearchKey(Date.now().toString().concat(Math.random()));
        setPagination({
            current: 1,
            pageSize: 10,
            total: 0,
        });
    }, [searchType]);

    useEffect(() => {
        const clientId = searchParams.get("client");
        if (clientId) {
            const fetchAndSelectClient = async () => {
                try {
                    setLoading(true);
                    const client = await getClientById(clientId);
                    if (client && typeof client !== "string") {
                        setSelectedClient(client);
                        setCurrentWindow("offers");
                        message.success(
                            `Selected client: ${client.firstName || ""} ${
                                client.lastName || ""
                            }`
                        );
                    } else {
                        message.error("Failed to load client");
                    }
                } catch (error) {
                    console.error("Error fetching client:", error);
                    message.error("Failed to load client");
                } finally {
                    setLoading(false);
                }
            };
            fetchAndSelectClient();
        }
    }, [searchParams]);

    // Handle client selection
    function handleClientSelect(client) {
        setSelectedClient(client);
        // Changed from "chains" to "offers" to skip the chain selection
        setCurrentWindow("offers");
        message.success(
            `Selected client: ${client.firstName || ""} ${
                client.lastName || ""
            }`
        );
    }

    // Handle chain selection - Commented out
    /*
    async function handleChainSelect(chain) {
{{ ... }}
        console.log("this is the chain: ", chain);
        setSelectedChain(chain);
        setLoadingChains(true);

        try {
            // Fetch chain details
            const chainDetails = await fetchChainById(chain.id);
            if (chainDetails) {
                setChainData(chainDetails);
                setCurrentWindow("offers");
                message.success(`Selected chain: ${chain.title}`);
            } else {
                message.error("No offers found in this chain");
            }
        } catch (error) {
            message.error("Failed to fetch chain details");
            console.error("Error fetching chain details:", error);
        } finally {
            setLoadingChains(false);
        }
    }
    */

    // Handle offer selection
    async function handleOfferSelect(offer) {
        console.log("Do you tihnk I'm running ?");

        setLoadingOffers(true);
        console.log("offer: ", offer);

        try {
            const data = await getLastCamChain(offer.id, selectedClient?.id);

            console.log(data);

            if (typeof data === "string") return message.warning(data);

            offer.campaign = data?.campaign;
            offer.chain = data?.chain;

            console.log("data from the campaign and chain: ", data);
            setSelectedOffer(offer);
        } catch (err) {
            console.log(err);
            message.error("something went wrong");
        } finally {
            setLoadingOffers(false);
        }

        // Get a the last chain for that offer. Along with the campaign

        // try {
        //     // Fetch offer details
        //     const offerData = await getOffer(offer.id);
        //     if (offerData && offerData.skus && offerData.skus.length > 0) {
        // setOfferDetails(offerData);
        setOfferDetails(offer);
        //         setCurrentWindow("skus");
        //         message.success(`Selected offer: ${offer.offer}`);
        //     } else {
        //         message.warning("No SKUs found for this offer");
        // setOfferDetails(offerData || { skus: [] });
        // setOfferDetails({ skus: [] });
        setCurrentWindow("skus");
        //     }
        // } catch (error) {
        //     message.error("Failed to fetch offer details");
        //     console.error("Error fetching offer details:", error);
        // } finally {
        //     setLoadingOffers(false);
        // }
    }

    // Function to go back to previous step
    function handleGoBack() {
        if (currentWindow === "clients") {
            setCurrentWindow("search");
            // Commented out chain-related step
            // } else if (currentWindow === "chains") {
            //     setCurrentWindow("search");
            //     setSelectedClient(null);
        } else if (currentWindow === "offers") {
            // Go back to search instead of chains
            setCurrentWindow("search");
            setSelectedClient(null);
            // setCurrentWindow("chains");
            // setSelectedChain(null);
            // setChainData(null);
        } else if (currentWindow === "skus") {
            setCurrentWindow("offers");
            setSelectedOffer(null);
            setOfferDetails(null);
        }
    }

    // Handle selected SKUs change
    function handleSelectedSkusChange(selectedSkuIds, selectedRows) {
        setSelectedSkus(selectedSkuIds);
        setSelectedSkuRows(selectedRows);
        console.log("Selected SKU IDs:", selectedSkuIds);
        console.log("Selected SKU Rows:", selectedRows);
    }

    // Effect to handle clientOffer changes when searching by code
    useEffect(() => {
        if (
            clientOffer &&
            searchType === "code" &&
            currentWindow === "search"
        ) {
            console.log("Client offer changed in code search mode");
            // Reset selected SKUs when client offer changes
            setSelectedSkus([]);
            setSelectedSkuRows([]);
        }
    }, [clientOffer, searchType, currentWindow]);

    // Fetch client offer data when selectedClient changes
    useEffect(() => {
        async function fetchClientOfferData() {
            // Only fetch if we have a selected client with an ID and selected offer, and we're in the skus window
            if (
                selectedClient &&
                selectedClient.id &&
                selectedOffer &&
                selectedOffer.id &&
                currentWindow === "skus"
            ) {
                try {
                    setLoadingSkus(true);

                    // Just use the selected client and offer directly
                    // We're skipping the chain part
                    // For backward compatibility, we still use searchByClientChainOffer but pass null for chain ID
                    const clientOfferData = await searchByClientChainOffer(
                        selectedClient.id,
                        selectedOffer.id
                    );

                    if (
                        clientOfferData &&
                        typeof clientOfferData !== "string"
                    ) {
                        // If we got data back, update the clientOffer state
                        setClientOffer(clientOfferData);
                        console.log(
                            "Client offer data found:",
                            clientOfferData
                        );
                    } else {
                        // If no data or error message returned, we'll use the selected client data directly
                        console.log(
                            "No client offer data found, using selected client data"
                        );
                        // We don't need to show a warning as this is an expected case when manually selecting a client
                        // The form will still work with the selectedClient data
                    }
                } catch (error) {
                    console.error("Error fetching client offer data:", error);
                    message.error("Failed to fetch client offer data");
                } finally {
                    setLoadingSkus(false);
                }
            }
        }

        fetchClientOfferData();
    }, [selectedClient?.id, selectedOffer?.id, currentWindow, isUpdated]);

    return (
        <div style={{ padding: "24px", width: "100%", margin: "0 auto" }}>
            <PageHeader
                title="Placing Order"
                rightContent={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/database/add?data-entry=t")}
                    >
                        Add New Client
                    </Button>
                }
            />
            {/* <Title
                level={2}
                style={{ textAlign: "center", marginBottom: "32px" }}
            >
                Placing an Order
            </Title> */}

            {/* Search Section */}
            {currentWindow === "search" && (
                <SearchSection
                    key={
                        searchKey
                    } /* This is the critical change - using searchKey as React key prop */
                    setSearchValue={setSearchValue}
                    searchType={searchType}
                    searchValue={searchValue}
                    onSearchTypeChange={(value) => {
                        setSearchType(value);
                        // Reset search value when changing search type
                        setSearchValue("");
                        setClientFilters(null);
                        // Clear previous search results
                        setClients([]);
                        setClientOffer(null);
                        // Reset pagination
                        setPagination({
                            current: 1,
                            pageSize: 100,
                            total: 0,
                        });
                        // Reset search key to force re-render of search input
                        setSearchKey(Date.now().toString());
                    }}
                    // searchKey={searchKey}
                    clientFilters={clientFilters}
                    onClientSelect={handleClientSelect}
                    onSearch={handleSearch}
                />
            )}

            {/* Back Button for navigation */}
            {currentWindow !== "search" && (
                <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleGoBack}
                    style={{ marginBottom: "16px" }}
                >
                    Back
                </Button>
            )}

            {/* Loading Spinner */}
            {loading && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                    <Spin size="large" />
                </div>
            )}

            {/* No Results Message */}
            {clientOffer === null &&
                !loading &&
                currentWindow === "search" &&
                searchType === "code" && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "60px 40px",
                        }}
                    >
                        <Alert
                            message="No offer found"
                            type="error"
                            style={{ fontSize: "1.2rem" }}
                        />
                    </div>
                )}

            {/* Direct Code Search Results */}
            {clientOffer &&
                !loading &&
                currentWindow === "search" &&
                searchType === "code" && (
                    <FinalSection
                        clientOffer={clientOffer}
                        offerDetails={offerDetails}
                        selectedSkus={selectedSkus}
                        selectedSkuRows={selectedSkuRows}
                        onSelectedSkusChange={handleSelectedSkusChange}
                        loading={loading}
                        isUpdated={isUpdated}
                        offerCode={offerCode}
                        onUpdate={handleUpdate}
                        onOrderPlaced={handleReset}
                    />
                )}

            {/* Client Selection Section */}
            {/* {currentWindow === "clients" && (
                <ClientSelectionSection
                    clients={clients}
                    loading={loading}
                    onClientSelect={handleClientSelect}
                    pagination={pagination}
                    onPaginationChange={handleClientPaginationChange}
                />
            )} */}

            {/* Chain Selection Section - Commented out */}
            {/*
            {currentWindow === "chains" && (
                <ChainSelectionSection
                    selectedClient={selectedClient}
                    onChainSelect={handleChainSelect}
                    loading={loadingChains}
                />
            )}
            */}

            {/* Offer Selection Section */}
            {currentWindow === "offers" && (
                <OfferSelectionSection
                    selectedClient={selectedClient}
                    onOfferSelect={handleOfferSelect}
                    loading={loadingOffers}
                />
            )}

            {/* SKUs Selection Section */}
            {currentWindow === "skus" && (
                <FinalSection
                    clientOffer={clientOffer}
                    selectedClient={selectedClient}
                    // selectedChain={selectedChain} // Commented out
                    selectedOffer={selectedOffer}
                    offerDetails={offerDetails}
                    selectedSkus={selectedSkus}
                    selectedSkuRows={selectedSkuRows}
                    onSelectedSkusChange={handleSelectedSkusChange}
                    loading={loadingSkus}
                    isUpdated={isUpdated}
                    offerCode={
                        // this is not used
                        clientOffer ? clientOffer.code : selectedOffer?.title
                    }
                    onUpdate={handleUpdate}
                    onOrderPlaced={handleReset}
                />
            )}
        </div>
    );
}

export default PlaceOrder;
