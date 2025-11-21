import React, { useMemo, useState } from "react";
import OfferCard from "../offers/OfferCard";
import ChainNode from "./ChainNode";
import DependencyForm from "./DependencyForm";

// --- > Don't use it <---
const ChainOffersTree = ({
    chainData,
    isReadOnly = false,
    onConnect,
    onEdgeDelete,
    customNodeComponent = null,
}) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    // Calculate tree layout and positions
    const treeLayout = useMemo(() => {
        if (!chainData || !chainData.offers) {
            return { nodes: [], connections: [] };
        }

        const offers = chainData.offers;
        const nodes = [];
        const connections = [];

        // Find the first offer
        let firstOfferId = null;

        // Check for firstOffer property in chainData
        if (chainData.firstOffer) {
            firstOfferId = chainData.firstOffer.toString();
        } else {
            // Find offer marked as isFirst
            for (const [offerId, offerData] of Object.entries(offers)) {
                if (offerData.isFirst) {
                    firstOfferId = offerId;
                    break;
                }
            }
        }

        // If no first offer found, use the first one in the list
        if (!firstOfferId && Object.keys(offers).length > 0) {
            firstOfferId = Object.keys(offers)[0];
            // Mark it as first in the data structure
            if (offers[firstOfferId]) {
                offers[firstOfferId].isFirst = true;
            }
        }

        if (!firstOfferId) return { nodes: [], connections: [] };

        // Calculate levels using BFS
        const levels = new Map();
        const visited = new Set();
        const queue = [{ offerId: firstOfferId, level: 0 }];

        levels.set(firstOfferId, 0);

        while (queue.length > 0) {
            const { offerId, level } = queue.shift();

            if (visited.has(offerId)) continue;
            visited.add(offerId);

            const offerData = offers[offerId];
            if (offerData && offerData.connections) {
                offerData.connections.forEach((connection) => {
                    const targetId = connection.offerId;
                    if (!levels.has(targetId)) {
                        levels.set(targetId, level + 1);
                        queue.push({ offerId: targetId, level: level + 1 });
                    }
                });
            }
        }

        // Group nodes by level
        const nodesByLevel = new Map();
        for (const [offerId, level] of levels.entries()) {
            if (!nodesByLevel.has(level)) {
                nodesByLevel.set(level, []);
            }
            nodesByLevel.get(level).push(offerId);
        }

        // Calculate positions
        const nodeWidth = 280;
        const nodeHeight = 120;
        const levelHeight = 180;
        const horizontalSpacing = 320;

        const maxLevel = Math.max(...levels.values());
        const totalWidth =
            Math.max(
                ...Array.from(nodesByLevel.values()).map(
                    (levelNodes) => levelNodes.length
                )
            ) * horizontalSpacing;

        // Position nodes
        for (const [level, levelNodes] of nodesByLevel.entries()) {
            const levelWidth = levelNodes.length * horizontalSpacing;
            const startX = (totalWidth - levelWidth) / 2;

            levelNodes.forEach((offerId, index) => {
                const offerData = offers[offerId];
                const x = startX + index * horizontalSpacing;
                const y = level * levelHeight;

                nodes.push({
                    id: offerId,
                    x,
                    y,
                    data: {
                        id: offerId,
                        offerId,
                        title: offerData.title || `Offer ${offerId}`,
                        description: offerData.description || null,
                        isFirst: offerId === firstOfferId,
                        isActive: false, // Can be updated based on activeOffer if needed
                    },
                });

                // Add connections
                if (offerData.connections) {
                    offerData.connections.forEach((connection) => {
                        const targetLevel = levels.get(connection.offerId);
                        const targetNodes = nodesByLevel.get(targetLevel) || [];
                        const targetIndex = targetNodes.indexOf(
                            connection.offerId
                        );

                        if (targetIndex !== -1) {
                            const targetX =
                                startX + targetIndex * horizontalSpacing;
                            const targetY = targetLevel * levelHeight;

                            connections.push({
                                id: `${offerId}-${connection.offerId}`,
                                sourceId: offerId,
                                targetId: connection.offerId,
                                sourceX: x + nodeWidth / 2,
                                sourceY: y + nodeHeight,
                                targetX: targetX + nodeWidth / 2,
                                targetY: targetY,
                                daysToAdd: connection.daysToAdd,
                            });
                        }
                    });
                }
            });
        }

        return { nodes, connections };
    }, [chainData]);

    // Handle node click to open dependency modal
    function handleNodeClick(nodeData) {
        if (isReadOnly) return;

        setSelectedNode(nodeData);
        setModalVisible(true);
    }

    // Handle modal close
    const handleModalClose = () => {
        setModalVisible(false);
        setSelectedNode(null);
    };

    const NodeComponent =
        customNodeComponent || (isReadOnly ? ChainNode : OfferCard);

    // Calculate container dimensions
    const containerWidth = Math.max(
        800,
        ...treeLayout.nodes.map((node) => node.x + 280)
    );
    const containerHeight =
        Math.max(400, ...treeLayout.nodes.map((node) => node.y + 120)) + 50;

    return (
        <div
            className="position-relative border rounded p-3 bg-light"
            style={{
                width: "100%",
                height: `${containerHeight}px`,
                minHeight: "400px",
                overflow: "auto",
            }}
        >
            {/* Render connections (arrows) */}
            <svg
                className="position-absolute"
                style={{
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            >
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#1890ff" />
                    </marker>
                </defs>

                {treeLayout.connections.map((connection) => (
                    <g key={connection.id}>
                        <line
                            x1={connection.sourceX}
                            y1={connection.sourceY}
                            x2={connection.targetX}
                            y2={connection.targetY}
                            stroke="#1890ff"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                        />
                        {/* Days label */}
                        {connection.daysToAdd > 0 && (
                            <text
                                x={
                                    (connection.sourceX + connection.targetX) /
                                    2
                                }
                                y={
                                    (connection.sourceY + connection.targetY) /
                                        2 -
                                    5
                                }
                                textAnchor="middle"
                                fontSize="12"
                                fill="#666"
                                className="bg-white px-1 rounded"
                            >
                                +{connection.daysToAdd}d
                            </text>
                        )}
                    </g>
                ))}
            </svg>

            {/* Render nodes */}
            {treeLayout.nodes.map((node) => (
                <div
                    key={node.id}
                    className="position-absolute"
                    style={{
                        left: `${node.x}px`,
                        top: `${node.y}px`,
                        zIndex: 2,
                    }}
                >
                    <div
                        onClick={() => handleNodeClick(node.data)}
                        style={{ cursor: isReadOnly ? "default" : "pointer" }}
                    >
                        <NodeComponent
                            data={node.data}
                            isConnectable={!isReadOnly}
                            onConnect={onConnect}
                            onRemove={
                                !isReadOnly
                                    ? (offerId) => {
                                          // Handle node removal if needed
                                      }
                                    : undefined
                            }
                        />
                    </div>
                </div>
            ))}

            {/* Empty state */}
            {treeLayout.nodes.length === 0 && (
                <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center text-muted">
                        <h5>No offers in chain</h5>
                        <p>Add offers to build your chain</p>
                    </div>
                </div>
            )}

            {/* Dependency Form */}
            <DependencyForm
                visible={modalVisible}
                onClose={handleModalClose}
                selectedNode={selectedNode}
                chainData={chainData}
                onConnect={onConnect}
                onEdgeDelete={onEdgeDelete}
            />
        </div>
    );
};

export default ChainOffersTree;
