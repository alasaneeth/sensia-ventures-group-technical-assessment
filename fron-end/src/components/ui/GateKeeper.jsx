import { message, Spin } from "antd";
import { useEffect, useState } from "react";
import { getSession } from "../../api/auth";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { setSession, logout } from "../../redux/stateSlices/auth";
import { getCompanies } from "../../api/companies";
import { getBrands } from "../../api/brands";
import {
    setCompanies,
    setBrands,
    setSelectedCompanyIds,
    setSelectedBrandIds,
} from "../../redux/stateSlices/companyBrandFilter";

/**
 * GateKeeper component that handles authentication and optional role-based access control
 * @param {Object} props
 * @param {ReactNode} props.children - Component to render if authenticated and authorized
 * @param {number|number[]} props.requiredRole - Optional required role(s) to access the route
 * @param {string} props.redirectTo - Path to redirect if unauthorized (default: "/")
 */
function GateKeeper({ children, requiredRole, redirectTo = "/" }) {
    const { isAuthenticated, loggedInNow, user } = useSelector((state) => state.auth);
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isCompaniesLoading, setIsCompaniesLoading] = useState(true);

    console.log("\n################\n", location, "\n################\n");

    // Fetch companies and brands on initial load
    async function fetchCompaniesAndBrands() {
        try {
            // Fetch companies
            const companiesResult = await getCompanies(1, 1000);
            if (typeof companiesResult === "string") {
                message.error(companiesResult);
                setIsCompaniesLoading(false);
                return;
            }

            const companiesData = companiesResult.data || [];
            dispatch(setCompanies(companiesData));

            // Select first company
            if (companiesData.length > 0) {
                const firstCompanyId = companiesData[0].id;
                dispatch(setSelectedCompanyIds([firstCompanyId]));

                // Fetch brands for the first company
                const brandsResult = await getBrands(firstCompanyId, 1, 1000);
                if (typeof brandsResult === "string") {
                    message.error(brandsResult);
                    setIsCompaniesLoading(false);
                    return;
                }

                const brandsData = brandsResult.data || [];
                dispatch(setBrands(brandsData));

                // Select all brands
                const allBrandIds = brandsData.map((brand) => brand.id);
                dispatch(setSelectedBrandIds(allBrandIds));
            }

            setIsCompaniesLoading(false);
        } catch (error) {
            console.error("Error fetching companies and brands:", error);
            setIsCompaniesLoading(false);
        }
    }

    useEffect(() => {
        async function restoreSession() {
            if (loggedInNow) return; // Skip if the user just loggedin

            try {
                // 1. get the token from the local storage if exists
                const token = localStorage.getItem("token");

                if (typeof token !== "string") {
                    setIsLoading(false);
                    navigate("/login");
                    return;
                }

                // 2. validate the token
                const session = await getSession(token);
                if (typeof session === "string") {
                    message.error("Session Expired");
                    dispatch(logout());
                    navigate("/login");
                    return;
                }

                dispatch(
                    setSession({ user: session.user, accessToken: token })
                );

                // JUST FOR NOW
                if (
                    location.pathname !== "/offers-exportation" &&
                    location.pathname !== "/dev-comments" &&
                    session.user.role === 2
                )
                    navigate("/offers-exportation", { replace: true });

                if (
                    location.pathname !== "/orders/add" &&
                    location.pathname !== "/dev-comments" &&
                    session.user.role === 3
                )
                    navigate("/orders/add", { replace: true });

                setIsLoading(false);
                
                // Fetch companies and brands
                await fetchCompaniesAndBrands();
            } catch (error) {
                setIsLoading(false);
            }
        }

        restoreSession();
    }, []);

    // Fetch companies and brands when user logs in directly
    useEffect(() => {
        if (loggedInNow && isCompaniesLoading) {
            fetchCompaniesAndBrands();
        }
    }, [loggedInNow]);

    // Handle role-based access control navigation
    useEffect(() => {
        if (!requiredRole || !user || loggedInNow) return;

        const userRole = user.role;
        let hasAccess = false;

        if (Array.isArray(requiredRole)) {
            hasAccess = requiredRole.includes(userRole);
        } else {
            hasAccess = userRole === requiredRole;
        }

        if (!hasAccess) {
            message.error("You don't have permission to access this page");
            navigate(redirectTo, { replace: true });
        }
    }, [user, requiredRole, redirectTo, navigate, loggedInNow]);

    // When the user directly loggedin skip everthing and render the children
    if (loggedInNow && !isCompaniesLoading) return children;

    if (isLoading || isCompaniesLoading)
        return (
            <div
                style={{
                    height: "100dvh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Spin />
            </div>
        );

    // Return null. if he is not authenticated the useEffect will navigate him
    if (!isAuthenticated) {
        return null;
    }

    // Check role-based access if requiredRole is provided
    if (requiredRole && user) {
        const userRole = user.role;
        let hasAccess = false;

        if (Array.isArray(requiredRole)) {
            hasAccess = requiredRole.includes(userRole);
        } else {
            hasAccess = userRole === requiredRole;
        }

        if (!hasAccess) {
            message.error("You don't have permission to access this page");
            navigate(redirectTo, { replace: true });
            return null;
        }
    }

    return children;
}

export default GateKeeper;
