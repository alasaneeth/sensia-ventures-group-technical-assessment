import { useState, useEffect, lazy, useMemo } from "react";
import { Menu } from "antd";
import { NavLink, useLocation } from "react-router-dom";
import {
    PlusOutlined,
    CloseOutlined,
    FileTextOutlined,
    OrderedListOutlined,
    GlobalOutlined,
    UnorderedListOutlined,
    LinkOutlined,
    UserOutlined,
    UserSwitchOutlined,
    ShoppingCartOutlined,
    BarcodeOutlined,
    HomeOutlined,
    ExportOutlined,
    PayCircleOutlined,
    ImportOutlined,
    PrinterOutlined,
    ShoppingFilled,
    SnippetsOutlined,
    BuildOutlined,
    SafetyOutlined,
} from "@ant-design/icons";
import { FaCoins, FaDev } from "react-icons/fa";
import { useSelector } from "react-redux";
import { BiCalculator } from "react-icons/bi";

/// This function will change on every re-render
let closeSidebar = null;

// Now due to closure we can use that function. and here the list will be created once
// and rendered many times

// Sidebar Component
function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileView, setMobileView] = useState(window.innerWidth < 800);
    const location = useLocation();
    const user = useSelector((state) => state.auth.user);

    const items = useMemo(() => {
        const routes = [
            {
                key: "campaigns",
                icon: <GlobalOutlined />,
                label: "Campaigns",
                children: [
                    {
                        key: "campaign-list",
                        icon: <OrderedListOutlined />,
                        label: (
                            <NavLink
                                to="/campaigns"
                                onClick={() => closeSidebar?.()}
                            >
                                Campaigns
                            </NavLink>
                        ),
                    },
                    {
                        key: "address-list",
                        icon: <HomeOutlined />,
                        label: (
                            <NavLink
                                to="/addresses"
                                onClick={() => closeSidebar?.()}
                            >
                                PO Box
                            </NavLink>
                        ),
                    },
                    {
                        key: "payment-methods-list",
                        icon: <FaCoins />,
                        label: (
                            <NavLink
                                to="/payment-methods"
                                onClick={() => closeSidebar?.()}
                            >
                                Payment Methods
                            </NavLink>
                        ),
                    },
                    // {
                    //     key: 'campaign-add',
                    //     icon: <PlusOutlined />,
                    //     label: <NavLink to="/campaigns/add" onClick={() => closeSidebar?.()}>Add Campaign</NavLink>,
                    // },
                ],
            },
            {
                key: "dev-comments",
                icon: <FaDev />,
                label: (
                    <NavLink
                        to="/dev-comments"
                        onClick={() => closeSidebar?.()}
                    >
                        Dev Comments
                    </NavLink>
                ),
            },
            {
                key: "companies",
                icon: <BuildOutlined />,
                label: (
                    <NavLink
                        to="/companies"
                        onClick={() => closeSidebar?.()}
                    >
                        Companies
                    </NavLink>
                ),
            },
            {
                key: "Accounting",
                icon: <BiCalculator />,
                label: (
                    <NavLink
                        to="/accounting/summary"
                        onClick={() => closeSidebar?.()}
                    >
                        Accounting
                    </NavLink>
                ),
                // children: [
                //     {
                //         key: "invoices-list",
                //         icon: <UnorderedListOutlined />,
                //         label: (
                //             <NavLink
                //                 to="/accounting/invoices"
                //                 onClick={() => closeSidebar?.()}
                //             >
                //                 Invoices
                //             </NavLink>
                //         ),
                //     },
                //     {
                //         key: "payment-list",
                //         icon: <UnorderedListOutlined />,
                //         label: (
                //             <NavLink
                //                 to="/accounting/payments"
                //                 onClick={() => closeSidebar?.()}
                //             >
                //                 Payments
                //             </NavLink>
                //         ),
                //     },
                // ],
            },
            // add it here
            {
                key: "products",
                icon: <ShoppingCartOutlined />,
                label: (
                    <NavLink
                        to="/products/products"
                        onClick={() => closeSidebar?.()}
                    >
                        Products
                    </NavLink>
                ),
            },
            {
                key: "skus",
                icon: <BarcodeOutlined />,
                label: (
                    <NavLink
                        to="/skus"
                        onClick={() => closeSidebar?.()}
                    >
                        SKUs
                    </NavLink>
                ),
            },
            {
                key: "offers",
                icon: <FileTextOutlined />,
                label: "Offers",
                children: [
                    // {
                    //     key: 'offers-add',
                    //     icon: <PlusOutlined />,
                    //     label: <NavLink to="/offers/add" onClick={() => closeSidebar?.()}>Create Offer</NavLink>,
                    // },
                    {
                        key: "offers-list",
                        icon: <UnorderedListOutlined />,
                        label: (
                            <NavLink
                                to="/offers"
                                onClick={() => closeSidebar?.()}
                            >
                                Offers
                            </NavLink>
                        ),
                    },
                    {
                        key: "offers-chains",
                        icon: <LinkOutlined />,
                        label: (
                            <NavLink
                                to="/offers-chains"
                                onClick={() => closeSidebar?.()}
                            >
                                Offers Chains
                            </NavLink>
                        ),
                    },
                    {
                        key: "offers-import",
                        icon: <ImportOutlined />,
                        label: (
                            <NavLink
                                to="/offers/import"
                                onClick={() => closeSidebar?.()}
                            >
                                Import Offers
                            </NavLink>
                        ),
                    },
                    {
                        key: "payee-names",
                        icon: <PayCircleOutlined />,
                        label: (
                            <NavLink
                                to="/payee-names"
                                onClick={() => closeSidebar?.()}
                            >
                                Payee Names
                            </NavLink>
                        ),
                    },
                ],
            },
            {
                key: "database",
                icon: <UserOutlined />,
                label: "Database",
                children: [
                    {
                        key: "clients-list",
                        icon: <UnorderedListOutlined />,
                        label: (
                            <NavLink
                                to="/database"
                                onClick={() => closeSidebar?.()}
                            >
                                Database
                            </NavLink>
                        ),
                    },
                    {
                        key: "clients-extract-list",
                        icon: <ExportOutlined />,
                        label: (
                            <NavLink
                                to="/database/extract"
                                onClick={() => closeSidebar?.()}
                            >
                                List Selection
                            </NavLink>
                        ),
                    },
                    // {
                    //     key: 'clients-add',
                    //     icon: <PlusOutlined />,
                    //     label: <NavLink to="/database/add" onClick={() => closeSidebar?.()}>Add Record</NavLink>,
                    // },

                    {
                        key: "clients-enrolled-list",
                        icon: <UserSwitchOutlined />,
                        label: (
                            <NavLink
                                to="/database/enroll"
                                onClick={() => closeSidebar?.()}
                            >
                                Mail Files
                            </NavLink>
                        ),
                    },
                    {
                        key: "database-import",
                        icon: <ImportOutlined />,
                        label: (
                            <NavLink
                                to="/database/import"
                                onClick={() => closeSidebar?.()}
                            >
                                Import Database
                            </NavLink>
                        ),
                    },
                ],
            },
            {
                key: "offers-exportation-list",
                label: "Printer",
                icon: <PrinterOutlined />,
                children: [
                    {
                        key: "offers-exportation-list-print",
                        icon: <PrinterOutlined />,
                        label: (
                            <NavLink
                                to="/offers-exportation"
                                onClick={() => closeSidebar?.()}
                            >
                                Print
                            </NavLink>
                        ),
                    },
                ],
            },
            {
                key: "orders",
                label: "Orders",
                icon: <ShoppingCartOutlined />,
                children: [
                    {
                        key: "orders-add",
                        icon: <ShoppingFilled />,
                        label: (
                            <NavLink
                                to="/orders/add"
                                onClick={() => closeSidebar?.()}
                            >
                                Place Order
                            </NavLink>
                        ),
                    },
                    {
                        key: "orders-list",
                        icon: <ShoppingCartOutlined />,
                        label: (
                            <NavLink
                                to="/orders"
                                onClick={() => closeSidebar?.()}
                            >
                                Orders
                            </NavLink>
                        ),
                    },
                    {
                        key: "order-list-summary",
                        icon: <SnippetsOutlined />,
                        label: (
                            <NavLink
                                to="/orders/summary"
                                onClick={() => closeSidebar?.()}
                            >
                                Summary
                            </NavLink>
                        ),
                    },
                ],
            },
            {
                key: "rbac",
                icon: <SafetyOutlined />,
                label: (
                    <NavLink
                        to="/rbac"
                        onClick={() => closeSidebar?.()}
                    >
                        RBAC
                    </NavLink>
                ),
            },

            // {
            //     key: "skus",
            //     label: "SKUs",
            //     icon: <BarcodeOutlined />,
            //     children: [
            //         {
            //             key: "skus-list",
            //             icon: <BarcodeOutlined />,
            //             label: (
            //                 <NavLink to="/skus" onClick={() => closeSidebar?.()}>
            //                     SKUs
            //                 </NavLink>
            //             ),
            //         },
            //     ],
            // },
            // {
            //     key: "address",
            //     label: "Addresses",
            //     icon: <HomeOutlined />,
            //     children: [
            //         {
            //             key: "address-list",
            //             icon: <HomeOutlined />,
            //             label: <NavLink to="/addresses" onClick={() => closeSidebar?.()}>Addresses</NavLink>,
            //         },
            //     ],
            // }
        ];

        if (user.role === 1) {
            // Admin sees all routes except companies and rbac (super admin only)
            return routes.filter((route) => route.key !== "companies" && route.key !== "rbac");
        }
        if (user.role === 2)
            return routes.filter((route) =>
                ["offers-exportation-list", "dev-comments"].includes(route.key)
            );
        if (user.role === 3)
            return routes.filter((route) =>
                ["orders", "dev-comments"].includes(route.key)
            );
        if (user.role === 99) return routes; // Super admin sees all routes including companies and rbac
        return []; // Default: no routes
    });

    // Handle window resize for responsive behavior
    useEffect(() => {
        function handleResize() {
            const isMobile = window.innerWidth < 800;
            setMobileView(isMobile);

            // Auto collapse on mobile
            if (isMobile && !collapsed) {
                setCollapsed(true);
                document.body.classList.add("sidebar-collapsed");
            }
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [collapsed]);

    // Listen for sidebar toggle from header
    useEffect(() => {
        function handleSidebarToggle() {
            setCollapsed(document.body.classList.contains("sidebar-collapsed"));
        }

        document.body.addEventListener("sidebarToggle", handleSidebarToggle);
        return () =>
            document.body.removeEventListener(
                "sidebarToggle",
                handleSidebarToggle
            );
    }, []);

    // Close sidebar on mobile. Assign it the variable closeSidebar so buttons can call it
    closeSidebar = () => {
        if (mobileView) {
            setCollapsed(true);
            document.body.classList.add("sidebar-collapsed");
        }
    };

    // Get current selected keys based on location ot mark the element as active
    function getSelectedKeys() {
        const path = location.pathname;
        if (path.includes("/campaign/add")) return ["campaign-add"];
        if (path.includes("/campaign")) return ["campaign-list"];
        if (path.includes("/orders/add")) return ["orders-add"];
        if (path.includes("/companies")) return ["companies"];
        // if (path.includes("/orders")) return ["orders-list"];
        return [];
    }

    return (
        <div
            className={`sidebar ${collapsed ? "collapsed" : ""} ${
                mobileView ? "mobile" : ""
            }`}
            style={{
                width: collapsed ? "0" : "250px",
                position: mobileView ? "fixed" : "relative",
                height: "100%",
                backgroundColor: "#fff",
                borderRight: "1px solid #ddd",
                transition: "width 0.3s ease",
                zIndex: 1000,
                overflow: "auto",
                // display: "flex",
                // flexDirection: "column"
            }}
        >
            {mobileView && !collapsed && (
                <div className="d-flex justify-content-end p-2">
                    <button
                        className="btn btn-sm icon-btn"
                        onClick={closeSidebar}
                    >
                        <CloseOutlined />
                    </button>
                </div>
            )}

            <Menu
                className="custome-sidebar-menu"
                mode="inline"
                selectedKeys={getSelectedKeys()}
                style={{
                    borderRight: 0,
                    width: "100%",
                    color: "inherit",
                }}
                items={items}
                theme="light"
            />
        </div>
    );
}

export default Sidebar;
