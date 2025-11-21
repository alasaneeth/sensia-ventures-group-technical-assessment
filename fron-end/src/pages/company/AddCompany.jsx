import CompanyForm from "../../components/companies/CompanyForm";
import PageHeader from "../../components/ui/PageHeader";

function AddCompany() {
    return (
        <>
            <PageHeader
                title="Add Company"
            />

            <CompanyForm />
        </>
    );
}

export default AddCompany;

