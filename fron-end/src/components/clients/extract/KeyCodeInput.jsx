import { Input, Form } from "antd";

/**
 * KeyCodeInput component for entering key codes
 * @param {Object} props
 * @param {Object} props.value - Current value of the input
 * @param {Function} props.onChange - Function to call when input changes
 */
function KeyCodeInput({ value, onChange }) {
    return (
        <Form.Item label="Key Code" className="key-code-input">
            <Input
                placeholder="Enter key code"
                value={value?.value}
                onChange={(e) =>
                    onChange({ value: e.target.value, keyCodeExists: false })
                }
            />
        </Form.Item>
    );
}

export default KeyCodeInput;
