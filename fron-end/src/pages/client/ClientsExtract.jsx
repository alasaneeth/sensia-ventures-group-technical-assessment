import PageHeader from "../../components/ui/PageHeader";
import Extraction from "../../components/clients/Extraction";

function ClientsExtract() {
    return (
        <>
            <PageHeader title="Clients Exportation" />

            {/* <ClientsExtraction
                onCancel={handleCancel}
                onSubmit={handleExtractSubmit}
                onCampaignChange={(campaign) => setSelectedCampaign(campaign)}
                onClientSelectionChange={(clients) =>
                    setSelectedClients(clients)
                }
            /> */}
            <Extraction />
        </>
    );
}

export default ClientsExtract;
