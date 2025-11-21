/**
 * Take the chain details from the backend and prepare the data for table view
 * @param {Object} chainData
 * @param {Object} campaign
 */
export function prepareChainsForTableView(chainData) {
    // If no data is provided, return empty
    if (!chainData || !chainData.offers) {
        return null;
    }

    // Process chain data to create table rows
    const tableData = [];
    const processedConnections = new Set(); // To avoid duplicates

    // Create a map for quick node lookup
    const nodeMap = {};
    if (chainData.chainNodes) {
        chainData.chainNodes.forEach((node) => {
            nodeMap[node.id] = node;
        });
    }

    console.log("Chain nodes: ", chainData.chainNodes);
    // Helper function to get offer title
    const getOfferTitle = (offerId) => {
        const node = nodeMap[offerId];
        return node ? node.title || `Offer ${offerId}` : `Offer ${offerId}`;
    };

    // Start with the first offer (root)
    const firstOfferId = chainData.firstOffer;
    if (firstOfferId) {
        // Add the first offer row (no dependency)
        tableData.push({
            key: `first-${firstOfferId}`,
            dependencyOffer: "-",
            offer: getOfferTitle(firstOfferId),
            returnAddress: chainData.chainNodes.find(
                (node) => node.id === firstOfferId
            )?.returnAddress,
            mailQuantity: chainData.chainNodes.find(
                (node) => node.id === firstOfferId
            )?.mailQuantity,
        });
    }

    // Process all connections to build the chain flow
    Object.entries(chainData.offers || {}).forEach(
        ([sourceId, connections]) => {
            if (!connections || connections.length === 0) return;

            connections.forEach((connection) => {
                // Handle both string and object formats
                const targetId =
                typeof connection === "string"
                ? connection
                : connection.offerId;
                
                if (!targetId) return;

                // Create a unique key for this connection to avoid duplicates
                const connectionKey = `${sourceId}-${targetId}`;

                if (!processedConnections.has(connectionKey)) {
                    processedConnections.add(connectionKey);

                    // Add row for this connection
                    tableData.push({
                        key: connectionKey,
                        dependencyOffer: getOfferTitle(sourceId),
                        offer: getOfferTitle(targetId),
                        daysToAdd: connection.daysToAdd,
                        returnAddress: chainData.chainNodes.find(
                            (node) => node.id === targetId
                        )?.returnAddress,
                        mailQuantity: chainData.chainNodes.find(
                            (node) => node.id === targetId
                        )?.mailQuantity,
                    });
                }
            });
        }
    );
    return tableData;
}
