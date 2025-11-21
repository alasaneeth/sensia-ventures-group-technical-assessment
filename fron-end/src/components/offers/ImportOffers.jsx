import { useState } from "react";
import { Button, Upload, message, Card, Typography, Space } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { uploadOfferFile } from "../../api/offer";

const { Title } = Typography;

function ImportOffers() {
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);

    // Handle file upload
    async function handleUpload() {
        if (fileList.length === 0) {
            message.warning("Please select a file to upload");
            return;
        }

        const file = fileList[0];
        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        try {
            const result = await uploadOfferFile(formData);
            message.success(`${file.name} uploaded successfully`);
            console.log(result);
            setFileList([]);
        } catch (error) {
            console.error("Error uploading file:", error);
            message.error(`Failed to upload ${file.name}`);
        } finally {
            setLoading(false);
        }
    }

    const uploadProps = {
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file) => {
            setFileList([file]);
            return false; // Prevent auto upload
        },
        fileList,
        accept: ".csv,.xlsx,.xls,.txt,.xlsm",
        maxCount: 1,
    };

    return (
        <Card>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Title level={3}>Import Offers</Title>
                
                <Space direction="vertical" size="middle">
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>
                            Select File (CSV, Excel, or TXT)
                        </Button>
                    </Upload>

                    <Button
                        type="primary"
                        onClick={handleUpload}
                        disabled={fileList.length === 0}
                        loading={loading}
                    >
                        {loading ? "Uploading..." : "Upload"}
                    </Button>
                </Space>
            </Space>
        </Card>
    );
}

export default ImportOffers;