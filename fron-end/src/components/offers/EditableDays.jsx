import { useState } from "react";
import { InputNumber, Button, Space, message } from "antd";
import { EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { updateConnectionDays } from "../../redux/stateSlices/offersSlice";

function EditableDays({ sourceId, targetId, currentDays }) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempDays, setTempDays] = useState(currentDays);
    const dispatch = useDispatch();
    const chainData = useSelector((state) => state.offers.chainData);

    function handleEdit() {
        setTempDays(currentDays);
        setIsEditing(true);
    }

    function handleSave() {
        // Check if connection exists
        const sourceIdStr = sourceId?.toString();
        const targetIdStr = targetId?.toString();

        const sourceConnections = chainData.offers[sourceIdStr];
        if (!sourceConnections) {
            message.error("Attach it first");
            console.warn("Attach the node first");
            setIsEditing(false);
            return;
        }

        const connectionExists = sourceConnections.find(
            (conn) => conn.offerId === targetIdStr
        );

        if (!connectionExists) {
            message.error("Attach it first");
            setIsEditing(false);
            return;
        }

        let add = 0;
        if (tempDays >= 0 || tempDays !== null || tempDays !== undefined)
            add = tempDays;

        dispatch(updateConnectionDays({ sourceId, targetId, daysToAdd: add }));
        setIsEditing(false);
    }

    function handleCancel() {
        setTempDays(currentDays);
        setIsEditing(false);
    }

    if (isEditing) {
        return (
            <Space size="small">
                <InputNumber
                    min={0}
                    value={tempDays}
                    onChange={setTempDays}
                    size="small"
                    style={{ width: "80px" }}
                    onPressEnter={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSave();
                        }
                    }}
                />
                <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={handleSave}
                    className="text-success"
                />
                <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={handleCancel}
                    className="text-danger"
                />
            </Space>
        );
    }

    return (
        <Space size="small" className="cursor-pointer" onClick={handleEdit}>
            <span>{currentDays} days</span>
            <EditOutlined className="text-muted" style={{ fontSize: "12px" }} />
        </Space>
    );
}

export default EditableDays;
