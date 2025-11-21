import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    Form,
    Input,
    Button,
    Card,
    Typography,
    message,
    Spin,
    Checkbox,
} from "antd";
import {
    UserOutlined,
    LockOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
} from "@ant-design/icons";
import { getSession, login as loginAPI } from "../../api/auth";
import { login, setSession } from "../../redux/stateSlices/auth";

const { Title, Text } = Typography;

function Login() {
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [loading, setLoading] = useState(false);

    const { token } = useSelector((state) => state.auth);

    // Validate the session if exsist. or keep in the same page
    useEffect(() => {
        console.log("running");
        async function retrieveSession() {
            try {
                if (!token) {
                    setLoadingAuth(false);
                    return;
                }

                // If user is already authenticated, redirect to home page

                const session = await getSession(token);
                if (typeof session === "string") {
                    message.error(session);
                    return;
                }

                dispatch(
                    setSession({
                        accessToken: session.token,
                        user: session.user,
                    })
                );

                if (session.user.role === 1) navigate("/");
                if (session.user.role === 2) navigate("/offers-exportation");
                if (session.user.role === 3) navigate("/orders/add");
            } catch (err) {
                message.error("Something went wrong");
            } finally {
                setLoadingAuth(false);
            }
        }

        retrieveSession();
    }, [token, navigate]);

    async function handleSubmit(values) {
        try {
            setLoading(true);
            const response = await loginAPI(values.username, values.password);

            if (typeof response === "string") {
                message.error(response);
                return;
            }

            dispatch(login(response));

            message.success("Login successfully");
            navigate("/");
        } catch (error) {
            message.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    if (loadingAuth)
        return (
            <div
                style={{
                    display: "flex",
                    height: "100dvh",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Spin size="large" />
            </div>
        );

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                background: "#f0f2f5",
            }}
        >
            <Card
                style={{
                    width: 400,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    borderRadius: "8px",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                    <Title level={2} style={{ marginBottom: "8px" }}>
                        Euro Star
                    </Title>
                    <Text type="secondary">Sign in to your account</Text>
                </div>

                <Spin spinning={loadingAuth}>
                    <Form
                        form={form}
                        name="login"
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={{ remember: true }}
                    >
                        <Form.Item
                            name="username"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter your username!",
                                },
                            ]}
                        >
                            <Input
                                prefix={
                                    <UserOutlined
                                        style={{ color: "rgba(0,0,0,.25)" }}
                                    />
                                }
                                placeholder="Username"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: "Please enter your password!",
                                },
                            ]}
                        >
                            <Input.Password
                                prefix={
                                    <LockOutlined
                                        style={{ color: "rgba(0,0,0,.25)" }}
                                    />
                                }
                                placeholder="Password"
                                size="large"
                                iconRender={(visible) =>
                                    visible ? (
                                        <EyeTwoTone />
                                    ) : (
                                        <EyeInvisibleOutlined />
                                    )
                                }
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                block
                                loading={loadingAuth}
                            >
                                Sign In
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>
            </Card>
        </div>
    );
}

export default Login;
