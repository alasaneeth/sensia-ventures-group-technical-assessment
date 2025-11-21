import ClientForm from "../../components/clients/ClientForm";
import PageHeader from "../../components/ui/PageHeader";

function AddClient() {
    return (
        <div>
            <PageHeader
                title="Add Client"
            />
            
            <ClientForm />
        </div>
    );
}

export default AddClient;