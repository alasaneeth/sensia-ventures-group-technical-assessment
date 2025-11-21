import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import PaymentMethodsList from '../../components/paymentMethods/PaymentMethodsList';
import AddPaymentMethod from '../../components/paymentMethods/AddPaymentMethod';

function PaymentMethods() {
    const [activeTab, setActiveTab] = useState('list');

    const handleTabChange = (key) => {
        setActiveTab(key);
    };

    const items = [
        {
            key: 'list',
            label: 'Payment Methods List',
            children: <PaymentMethodsList />,
        },
        {
            key: 'add',
            label: 'Add Payment Method',
            children: <AddPaymentMethod onSuccess={() => setActiveTab('list')} />,
        },
    ];

    return (
        <Card title="Payment Methods Management">
            <Tabs 
                activeKey={activeTab} 
                onChange={handleTabChange} 
                items={items}
                type="card"
            />
        </Card>
    );
}

export default PaymentMethods;