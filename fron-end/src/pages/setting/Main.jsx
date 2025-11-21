import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Nav, Tab } from "react-bootstrap";

function Main() {
    const location = useLocation();
    const navigate = useNavigate();
    // Extract the last segment of the pathname
    const pathSegments = location.pathname.split("/").filter(Boolean);
    let activeKey =
        pathSegments[pathSegments.length - 1]?.toLowerCase() || "addresses";

    // If we're at /addresses root, set activeKey to "addresses"
    if (location.pathname === "/addresses" || location.pathname === "/addresses/") {
        activeKey = "addresses";
    }

    function handleSelect(key) {
        // Navigate to the corresponding route
        if (key === "addresses") {
            navigate("/addresses");
        } else if (key === "add-address") {
            navigate("/addresses/add-address");
        } else if (key === "shipments") {
            navigate("/addresses/shipments");
        }
    }

    return (
        <div>
            <Tab.Container activeKey={activeKey} onSelect={handleSelect}>
                <Nav variant="tabs" style={{ marginBottom: "1rem" }}>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="addresses">PO Boxes</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="add-address">Add PO Box</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="shipments">Shipments</Nav.Link>
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

export default Main;