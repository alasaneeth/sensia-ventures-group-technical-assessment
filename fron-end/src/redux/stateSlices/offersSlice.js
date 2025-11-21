import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    chainData: {
        title: "Offer Chain",
        description: "Current offer chain",
        offers: {} // Structure: { "offerId": [{ offerId: "targetId", daysToAdd: number }] }
    },
    chainNodes: [] // Array of offer objects that are nodes in the chain
}

const offersSlice = createSlice({
    name: 'offers',
    initialState,
    reducers: {
        addNodeToChain: (state, action) => {
        // action.payload should be { id, title, description }
            const offerId = action.payload.id.toString();
            const existingIndex = state.chainNodes.findIndex(offer => offer.id === action.payload.id);
            
            if (existingIndex === -1) {
                // Determine if this is the first offer (head)
                const isFirst = state.chainNodes.length === 0;
                
                // Add the offer with isFirst flag
                state.chainNodes.push({
                    ...action.payload,
                    isFirst: isFirst
                });
                
                // Initialize empty connections for this offer
                state.chainData.offers[offerId] = [];
            }
        },
        removeNodeFromChain: (state, action) => {
            // action.payload is the offer id
            const offerId = action.payload.toString();
            
            // Remove from nodes array
            state.chainNodes = state.chainNodes.filter(
                offer => offer.id !== action.payload
            );
            
            // If we removed the first offer, make the next offer first
            if (state.chainNodes.length > 0) {
                // Reset all isFirst flags
                state.chainNodes.forEach(offer => offer.isFirst = false);
                // Set the first remaining offer as first
                state.chainNodes[0].isFirst = true;
            }
            
            // Remove from offers structure and all connections to this offer
            delete state.chainData.offers[offerId];
            
            // Remove connections pointing to this offer
            Object.keys(state.chainData.offers).forEach(sourceId => {
                state.chainData.offers[sourceId] = state.chainData.offers[sourceId].filter(
                connection => connection.offerId !== offerId
                );
            });
            },
        addConnection: (state, action) => {
        // action.payload should be { sourceId, targetId, daysToAdd }
            const { sourceId, targetId, daysToAdd } = action.payload;
            const sourceIdStr = sourceId.toString();
            const targetIdStr = targetId.toString();
            
            if (!state.chainData.offers[sourceIdStr]) {
                state.chainData.offers[sourceIdStr] = [];
            }
        
        // Check if connection already exists
            const existingConnection = state.chainData.offers[sourceIdStr].find(
                conn => conn.offerId === targetIdStr
            );
            
            if (!existingConnection) {
                state.chainData.offers[sourceIdStr].push({
                offerId: targetIdStr,
                daysToAdd: daysToAdd || 0
                });
            }
        },
        removeConnection: (state, action) => {
        // action.payload should be { sourceId, targetId }
            const { sourceId, targetId } = action.payload;
            const sourceIdStr = sourceId.toString();
            const targetIdStr = targetId.toString();
            
            if (state.chainData.offers[sourceIdStr]) {
                state.chainData.offers[sourceIdStr] = state.chainData.offers[sourceIdStr].filter(
                connection => connection.offerId !== targetIdStr
                );
            }
        },
        updateConnectionDays: (state, action) => {
            // action.payload should be { sourceId, targetId, daysToAdd }
            const { sourceId, targetId, daysToAdd } = action.payload;
            const sourceIdStr = sourceId.toString();
            const targetIdStr = targetId.toString();
            
            if (state.chainData.offers[sourceIdStr]) {
                const connection = state.chainData.offers[sourceIdStr].find(
                conn => conn.offerId === targetIdStr
                );

                if (connection) {
                connection.daysToAdd = daysToAdd;
                }
            }
        },
        clearOfferChain: (state) => {
            state.chainNodes = [];
            state.chainData.offers = {};
        },
        setChainMetadata: (state, action) => {
            // action.payload should be { title, description }
            state.chainData.title = action.payload.title;
            state.chainData.description = action.payload.description;
        },
        setNodeReturnAddress: (state, action) => {
            // action.payload should be { nodeId, returnAddress }
            const { nodeId, returnAddress } = action.payload;
            
            // Find the node in the chainNodes array
            const nodeIndex = state.chainNodes.findIndex(node => node.id === nodeId);
            
            if (nodeIndex !== -1) {
                // Update the node with the return address
                state.chainNodes[nodeIndex].returnAddress = returnAddress;
            }
        }
    }
});

export const { 
    addNodeToChain, 
    removeNodeFromChain, 
    addConnection, 
    removeConnection, 
    updateConnectionDays, 
    clearOfferChain, 
    setChainMetadata,
    setNodeReturnAddress 
} = offersSlice.actions;

export default offersSlice.reducer;
