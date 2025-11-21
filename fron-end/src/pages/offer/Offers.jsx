import { Button, Divider } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import OfferTable from "../../components/offers/OfferTable";
import OfferChain from "../../components/offers/OfferChain";

function Offers() {
    const navigate = useNavigate();

    return (
        <div className="offers-page">
            <PageHeader
                title="Offers"
                rightContent={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/offers/add")}
                    >
                        Add Offer
                    </Button>
                }
            />

            <OfferTable renderAction={true} />

            <Divider />

            {/* Display the offer chain above the table */}
            <OfferChain />
        </div>
    );
}

export default Offers;
