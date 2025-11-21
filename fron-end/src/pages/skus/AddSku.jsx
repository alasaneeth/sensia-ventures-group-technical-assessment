import React from "react";
import { Card } from "react-bootstrap";
import SkuForm from "../../components/skus/SkuForm";
import { useNavigate } from "react-router-dom";

function AddSku() {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate("/skus");
    };

    return (
        <div>
            <Card>
                <Card.Header>
                    <h4 style={{ margin: 0 }}>Create SKU</h4>
                </Card.Header>
                <Card.Body>
                    <SkuForm onSuccess={handleSuccess} />
                </Card.Body>
            </Card>
        </div>
    );
}

export default AddSku;
