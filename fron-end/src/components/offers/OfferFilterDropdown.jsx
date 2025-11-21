import { Input, Button, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

function OfferFilterDropdown({ setSelectedKeys, selectedKeys, confirm, clearFilters, placeholder = "Search" }) {
    return (
        <div style={{ padding: 8 }}>
            <Input
                placeholder={placeholder}
                value={selectedKeys[0]}
                onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                onPressEnter={() => confirm()}
                style={{ width: 188, marginBottom: 8, display: 'block' }}
            />
            <Space>
                <Button
                    type="primary"
                    onClick={() => confirm()}
                    icon={<SearchOutlined />}
                    size="small"
                    style={{ width: 90 }}
                >
                    Search
                </Button>
                <Button 
                    onClick={() => clearFilters()} 
                    size="small" 
                    style={{ width: 90 }}
                >
                    Reset
                </Button>
            </Space>
        </div>
    );
}

export default OfferFilterDropdown;