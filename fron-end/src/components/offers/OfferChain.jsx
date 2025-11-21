import { useCallback, useState, useEffect } from "react";
import { Card, Empty, Divider } from "antd";
import { useSelector, useDispatch } from "react-redux";
import OfferCard from "./OfferCard";
import OfferChainForm from "./OfferChainForm";
import { addConnection, removeConnection } from "../../redux/stateSlices/offersSlice";
import "../../styles/offerChain.css";
import ChainGraph from "../chains/ChainGraph";

function OfferChain() {
    const chainData = useSelector((state) => state.offers.chainData);
    const chainNodes = useSelector((state) => state.offers.chainNodes);
    const dispatch = useDispatch();

    // Handle new connections between offers
    const handleConnect = useCallback((connection) => {
        dispatch(addConnection(connection));
    }, [dispatch]);
    
    // Handle edge deletion
    const handleEdgeDelete = useCallback((edge) => {
        dispatch(removeConnection(edge));
    }, [dispatch]);

    // Check if there are any offers in the chain
    const hasOffers = chainData.offers && Object.keys(chainData.offers).length > 0;
    if (!hasOffers) {
        return (
            <Card className="offer-chain-container" title="Offer Chain">
                <Empty description="No offers added to the chain yet" />
            </Card>
        );
    }

    return (
        <Card className="offer-chain-container" title="Offer Chain">
            <ChainGraph
                chainData={{...chainData, chainNodes}}
                customNodeType={OfferCard}
                onConnect={handleConnect}
                onEdgeDelete={handleEdgeDelete}
                isLocked={false}
            />

            {Object.keys(chainData.offers).length >= 1 && (
                <>
                    <Divider style={{ margin: "15px 0" }}>Create Chain</Divider>
                    <OfferChainForm />
                </>
            )}
        </Card>
    );
}

export default OfferChain;
