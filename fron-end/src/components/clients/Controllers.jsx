import { Button, Row } from "antd";
import { useNavigate } from "react-router-dom";
import { PlusOutlined, ExportOutlined } from "@ant-design/icons";

function Controllers({ onExtractClick }) {
    const navigate = useNavigate();

    return (
        <Row style={{ display: "flex", gap: "1rem" }}>
            {/* <Button 
                type="primary" 
                icon={<ExportOutlined />}
                onClick={onExtractClick}
            >
                Extract
            </Button> */}
            
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/database/add")}
            >
                Add
            </Button>
        </Row>
    );
}

export default Controllers;
