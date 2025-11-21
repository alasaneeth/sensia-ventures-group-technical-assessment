import { Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import ChainTable from "../../components/chains/ChainTable";

function Chain() {
    const navigate = useNavigate();

    return (
        <div className="chains-page">
            <PageHeader
                title="Offer Chains"
                rightContent={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            navigate("/offers");
                            message.info(
                                "Start creating chain by clicking on the offer and add it to the chain"
                            );
                        }}
                    >
                        Create Chain
                    </Button>
                }
            />

            <ChainTable />
        </div>
    );
}

export default Chain;
