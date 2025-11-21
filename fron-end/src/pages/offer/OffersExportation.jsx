import PageHeader from "../../components/ui/PageHeader";
import ExportationOffersTable from "../../components/printer/ExportationOffersTable";
import { Header } from "antd/es/layout/layout";
// import UpcomingExportsTable from "../components/printer/UpcomingExportsTable";
import HistoryExportsTable from "../../components/printer/HistoryExportsTable";
import { Divider } from "antd";
import { useState } from "react";

function OffersExportation() {
    // TODO: in the future I will use react query so I can refetch the history when I export an offer
    const [keys, setKeys] = useState([
        "adsfgsdf23rewfsd",
        "wefsdge445y",
        "3rge24twegsd",
    ]);

    function onExport() {
        setKeys([Date.now() + 100, Date.now() + 200, Date.now() + 300]);
    }

    return (
        <>
            <PageHeader title="Printer" />

            {/* <div>
                <h3 style={{ fontSize: "1.3rem" }}>Upcoming Exports</h3>
                <UpcomingExportsTable key={keys[0]} />
            </div>
            <Divider /> */}
            <div>
                <h3 style={{ fontSize: "1.3rem" }}>Current Exports</h3>
                <ExportationOffersTable key={keys[1]} onExport={onExport} />
            </div>
            <Divider />
            <div>
                <h3 style={{ fontSize: "1.3rem" }}>History Exports</h3>
                <HistoryExportsTable key={keys[2]} />
            </div>
        </>
    );
}

export default OffersExportation;
