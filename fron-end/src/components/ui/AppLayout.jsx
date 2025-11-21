import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/custom.css";

function AppLayout() {
    // Fix for sidebar toggle event
    useEffect(() => {
        function toggleSidebar() {
            const event = new Event("sidebarToggle");
            document.body.dispatchEvent(event);
        }

        // Update the toggleSidebar function in Header component
        const originalToggleSidebar = document.body.classList.toggle;

        document.body.classList.toggle = function (className) {
            const result = originalToggleSidebar.apply(this, arguments);
            if (className === "sidebar-collapsed") {
                toggleSidebar();
            }
            return result;
        };

        return () => {
            document.body.classList.toggle = originalToggleSidebar;
        };
    }, []);

    return (
        <div className="d-flex flex-column vh-100">
            <Header />

            <div className="d-flex flex-grow-1 overflow-hidden">
                <Sidebar />

                <main
                    className="flex-grow-1 p-3 overflow-auto"
                    style={{
                        backgroundColor: "#f5f5f5",
                        minWidth: 0 /* Prevent flex items from growing beyond their container */,
                        width: "100%",
                    }}
                >
                    <div style={{ width: "100%", minWidth: 0 }}>
                        <Outlet />
                        {/*  */}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AppLayout;
