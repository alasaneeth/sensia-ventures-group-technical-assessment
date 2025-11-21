import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Spin, message, Radio } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { fetchChainById } from "../../api/offer";
import ChainInfoCard from "../../components/chains/ChainInfoCard";
import ChainGraph from "../../components/chains/ChainGraph";
import ChainTableView from "../../components/chains/ChainTableView";
import { layoutChainForReadOnly } from "../../util/chainGraphUtils";


function ChainDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [chain, setChain] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [viewMode, setViewMode] = useState("table"); // 'graph' or 'table'

    async function fetchChainData() {
        setLoading(true);
        try {
            setErr("");
            setLoading(true);

            const result = await fetchChainById(id);
            if (typeof result !== "string") setChain(result);
            else setErr(result);
        } catch (error) {
            console.error("Error fetching chain details:", error);
            message.error("Failed to fetch chain details");
            setErr("Failed to fetch chain details");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (id) {
            fetchChainData();
        }
    }, [id]);

    function handleBack() {
        navigate(-1);
    }

    const preparedChain = useMemo(() => {
        if (!chain) return null;
        try {
            return layoutChainForReadOnly(chain);
        } catch {
            return chain;
        }
    }, [chain]);

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "400px",
                }}
            >
                <Spin size="large" />
            </div>
        );
    }

    if (!chain) {
        return (
            <div style={{ padding: "24px" }}>
                <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                    Back
                </Button>
                <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <p>{err}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px" }}>
            {/* <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between" }}>
                <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                    Back
                </Button>
                <Radio.Group 
                    value={viewMode} 
                    onChange={(e) => setViewMode(e.target.value)}
                    buttonStyle="solid"
                >
                    <Radio.Button value="graph">Graph View</Radio.Button>
                    <Radio.Button value="table">Table View</Radio.Button>
                </Radio.Group>
            </div> */}

            <ChainInfoCard chain={chain} />

            <div style={{ marginTop: "24px" }}>
                {viewMode === "graph" ? (
                    <ChainGraph chainData={preparedChain} isLocked={true} />
                ) : (
                    <ChainTableView chainData={chain} viewActivation={true} />
                )}
            </div>
        </div>
    );
}

export default ChainDetail;
