import { useState } from "react";
import { Input, Button, Dropdown } from "antd";
import {
    MenuOutlined,
    SearchOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    UserOutlined,
    LogoutOutlined,
    MoreOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/stateSlices/auth";
import { logout as logoutAPI } from "../../api/auth";
import { useNavigate } from "react-router-dom";
// import CompanyBrandFilter from "./CompanyBrandFilter";
import CompanyBrandFilterV1 from "./CompanyBrandFilterV1";

function Header() {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Toggle sidebar visibility
    function toggleSidebar() {
        document.body.classList.toggle("sidebar-collapsed");
    }

    // Toggle fullscreen mode
    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullScreen(true);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    setIsFullScreen(false);
                });
            }
        }
    }

    const menuItems = [
        {
            key: "profile",
            label: "Profile",
            icon: <UserOutlined />,
        },
        {
            key: "logout",
            label: "Logout",
            icon: <LogoutOutlined />,
            onClick: async () => {
                console.log("era ????");
                const response = await logoutAPI();
                if (response) {
                    dispatch(logout());
                    navigate("/login");
                }
            },
        },
    ];

    return (
        <nav
            className="navbar navbar-expand-lg bg-white border-bottom"
            style={{ minHeight: "60px" }}
        >
            <div className="container-fluid">
                <div className="d-flex align-items-center">
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={toggleSidebar}
                        className="me-2 icon-btn"
                    />
                    <span className="navbar-brand mb-0 h1">
                        Euro Star{" "}
                        <small
                            style={{
                                fontSize: "10px",
                                marginTop: "2px",
                            }}
                        >
                            Version: 1.0.0 (<em>beta</em>)
                        </small>
                    </span>
                </div>

                {/* Global Company/Brand Filter */}
                <div className="d-flex align-items-end gap-2">
                    <div className="d-flex align-items-center">
                        <CompanyBrandFilterV1
                            showBrands={true}
                            brandsOptional={true}
                            autoSelectAll={true}
                            style={{ margin: 0 }}
                        />
                    </div>

                    <div className="d-flex align-items-center">
                        <Button
                            type="text"
                            icon={
                                isFullScreen ? (
                                    <FullscreenExitOutlined />
                                ) : (
                                    <FullscreenOutlined />
                                )
                            }
                            onClick={toggleFullScreen}
                            className="me-2 icon-btn"
                        />

                        <Dropdown
                            menu={{ items: menuItems }}
                            placement="bottomRight"
                            trigger={["click"]}
                        >
                            <Button
                                type="text"
                                icon={<MoreOutlined />}
                                className="icon-btn"
                            />
                        </Dropdown>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Header;
