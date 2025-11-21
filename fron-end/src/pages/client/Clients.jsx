import { useMemo } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Controllers from "../../components/clients/Controllers";
import ClientTableV1 from "../../components/clients/ClientTableV1";
import { useGlobalCompanyBrandFilter } from "../../hooks/useGlobalCompanyBrandFilter";

function Clients() {
    const { selectedBrandIds } = useGlobalCompanyBrandFilter();

    // Build brand filter on the fly
    const brandFilters = useMemo(() => {
        if (selectedBrandIds && selectedBrandIds.length > 0) {
            return {
                brandId: [{ in: selectedBrandIds }],
            };
        }
        return undefined;
    }, [selectedBrandIds]);

    return (
        <div>
            <PageHeader
                title="Database Records"
                rightContent={
                    <Controllers />
                }
            />

            <ClientTableV1 filters={brandFilters} />
        </div> 
    );
}

export default Clients;
