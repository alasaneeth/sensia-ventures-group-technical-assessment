import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntdApp, message } from "antd";

// Put this once – pushes messages below a fixed header:
message.config({
    top: 72, // adjust for your header height (or 0 if none)
    maxCount: 3, // optional
});

// Bridges global `message.*` to a guaranteed mounted instance
function MessageBridge() {
    const [api, contextHolder] = message.useMessage();

    useEffect(() => {
        // Replace static message methods with the mounted api
        [
            "open",
            "success",
            "info",
            "warning",
            "error",
            "loading",
            "destroy",
        ].forEach((k) => {
            // @ts-ignore
            message[k] = api[k];
        });
    }, [api]);

    return contextHolder;
}

createRoot(document.getElementById("root")).render(
    // <StrictMode>
    <BrowserRouter>
        <ConfigProvider
            theme={{
                token: {
                    // Lift popup base z-index so messages beat your .sidebar (z-index:1000)
                    zIndexPopupBase: 2000,
                },
            }}
        >
            <AntdApp>
            <MessageBridge />
            <App />
            </AntdApp>
        </ConfigProvider>
        {/* <OfferGraph /> */}
    </BrowserRouter>
    // </StrictMode>
);
