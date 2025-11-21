import { Button } from "antd";
import PageHeader from "../../components/ui/PageHeader";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

function Sku() {
    const navigate = useNavigate();
    return (
        <>
            <PageHeader
                title="SKU"
                rightContent={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/skus/add")}
                    >
                        Add SKU
                    </Button>
                }
            />
        </>
    );
}

export default Sku;
