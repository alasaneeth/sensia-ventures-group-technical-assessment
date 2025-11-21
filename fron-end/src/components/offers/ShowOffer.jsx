import { useState, useEffect } from 'react';
import { Spin, Alert } from 'antd';
import { fetchOfferData } from '../../api/offer';
import OfferDetails from '../offers/OfferDetails';

/**
 * Component to fetch and display offer details
 * @param {Object} props
 * @param {string|number} props.offerId - The ID of the offer to fetch
 */
function ShowOffer({ offerId }) {
    const [offerData, setOfferData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchOffer() {
            if (!offerId) {
                setError('No offer ID provided');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const data = await fetchOfferData(offerId);
                setOfferData(data);
            } catch (err) {
                console.error('Error fetching offer data:', err);
                setError('Failed to load offer details');
            } finally {
                setLoading(false);
            }
        };

        fetchOffer();
    }, [offerId]);

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

    console.log("This is rendering");

    return (
        <OfferDetails offerData={offerData} />
    );
}

export default ShowOffer;