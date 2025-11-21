import { Table, Typography } from "antd";

const { Title, Text } = Typography;

// ----------------------------> Don't Use it <-----------------------------
/**
 * ChainDependecyTable - Displays chain dependencies in a table format
 * @param {Object} props
 * @param {Object} props.chainData - Chain data from API
 * @param {Object} props.campaign - Campaign details
 */
function ChainDependecyTable({ chainData, campaign }) {
    // If no data is provided, return empty
    if (!chainData || !chainData.chainNodes) {
        return null;
    }

    // Process chain data to create table rows in order based on chain structure
    const tableData = [];
    
    // Find the first offer (root of the chain)
    const firstOfferId = chainData.firstOffer;
    const firstOffer = chainData.chainNodes.find(node => node.id === firstOfferId);
    
    // Track processed nodes to avoid duplicates
    const processedNodes = new Set();
    const processedConnections = new Set();
    
    if (firstOffer) {
        // Build a graph representation for traversal
        const graph = {};
        const nodeMap = {};
        
        // Create node map for quick lookup
        chainData.chainNodes.forEach(node => {
            nodeMap[node.id] = node;
            graph[node.id] = [];
        });
        
        // Build adjacency list
        Object.entries(chainData.offers).forEach(([sourceId, connections]) => {
            connections.forEach(connection => {
                const targetId = connection.offerId;
                if (nodeMap[sourceId] && nodeMap[targetId]) {
                    graph[sourceId].push({
                        targetId,
                        daysToAdd: connection.daysToAdd
                    });
                }
            });
        });
        
        // Function to traverse the graph in order
        function traverseChain(nodeId, level = 0, parentId = null) {
            if (processedNodes.has(nodeId)) return;
            
            const node = nodeMap[nodeId];
            if (!node) return;
            
            processedNodes.add(nodeId);
            
            // Add row to tableData
            if (level === 0) {
                // First row with campaign details
                tableData.push({
                    key: "first",
                    campaignTitle: campaign?.title || "Campaign",
                    status: campaign?.status || "-",
                    startDate: campaign?.startDate ? new Date(campaign.startDate).toLocaleDateString() : "-",
                    dependencyOffer: "-", // No dependency for first offer
                    offer: node.title,
                    totalMails: campaign?.numberOfMail || "-" // Use campaign's numberOfMail for first row
                });
            } else {
                // Dependency row
                const parentNode = nodeMap[parentId];
                const connectionKey = `${parentId}-${nodeId}`;
                
                if (parentNode && !processedConnections.has(connectionKey)) {
                    tableData.push({
                        key: connectionKey,
                        campaignTitle: "", // Empty for subsequent rows
                        status: "", // Empty for subsequent rows
                        startDate: "", // Empty for subsequent rows
                        dependencyOffer: parentNode.title,
                        offer: node.title,
                        totalMails: "-" // Placeholder for now
                    });
                    
                    processedConnections.add(connectionKey);
                }
            }
            
            // Traverse children
            graph[nodeId].forEach(connection => {
                traverseChain(connection.targetId, level + 1, nodeId);
            });
        }
        
        // Start traversal from the first offer
        traverseChain(firstOfferId);
        
        // Process any remaining nodes that weren't reached in the traversal
        chainData.chainNodes.forEach(node => {
            if (!processedNodes.has(node.id)) {
                traverseChain(node.id, 0);
            }
        });

        // tableData.sort((a, b) => b.key.localeCompare(a.key));
        console.log("What ", tableData);
    }

    // Define table columns
    const columns = [
        // {
        //     title: "Campaign Title",
        //     dataIndex: "campaignTitle",
        //     key: "campaignTitle",
        //     render: (text, record, index) => {
        //         // Only show campaign title in the first row
        //         return index === 0 ? <Text strong>{text}</Text> : "";
        //     }
        // },
        // {
        //     title: "Status",
        //     dataIndex: "status",
        //     key: "status",
        //     render: (text, record, index) => {
        //         // Only show status in the first row
        //         return index === 0 ? text : "";
        //     }
        // },
        // {
        //     title: "Start Date",
        //     dataIndex: "startDate",
        //     key: "startDate",
        //     render: (text, record, index) => {
        //         // Only show start date in the first row
        //         return index === 0 ? text : "";
        //     }
        // },
        {
            title: "Dependency Offer",
            dataIndex: "dependencyOffer",
            key: "dependencyOffer",
        },
        {
            title: "Offer",
            dataIndex: "offer",
            key: "offer",
        },
        {
            title: "Total Mails",
            dataIndex: "totalMails",
            key: "totalMails",
        },
    ];

    console.log(tableData);

    return (
        <div className="chain-dependency-table">
            <Table 
                columns={columns} 
                dataSource={tableData}
                pagination={false}
                bordered
                size="middle"
            />
        </div>
    );
}

export default ChainDependecyTable;