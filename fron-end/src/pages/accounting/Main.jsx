import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Nav, Tab } from "react-bootstrap";

function Main() {
    const location = useLocation();
    const navigate = useNavigate();

    // Extract the last segment of the pathname
    const pathSegments = location.pathname.split("/").filter(Boolean);
    let activeKey =
        pathSegments[pathSegments.length - 1]?.toLowerCase() || "invoices";

    // if (lastSegment === "add-invoice") {
    //     activeKey = "addInvoice";
    // } else if (lastSegment === "add-payment") {
    //     activeKey = "addPayment";
    // } else if (lastSegment === "payments") {
    //     activeKey = "payments";
    // } else if (lastSegment === "invoices") {
    //     activeKey = "invoices";
    // } else if (lastSegment === "summary") {
    //     activeKey = "summary";
    // }

    function handleSelect(key) {
        // Navigate to the corresponding route
        if (key === "invoices") {
            navigate("/accounting/invoices");
        } else if (key === "add-invoice") {
            navigate("/accounting/add-invoice");
        } else if (key === "payments") {
            navigate("/accounting/payments");
        } else if (key === "add-payment") {
            navigate("/accounting/add-payment");
        } else if (key === "summary") {
            navigate("/accounting/summary");
        }
    }

    return (
        <div>
            <Tab.Container activeKey={activeKey} onSelect={handleSelect}>
                <Nav variant="tabs" style={{ marginBottom: "1rem" }}>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="invoices">Invoices</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="add-invoice">Add Invoice</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="payments">Payments</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="add-payment">Add Payment</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="summary">Summary</Nav.Link>
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
