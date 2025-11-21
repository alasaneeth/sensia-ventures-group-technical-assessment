import { Route } from "react-router-dom";
import NotFound from "../../pages/NotFound";

// Recursive function to take the routes and make nested routes in case needed
export function AllRoutes(routes) {
    if (!Array.isArray(routes)) throw new Error("Routes must be an array");

    return (
        <Route path={routes.path} element={routes.element}>
            {routes.map((route) => (
                <Route
                    path={route.path}
                    element={route.element}
                    index={route?.index}
                >
                    {/* Check if there is a children take them and pass them to the function */}
                    {route.children && AllRoutes(route.children)}
                </Route>
            ))}
        </Route>
    );
}

