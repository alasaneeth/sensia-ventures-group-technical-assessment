import React from "react";
import { Card } from "react-bootstrap";
import BundleSkuForm from "../../components/skus/BundleSkuForm";
import { useNavigate } from "react-router-dom";

function AddBundleSku() {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate("/skus/bundle-skus");
    };

    return (
        <div>
            <Card>
                <Card.Header>
                    <h4 style={{ margin: 0 }}>Create Bundle SKU</h4>
                </Card.Header>
                <Card.Body>
                    <BundleSkuForm onSuccess={handleSuccess} />
                </Card.Body>
            </Card>
        </div>
    );
}

export default AddBundleSku;
