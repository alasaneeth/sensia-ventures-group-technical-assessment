import PageHeader from "../../components/ui/PageHeader";
import CompanyTable from "../../components/companies/CompanyTable";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

function Companies() {
    const navigate = useNavigate();
    return (
        <>
            <PageHeader
                title="Companies"
                rightContent={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/companies/add")}
                    >
                        Add Company
                    </Button>
                }
            />

            <CompanyTable />
        </>
    );
}

export default Companies;

