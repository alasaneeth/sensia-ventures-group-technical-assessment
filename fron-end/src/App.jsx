import { Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store";
import "antd/dist/reset.css";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";
import routes from "./Routes";
import { AllRoutes } from "./components/ui/AllRoutes";

function App() {
    return (
        <Provider store={store}>
            <Routes>
                {/* Simply call all routes */}
                {AllRoutes(routes)}
            </Routes>
        </Provider>
    );
}

export default App;