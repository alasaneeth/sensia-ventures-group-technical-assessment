import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Nav, Tab } from "react-bootstrap";

function ProductMain() {
    const location = useLocation();
    const navigate = useNavigate();

    // Extract the last segment of the pathname
    const pathSegments = location.pathname.split("/").filter(Boolean);
    let activeKey =
        pathSegments[pathSegments.length - 1]?.toLowerCase() || "products";

    function handleSelect(key) {
        // Navigate to the corresponding route
        if (key === "products") {
            navigate("/products/products");
        } else if (key === "add-product") {
            navigate("/products/add-product");
        } else if (key === "product-variations") {
            navigate("/products/product-variations");
        } else if (key === "add-product-variation") {
            navigate("/products/add-product-variation");
        } else if (key === "categories") {
            navigate("/products/categories");
        } else if (key === "add-category") {
            navigate("/products/add-category");
        }
    }

    return (
        <div>
            <Tab.Container activeKey={activeKey} onSelect={handleSelect}>
                <Nav variant="tabs" style={{ marginBottom: "1rem" }}>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="products">Products</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="add-product">Add Product</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="product-variations">Product Variations</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="add-product-variation">Add Product Variation</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="categories">Categories</Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ fontSize: "1.1rem" }}>
                        <Nav.Link eventKey="add-category">Add Category</Nav.Link>
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

export default ProductMain;

