import { useState } from 'react';
import { DatePicker, Button, Space } from 'antd';
import { EditOutlined, CheckOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { updateConnectionDays } from '../../redux/stateSlices/offersSlice';
import dayjs from 'dayjs';

function EditableDate({ sourceId, targetId, currentDays }) {
    // Convert days to a date by adding days to current date
    const initialDate = dayjs().add(currentDays, 'day');
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const dispatch = useDispatch();

    function handleDateChange(date) {
        if (date) {
            setSelectedDate(date);
            
            // Calculate days difference between now and selected date
            const today = dayjs();
            const daysToAdd = date.diff(today, 'day');
            
            // Ensure we don't have negative days
            const finalDays = Math.max(0, daysToAdd);

            console.log(finalDays);
            
            // Update the store with the new days value.
            dispatch(updateConnectionDays({ sourceId, targetId, daysToAdd: finalDays + 1 }));
        }
    }

    return (
        <Space size="small" className="cursor-pointer">
            <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                size="small"
                style={{ width: '130px' }}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                allowClear={false}
                format="MMM D, YYYY"
                inputReadOnly
                
            />
        </Space>
    );
}

export default EditableDate;
