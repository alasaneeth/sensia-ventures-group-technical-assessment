/**
 * Convert chain graph data to React Flow nodes and edges
 * - Respects pre-set positions on chainNodes[i].position
 * - Falls back to existingNodes positions
 * - Otherwise uses the original grid placement
 * @param {Object} chainData - Chain data in graph format
 * @param {Object} customNodeType - Custom node type to use
 * @param {Array} chainNodes - Array of offer objects with full data (may include .position)
 * @param {Array} existingNodes - Existing nodes with current positions
 * @returns {Object} - Object containing nodes and edges arrays
 */
export function convertChainDataToFlow(
    chainData,
    customNodeType = null,
    chainNodes = [],
    existingNodes = []
) {
    if (!chainData || !chainData.offers) {
        return { nodes: [], edges: [] };
    }

    const nodes = [];
    const edges = [];
    const { offers } = chainData;

    // Fast lookups
    const chainNodeById = new Map(
        (chainNodes || []).map((n) => [String(n.id), n])
    );
    const existingById = new Map(
        (existingNodes || []).map((n) => [String(n.id), n])
    );

    // Grid fallback parameters
    let newNodeIndex = 0;
    const startX = 100;
    const startY = 100;
    const nodeSpacingX = 450; // keep your originals
    const nodeSpacingY = 350;
    const perRow = 3;

    // Create nodes based on the offer ids (keeps your original iteration)
    Object.keys(offers).forEach((offerIdKey) => {
        const offerId = String(offerIdKey);

        // 1) Prefer explicit position coming from chainNodes[].position
        let position =
            chainNodeById.get(offerId)?.position ??
            existingById.get(offerId)?.position ??
            null;

        // 2) If no position anywhere, place on grid (original behavior)
        if (!position || position.x === undefined || position.y === undefined) {
            const existingCount = existingNodes.length; // keep your offset logic
            const totalIndex = existingCount + newNodeIndex;
            const x = startX + (totalIndex % perRow) * nodeSpacingX;
            const y = startY + Math.floor(totalIndex / perRow) * nodeSpacingY;
            position = { x, y };
            newNodeIndex++;
        }

        const nodeType = customNodeType ? "customNode" : "chainNode";
        const offerData = chainNodeById.get(offerId);

        nodes.push({
            id: offerId,
            type: nodeType,
            position,
            data: {
                id: offerId,
                offerId,
                title: offerData?.title || `Offer ${offerId}`,
                description:
                    offerData?.description || `Offer details for ${offerId}`,
                daysToAdd: 0, // will be updated after edges pass
                // Include returnAddress if it exists in the node data
                returnAddress: offerData?.returnAddress || null,
                // Mark first/active using provided fields
                isFirst:
                    (chainData.firstOffer &&
                        String(chainData.firstOffer) === offerId) ||
                    (offerData && offerData.isFirst === true),
                isActive:
                    chainData.activeOffer &&
                    String(chainData.activeOffer) === offerId,
            },
        });
    });

    // Build edges and update target node data with source & daysToAdd
    Object.entries(offers).forEach(([sourceOfferId, connections]) => {
        (connections || []).forEach((connection, idx) => {
            const targetOfferId = String(connection.offerId);
            const daysToAdd = connection.daysToAdd;

            const targetNode = nodes.find((n) => n.id === targetOfferId);
            if (targetNode) {
                targetNode.data.sourceId = String(sourceOfferId);
                targetNode.data.daysToAdd = daysToAdd;
            }

            edges.push({
                id: `e${sourceOfferId}-${targetOfferId}-${idx}`,
                source: String(sourceOfferId),
                target: targetOfferId,
                type: "default",
                animated: true,
                style: { stroke: "#1890ff", strokeWidth: 2 },
                markerEnd: {
                    type: "arrowclosed",
                    color: "#1890ff",
                },
                label: `+${daysToAdd} days`,
                labelStyle: {
                    fill: "#1890ff",
                    fontWeight: 600,
                    fontSize: "12px",
                },
                labelBgStyle: {
                    fill: "#fff",
                    fillOpacity: 0.8,
                },
            });
        });
    });

    return { nodes, edges };
}

// Layout a rooted, non-cyclic, single-parent graph (your constraints) into columns (by depth)
// and vertically center parents over their children. Stable order = order in `offers[id]`.
export function layoutChainForReadOnly(chainData, opts = {}) {
    const { xGap = 260, yGap = 300, xStart = 0, yStart = 0 } = opts;

    const nodesById = new Map();
    chainData.chainNodes.forEach((n) => nodesById.set(n.id, { ...n }));

    // Build adjacency preserving order from offers
    const children = new Map();
    const parent = new Map();

    Object.entries(chainData.offers || {}).forEach(([src, arr]) => {
        const ordered = (arr || []).map((e) => String(e.offerId));
        children.set(String(src), ordered);
        for (const childId of ordered) {
            parent.set(childId, String(src));
        }
    });

    // Ensure every node key exists in children map (even if leaf)
    for (const id of nodesById.keys()) {
        if (!children.has(id)) children.set(id, []);
    }

    const root = String(chainData.firstOffer);

    // A DFS “tidy” layout: assign y to leaves in sequence; parents get avg(children.y)
    const pos = new Map();
    let leafRow = 0;

    const visit = (id, depth) => {
        const kids = children.get(id) || [];
        const x = xStart + depth * xGap;

        if (kids.length === 0) {
            const y = yStart + leafRow * yGap;
            pos.set(id, { x, y });
            leafRow += 1;
            return { minY: y, maxY: y };
        }

        let minY = Infinity;
        let maxY = -Infinity;
        for (const kid of kids) {
            const r = visit(kid, depth + 1);
            minY = Math.min(minY, r.minY);
            maxY = Math.max(maxY, r.maxY);
        }
        const y = (minY + maxY) / 2;
        pos.set(id, { x, y });
        return { minY, maxY };
    };

    // Visit root first
    if (nodesById.has(root)) {
        visit(root, 0);
        const stack = [root];
        while (stack.length) {
            const cur = stack.pop();
            for (const c of children.get(cur) || []) stack.push(c);
        }
    }

    // Place any orphan/unreachable nodes
    for (const id of nodesById.keys()) {
        if (!pos.has(id)) {
            let d = 0;
            let cur = id;
            const seen = new Set();
            while (cur && parent.has(cur) && !seen.has(cur)) {
                d += 1;
                seen.add(cur);
                cur = parent.get(cur);
            }
            const x = xStart + d * xGap;
            const y = yStart + leafRow * yGap;
            pos.set(id, { x, y });
            leafRow += 1;
        }
    }

    // Normalize Y so top starts at 0
    let minY = Infinity;
    for (const p of pos.values()) minY = Math.min(minY, p.y);
    const yShift = isFinite(minY) ? -minY : 0;

    const chainNodes = chainData.chainNodes.map((n) => ({
        ...n,
        position: {
            x: pos.get(n.id).x,
            y: pos.get(n.id).y + yShift,
        },
    }));

    return { ...chainData, chainNodes };
}

/**
 * Auto-layout nodes as a tidy rooted tree
 * - Keeps any node that already has a numeric position
 * - Computes positions for the rest using a DFS "parent centered over children"
 * - Column by depth (x), stable child order, vertically spaced leaves
 * @param {Array} nodes - Array of nodes
 * @param {Array} edges - Array of edges
 * @returns {Array} - Updated nodes with tree positions
 */
export function autoLayoutNodes(nodes, edges) {
    // Spacing / offsets (tweak to taste)
    const xGap = 300; // horizontal distance between columns
    const yGap = 160; // vertical distance between leaves/siblings
    const xStart = 100; // left padding
    const yStart = 60; // top padding

    // Quick lookup for nodes and which already have positions
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const hasFixedPos = (n) =>
        n &&
        n.position &&
        Number.isFinite(n.position.x) &&
        Number.isFinite(n.position.y);

    // Build children & parent maps from edges (order is preserved)
    const children = new Map(); // id -> [childId, ...]
    const parent = new Map(); // childId -> parentId
    for (const n of nodes) children.set(n.id, children.get(n.id) || []);

    edges.forEach((e) => {
        const s = String(e.source);
        const t = String(e.target);
        if (!children.has(s)) children.set(s, []);
        children.get(s).push(t);
        parent.set(t, s);
    });

    // Find root: a node without parent (prefer the one that already has children)
    const ids = nodes.map((n) => n.id);
    let root = ids.find(
        (id) => !parent.has(id) && (children.get(id) || []).length > 0
    );
    if (!root) {
        // fallback to any node without parent, then to first node
        root = ids.find((id) => !parent.has(id)) || ids[0];
    }

    // Tidy DFS: assign Y to leaves sequentially, parent Y = average(children)
    const pos = new Map(); // id -> {x,y}
    let leafRow = 0;

    const visit = (id, depth) => {
        const kids = children.get(id) || [];
        const x = xStart + depth * xGap;

        // If node already has fixed position, respect X but still compute min/max using that Y
        if (kids.length === 0) {
            let y;
            const node = byId.get(id);
            if (node && hasFixedPos(node)) {
                y = node.position.y;
            } else {
                y = yStart + leafRow * yGap;
                leafRow += 1;
            }
            pos.set(id, {
                x: node && hasFixedPos(node) ? node.position.x : x,
                y,
            });
            return { minY: y, maxY: y };
        }

        let minY = Infinity;
        let maxY = -Infinity;
        for (const kid of kids) {
            const r = visit(kid, depth + 1);
            minY = Math.min(minY, r.minY);
            maxY = Math.max(maxY, r.maxY);
        }

        let y;
        const node = byId.get(id);
        if (node && hasFixedPos(node)) {
            y = node.position.y; // honor fixed Y if provided
        } else {
            y = (minY + maxY) / 2; // center parent over children
        }

        pos.set(id, { x: node && hasFixedPos(node) ? node.position.x : x, y });
        return { minY: Math.min(minY, y), maxY: Math.max(maxY, y) };
    };

    // Walk from root (tree guaranteed by your data)
    if (root) {
        visit(root, 0);
    }

    // Any nodes not touched (isolated or missing in edges): place them below
    for (const id of ids) {
        if (!pos.has(id)) {
            const node = byId.get(id);
            if (hasFixedPos(node)) {
                pos.set(id, { x: node.position.x, y: node.position.y });
            } else {
                const x = xStart; // put at root column
                const y = yStart + leafRow * yGap;
                pos.set(id, { x, y });
                leafRow += 1;
            }
        }
    }

    // Normalize Y so top starts at >= 0
    let minY = Infinity;
    for (const p of pos.values()) minY = Math.min(minY, p.y);
    const yShift = Number.isFinite(minY) ? -Math.min(minY, 0) : 0;

    // Return nodes with computed positions, preserving any fixed ones
    return nodes.map((n) => {
        if (hasFixedPos(n)) return n;
        const p = pos.get(n.id);
        return { ...n, position: { x: p.x, y: p.y + yShift } };
    });
}
