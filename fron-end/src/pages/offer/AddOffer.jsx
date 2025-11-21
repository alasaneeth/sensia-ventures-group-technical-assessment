import PageHeader from '../../components/ui/PageHeader';
import OfferForm from '../../components/offers/OfferForm';

function AddOffer() {
    return (
        <div>
            <PageHeader 
                title="Add Offer" 
                rightContent={<div></div>} 
            />
            
            <OfferForm />
        </div>
    );
}

export default AddOffer;