import OrdersTable from "../../components/order/OrdersTable";
import PageHeader from "../../components/ui/PageHeader";

function Orders() {
    return (
        <>
            <PageHeader title="Orders" />
            <OrdersTable />
        </>
    );
}

export default Orders;
