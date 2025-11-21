import { Handle, Position } from "@xyflow/react";
import { Card, Button, Tooltip, Typography } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import {
    removeNodeFromChain,
    setNodeReturnAddress,
} from "../../redux/stateSlices/offersSlice";
import EditableDays from "./EditableDays";
import AddressDropdownMenu from "../address/AddressDropdownMenu";
const { Text } = Typography;

function OfferCard({ data, isConnectable }) {
    const dispatch = useDispatch();
    // Handle removing an offer from the chain
    function handleRemoveOffer(id) {
        dispatch(removeNodeFromChain(id));
    }

    // Handle selecting a return address for the offer
    function handleAddressSelect(address) {
        if (address && data.id) {
            dispatch(
                setNodeReturnAddress({
                    nodeId: data.id,
                    returnAddress: address,
                })
            );
        }
    }

    console.log(("HERE ",data.type ));

    return (
        <Card
            size="small"
            title={data.title || `Offer ${data.offerId}`}
            extra={
                <Tooltip title="Remove from chain">
                    <Button
                        type="text"
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleRemoveOffer(data.id)}
                    />
                </Tooltip>
            }
            className="border border-success rounded shadow-sm"
            style={{
                minWidth: 250,
            }}
        >
            <div className="mb-2">
                <Text strong>Title: </Text>
                <Text>{data.title}</Text>
            </div>
            {data.type && (
                <div className="mb-2">
                    <Text strong>Type: </Text>
                    <Text 
                        style={{ 
                            color: data.type === "offer" ? "#52c41a" : "#faad14",
                            fontWeight: 500
                        }}
                    >
                        {data.type === "offer" ? "Offer" : 
                         data.type === "complaint" ? "Client Service" : 
                         data.type === "payment-reminder" ? "Payment Reminder" : data.type}
                    </Text>
                </div>
            )}
            {data.description && (
                <div className="mb-2">
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                        {data.description}
                    </Text>
                </div>
            )}
            {!data.isFirst && (
                <div className="mb-3">
                    <Text strong>Days to activate (After order date): </Text>
                    <EditableDays
                        sourceId={data.sourceId}
                        targetId={data.id}
                        currentDays={data.daysToAdd || 0}
                    />
                </div>
            )}

            {/* <div className="mb-2">
                <Text strong>Return Address: </Text>
                <AddressDropdownMenu
                    onSelect={handleAddressSelect}
                    selectedValue={data.returnAddress?.id}
                    placeholder="Select return address"
                    inPopup={true}
                />
            </div> */}

            {/* Input handle - hide for first offer */}
            {!data.isFirst && (
                <Handle
                    type="target"
                    position={Position.Top}
                    className="bg-danger rounded-circle border border-2 border-white"
                    style={{
                        width: 12,
                        height: 12,
                    }}
                    isConnectable={isConnectable}
                />
            )}

            {/* Output handle - only show for offers (not for complaint/payment-reminder) */}
            {/* {data.type === "offer" || data.isFirst && ( */}
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="bg-success rounded-circle border border-2 border-white"
                    style={{
                        width: 12,
                        height: 12,
                    }}
                    isConnectable={isConnectable}
                />
            {/* )} */}
        </Card>
    );
}

export default OfferCard;
