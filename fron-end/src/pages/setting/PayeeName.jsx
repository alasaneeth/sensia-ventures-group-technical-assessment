import PageHeader from "../../components/ui/PageHeader";
import PayeeNameTable from "../../components/payee/PayeeNameTable";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

function PayeeName() {
    const navigate = useNavigate();
    return (
        <>
            <PageHeader
                title="Payee Names"
                rightContent={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/payee-names/add")}
                    >
                        Add Payee Name
                    </Button>
                }
            />

            <PayeeNameTable />
        </>
    );
}

export default PayeeName;
