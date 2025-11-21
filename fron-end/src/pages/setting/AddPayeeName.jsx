import PayeeForm from "../../components/payee/PayeeForm";
import PageHeader from "../../components/ui/PageHeader";

function AddPayeeName() {
    return (
        <>
            <PageHeader
                title="Add Payee Name"
            />

            <PayeeForm />
        </>
    );
}

export default AddPayeeName;