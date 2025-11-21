import { useState, useEffect } from 'react';
import { Spin, Alert, Card, Typography } from 'antd';
import { fetchChainById } from '../../api/offer';
import ChainSequencesTimeline from './ChainSequencesTimeline';

const { Title } = Typography;

/**
 * Component to display a client's journey through a chain
 * @param {Object} props
 * @param {Object} data - The ID of the chain to fetch, and the id of the current sequence
 */
function ShowJourney({ data }) {
    const [chainData, setChainData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Active sequence offer
    const [active, setActive] = useState(null);
    const { chainId, currSeq } = data;

    useEffect(() => {
        async function fetchChainData() {
            if (!chainId) {
                setError('No chain ID provided');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await fetchChainById(chainId);

                if (typeof response !== "string") {
                    setChainData(response);
                } else {
                    setError(response || 'Failed to load chain data');
                }

                setActive(response.offerSequences.findIndex((offer) => offer.sequenceId === currSeq))
            } catch (err) {
                console.error('Error fetching chain data:', err);
                setError('Failed to load journey details');
            } finally {
                setLoading(false);
            }
        }

        fetchChainData();
    }, [chainId]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
            />
        );
    }

    if (!chainData) {
        return (
            <Alert
                message="No Journey Data"
                description="Journey details not available"
                type="warning"
                showIcon
            />
        );
    }

    return (
        <div className="chain-journey">
            <Card 
                title={
                    <Title level={4}>
                        {chainData.title || 'Client Journey'}
                    </Title>
                }
            >
                {chainData.description && (
                    <p className="mb-4">{chainData.description}</p>
                )}
                
                {chainData.offerSequences && chainData.offerSequences.length > 0 ? (
                    <ChainSequencesTimeline sequences={chainData.offerSequences} activeAtIndex={3} />
                ) : (
                    <Alert
                        message="No Sequences"
                        description="This journey doesn't have any sequences defined."
                        type="info"
                        showIcon
                    />
                )}
            </Card>
        </div>
    );
}

export default ShowJourney;
