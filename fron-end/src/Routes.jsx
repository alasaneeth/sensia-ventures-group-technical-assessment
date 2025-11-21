import { Navigate } from "react-router-dom";
import Campaign from "./pages/campaign/Campaign";
import AddCampaign from "./pages/campaign/AddCampaign";
import EditCampaign from "./pages/campaign/EditCampaign";
import AppLayout from "./components/ui/AppLayout";
import Offers from "./pages/offer/Offers";
import AddOffer from "./pages/offer/AddOffer";
import Chain from "./pages/chain/Chain";
import ChainDetail from "./pages/chain/ChainDetail";
import Clients from "./pages/client/Clients";
import AddClient from "./pages/client/AddClient";
import PlaceOrder from "./pages/order/PlaceOrder";
import Orders from "./pages/order/Orders";
import OffersExportation from "./pages/offer/OffersExportation";
// import Sku from "./pages/sku/Sku";
// import AddSku from "./pages/sku/AddSku";
import Address from "./pages/setting/Address";
import AddAddress from "./pages/setting/AddAddress";
import PayeeName from "./pages/setting/PayeeName";
import AddPayeeName from "./pages/setting/AddPayeeName";
import ImportTable from "./components/clients/ImportTable";
import ClientsExtract from "./pages/client/ClientsExtract";
import EncrolledClients from "./pages/client/EncrolledClients";
import ImportOffers from "./components/offers/ImportOffers";
import Login from "./pages/auth/Login";
import GateKeeper from "./components/ui/GateKeeper";
import OrdersSummary from "./pages/order/OrdersSummary";
import Invoices from "./pages/accounting/Invoices";
import AddInovice from "./pages/accounting/AddInovice";
import Payments from "./pages/accounting/Payments";
import AddPayment from "./pages/accounting/AddPayment";
import AccountingMain from "./pages/accounting/Main";
import Summary from "./pages/accounting/Summary";
import NotFound from "./pages/NotFound";
import SettingMain from "./pages/setting/Main";
import Shipments from "./pages/setting/Shipments";
import PaymentMethods from "./pages/setting/PaymentMethods";
import Countries from "./pages/setting/Countries";
import DevComments from "./pages/dev/DevComments";
import CampaignMain from "./pages/campaign/Main";
import CampaignKeyCodes from "./pages/campaign/CampaignKeyCodes";
import Companies from "./pages/company/Companies";
import AddCompany from "./pages/company/AddCompany";
import ProductMain from "./pages/products/ProductMain";
import ProductList from "./pages/products/ProductList";
import ProductVariationList from "./pages/products/ProductVariationList";
import AddProduct from "./pages/products/AddProduct";
import AddProductVariation from "./pages/products/AddProductVariation";
import CategoryList from "./pages/products/CategoryList";
import AddCategory from "./pages/products/AddCategory";
import SkuMain from "./pages/skus/SkuMain";
import SkuList from "./pages/skus/SkuList";
import AddSku from "./pages/skus/AddSku";
import BundleSkuList from "./pages/skus/BundleSkuList";
import AddBundleSku from "./pages/skus/AddBundleSku";
// Define all routes here. You are responsible of making sure the route name is unique otherwise you will face undefined behavior
// Note that the key is the path here. want to add it by yourself make sure to update AllRoutes component

// it's good to note that whenever you go nested no need to add page not found route. it will be automatically added.
const routes = [
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/",
        element: (
            <GateKeeper>
                <AppLayout />
            </GateKeeper>
        ),
        children: [
            {
                path: "/",
                index: true,
                element: <Navigate to="/campaigns" replace={false} />,
            },
            {
                path: "/dev-comments",
                element: <DevComments />,
            },
            {
                path: "/campaigns",
                element: <CampaignMain />,
                children: [
                    {
                        index: true,
                        element: <Campaign />,
                    },
                    {
                        path: "/campaigns/add",
                        element: <AddCampaign />,
                    },
                    {
                        path: "/campaigns/:id",
                        element: <EditCampaign />,
                    },
                    {
                        path: "/campaigns/:id/keycodes",
                        element: <CampaignKeyCodes />,
                    },
                ],
            },

            {
                path: "/payment-methods",
                element: <PaymentMethods />,
            },
            {
                path: "/offers",
                element: <Offers />,
            },
            {
                path: "/offers/add",
                element: <AddOffer />,
            },
            {
                path: "/offers/import",
                element: <ImportOffers />,
            },
            {
                path: "/offers-chains",
                element: <Chain />,
            },
            {
                path: "/offers-chains/:id",
                element: <ChainDetail />,
            },
            {
                path: "/database",
                element: <Clients />,
            },
            {
                path: "/database/add",
                element: <AddClient />,
            },
            {
                path: "/database/extract",
                element: <ClientsExtract />,
            },
            {
                path: "/database/enroll",
                element: <EncrolledClients />,
            },
            {
                path: "/database/import",
                element: <ImportTable />,
            },
            {
                path: "/offers-exportation",
                element: <OffersExportation />,
            },
            {
                path: "/orders",
                element: <Orders />,
            },
            {
                path: "/orders/add",
                element: <PlaceOrder />,
            },
            {
                path: "/orders/summary",
                element: <OrdersSummary />,
            },
            {
                path: "/addresses",
                element: <SettingMain />,
                children: [
                    {
                        index: true,
                        element: <Address />,
                    },
                    {
                        path: "/addresses/add-address",
                        element: <AddAddress />,
                    },
                    {
                        path: "/addresses/shipments",
                        element: <Shipments />,
                    },
                ],
            },
            {
                path: "/skus",
                element: <SkuMain />,
                children: [
                    {
                        index: true,
                        element: <SkuList />,
                    },
                    {
                        path: "/skus/add-sku",
                        element: <AddSku />,
                    },
                    {
                        path: "/skus/bundle-skus",
                        element: <BundleSkuList />,
                    },
                    {
                        path: "/skus/add-bundle-sku",
                        element: <AddBundleSku />,
                    },
                ],
            },
            {
                path: "/countries",
                element: <Countries />,
            },
            {
                path: "/payee-names",
                element: <PayeeName />,
            },
            {
                path: "/payee-names/add",
                element: <AddPayeeName />,
            },
            {
                path: "/companies",
                element: (
                    <GateKeeper requiredRole={99}>
                        <Companies />
                    </GateKeeper>
                ),
            },
            {
                path: "/companies/add",
                element: (
                    <GateKeeper requiredRole={99}>
                        <AddCompany />
                    </GateKeeper>
                ),
            },
            {
                path: "/products",
                element: <ProductMain />,
                children: [
                    {
                        path: "/products/products",
                        element: <ProductList />,
                    },
                    {
                        path: "/products/add-product",
                        element: <AddProduct />,
                    },
                    {
                        path: "/products/product-variations",
                        element: <ProductVariationList />,
                    },
                    {
                        path: "/products/add-product-variation",
                        element: <AddProductVariation />,
                    },
                    {
                        path: "/products/categories",
                        element: <CategoryList />,
                    },
                    {
                        path: "/products/add-category",
                        element: <AddCategory />,
                    },
                ],
            },
            {
                path: "/accounting",
                element: <AccountingMain />,
                children: [
                    {
                        path: "/accounting/invoices",
                        element: <Invoices />,
                    },
                    {
                        path: "/accounting/add-invoice",
                        element: <AddInovice />,
                    },
                    {
                        path: "/accounting/payments",
                        element: <Payments />,
                    },
                    {
                        path: "/accounting/add-payment",
                        element: <AddPayment />,
                    },
                    {
                        path: "/accounting/summary",
                        element: <Summary />,
                    },
                ],
            },
            {
                path: "*",
                element: <NotFound />,
            },
        ],
    },
];

// Helper function to add not found page recursively for each children property
function injectNotFoundPage(routes) {
    if (!Array.isArray(routes)) throw new Error("Routes must be an array");

    for (let i = 0; i < routes.length; i++) {
        if (routes[i].children) {
            console.log(
                "Found a children array for route with path: [",
                routes[i].path,
                "]. Start injection not found page"
            );
            routes[i].children.push({
                path: "*",
                element: <NotFound />,
            });
            injectNotFoundPage(routes[i].children);
        }
    }
}

// Inject before export
injectNotFoundPage(routes);

export default routes;
