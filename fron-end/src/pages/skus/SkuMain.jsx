import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Nav, Tab } from "react-bootstrap";

function SkuMain() {
    const location = useLocation();
    const navigate = useNavigate();

    // Extract the last segment of the pathname
    const pathSegments = location.pathname.split("/").filter(Boolean);
    let activeKey =
        pathSegments[pathSegments.length - 1]?.toLowerCase() || "skus";

    function handleSelect(key) {
        // Navigate to the corresponding route
        if (key === "skus") {
            navigate("/skus");
        } else if (key === "add-sku") {
            navigate("/skus/add-sku");
        } else if (key === "bundle-skus") {
            navigate("/skus/bundle-skus");
        } else if (key === "add-bundle-sku") {
            navigate("/skus/add-bundle-sku");
        }
    }

    return (
        <div>
            <Tab.Container activeKey={activeKey} onSelect={handleSelect}>
                <Nav variant="tabs" style={{ marginBottom: "1rem" }}>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="skus">SKUs</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="add-sku">Add SKU</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="bundle-skus">Bundle SKUs</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="add-bundle-sku">Add Bundle SKU</Nav.Link>
                    </Nav.Item>
                </Nav>
                <Tab.Content>
                    <Tab.Pane eventKey={activeKey} active>
                        <Outlet />
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </div>
    );
}

export default SkuMain;
