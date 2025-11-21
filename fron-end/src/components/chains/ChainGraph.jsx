import { useCallback, useMemo, useState, useEffect } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    applyNodeChanges,
    applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ChainNode from "./ChainNode";
import {
    convertChainDataToFlow,
    autoLayoutNodes,
} from "../../util/chainGraphUtils";

/**
 * ChainGraph component to visualize offer chains using React Flow
 * @param {Object} props
 * @param {Object} props.chainData - Chain data in graph format
 * @param {boolean} props.isLocked - Whether the graph is locked (non-interactive)
 * @param {Object} props.customNodeType - Custom node component to use instead of default ChainNode
 * @param {Function} props.onConnect - Callback for when nodes are connected
 * @param {Function} props.onEdgeDelete - Callback for when edges are deleted
 */
function ChainGraph({
    chainData,
    isLocked = false,
    customNodeType = null,
    onConnect = null,
    onEdgeDelete = null,
}) {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    // Use custom node type if provided, otherwise use default ChainNode
    const nodeTypes = useMemo(() => {
        return customNodeType
            ? { customNode: customNodeType }
            : { chainNode: ChainNode };
    }, [customNodeType]);

    // Convert chain data to nodes and edges when chainData changes
    useEffect(() => {
        if (chainData && chainData.chainNodes) {
            const { nodes: flowNodes, edges: flowEdges } =
                convertChainDataToFlow(
                    chainData,
                    customNodeType,
                    chainData.chainNodes,
                    nodes // Pass existing nodes to preserve positions
                );
            const layoutedNodes = autoLayoutNodes(flowNodes, flowEdges);

            setNodes(layoutedNodes);
            setEdges(flowEdges);
        } else {
            setNodes([]);
            setEdges([]);
        }
    }, [chainData, customNodeType]);
    // Handle node changes - filter out position changes to prevent automatic repositioning
    const handleNodesChange = useCallback(
        (changes) => {
            if (isLocked) return;

            // Filter out position changes that aren't user-initiated drags
            const filteredChanges = changes.filter((change) => {
                if (change.type === "position" && !change.dragging) {
                    return false; // Ignore automatic position changes
                }
                return true;
            });

            if (filteredChanges.length > 0) {
                setNodes((nds) => applyNodeChanges(filteredChanges, nds));
            }
        },
        [isLocked]
    );

    // Handle edge changes
    const handleEdgesChange = useCallback(
        (changes) => {
            if (isLocked) return;

            // Check for edge deletions and call onEdgeDelete if provided
            changes.forEach((change) => {
                if (change.type === "remove" && onEdgeDelete) {
                    const edge = edges.find((e) => e.id === change.id);
                    if (edge) {
                        onEdgeDelete({
                            sourceId: edge.source,
                            targetId: edge.target,
                        });
                    }
                }
            });

            setEdges((eds) => applyEdgeChanges(changes, eds));
        },
        [isLocked, onEdgeDelete, edges]
    );

    // Handle edge click to delete the edge
    const handleEdgeClick = useCallback(
        (event, edge) => {
            if (isLocked) return;

            if (onEdgeDelete) {
                onEdgeDelete({
                    sourceId: edge.source,
                    targetId: edge.target,
                });

                // Remove the edge from the state
                setEdges((eds) => eds.filter((e) => e.id !== edge.id));
            }
        },
        [isLocked, onEdgeDelete]
    );

    // Handle new connections
    const handleConnect = useCallback(
        (connection) => {
            if (isLocked) return;

            // Find the actual nodes in our nodes array
            const sourceNode = nodes.find(
                (node) => node.id === connection.source
            );
            const targetNode = nodes.find(
                (node) => node.id === connection.target
            );

            if (!sourceNode || !targetNode) return;
            // Allow connections and call onConnect callback
            if (onConnect) {
                onConnect({
                    sourceId: connection.source,
                    targetId: connection.target,
                    daysToAdd: 0, // Default value, can be updated later
                });
            }
        },
        [isLocked, onConnect, nodes]
    );

    // Memoize the flow props to prevent unnecessary re-renders
    const flowProps = useMemo(
        () => ({
            nodes,
            edges,
            nodeTypes,
            onNodesChange: handleNodesChange,
            onEdgesChange: handleEdgesChange,
            onConnect: handleConnect,
            onEdgeClick: handleEdgeClick,
            nodesDraggable: !isLocked,
            nodesConnectable: !isLocked,
            elementsSelectable: !isLocked,
            fitView: false, // Disable automatic fitting
            preventScrolling: true,
            nodeOrigin: [0.5, 0.5],
            defaultViewport: { x: 0, y: 0, zoom: 1 },
        }),
        [
            nodes,
            edges,
            handleNodesChange,
            handleEdgesChange,
            handleEdgeClick,
            isLocked,
        ]
    );

    return (
        <div
            style={{
                width: "100%",
                height: "500px",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
            }}
        >
            <ReactFlow {...flowProps}>
                <Background />
                <Controls showInteractive={!isLocked} />
            </ReactFlow>
        </div>
    );
}

export default ChainGraph;


/*

1. add the return address to the offer for each offer in the chain
2. add export history for the printer page
3. each offer which get a different return address must be in a row in printer page
*/