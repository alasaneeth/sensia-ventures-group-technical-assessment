import { useState } from 'react';
import { Card, Timeline, Typography, Input, Row, Col, InputNumber, Button } from 'antd';
import { SearchOutlined, ClearOutlined, LoadingOutlined, CheckOutlined } from '@ant-design/icons';
import SequenceCard from './SequenceCard';

const { Title, Text } = Typography;

// ---> Don't use it <---
function ChainSequencesTimeline({ sequences = [], activeAtIndex=-1 }) {
    const [searchText, setSearchText] = useState('');
    const [sequenceIdFilter, setSequenceIdFilter] = useState(null);
    const [offerIdFilter, setOfferIdFilter] = useState(null);
    
    // Filter sequences based on search text and ID filters
    const filteredSequences = sequences.filter(sequence => {
        // Text search in title or description
        const matchesSearch = searchText === '' || 
            (sequence.offerData?.title?.toLowerCase().includes(searchText.toLowerCase()) || 
             sequence.offerData?.description?.toLowerCase().includes(searchText.toLowerCase()));
        
        // Filter by sequence ID
        const matchesSequenceId = sequenceIdFilter === null || 
            sequence.sequenceId === sequenceIdFilter.toString();
        
        // Filter by offer ID
        const matchesOfferId = offerIdFilter === null || 
            sequence.offerId === offerIdFilter.toString();
        
        return matchesSearch && matchesSequenceId && matchesOfferId;
    });
    
    function handleClearFilters() {
        setSearchText('');
        setSequenceIdFilter(null);
        setOfferIdFilter(null);
    }
    
    return (
        <Card title="Offer Sequences" className="mt-4">
            {/* Filter controls */}
            <div className="mb-4">
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={8} lg={8}>
                        <Input 
                            placeholder="Search offer title or description" 
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={12} sm={6} md={4} lg={4}>
                        <InputNumber 
                            placeholder="Sequence ID" 
                            className="w-100"
                            value={sequenceIdFilter}
                            onChange={value => setSequenceIdFilter(value)}
                            min={1}
                        />
                    </Col>
                    <Col xs={12} sm={6} md={4} lg={4}>
                        <InputNumber 
                            placeholder="Offer ID" 
                            className="w-100"
                            value={offerIdFilter}
                            onChange={value => setOfferIdFilter(value)}
                            min={1}
                        />
                    </Col>
                    <Col xs={24} sm={6} md={4} lg={4}>
                        <Button 
                            icon={<ClearOutlined />} 
                            onClick={handleClearFilters}
                            disabled={!searchText && sequenceIdFilter === null && offerIdFilter === null}
                        >
                            Clear Filters
                        </Button>
                    </Col>
                </Row>
            </div>
            
            {/* Results count */}
            <div className="mb-3">
                <Text>
                    Showing {filteredSequences.length} of {sequences.length} sequences
                </Text>
            </div>
            
            {sequences && sequences.length > 0 ? (
                filteredSequences.length > 0 ? (
                    <Timeline className="mt-4">
                        {sequences.map((sequence, index) => {
                            // Only render if this sequence is in the filtered list
                            if (!filteredSequences.some(s => s.sequenceId === sequence.sequenceId)) {
                                return null;
                            }
                            
                            // Check if this is the last visible sequence
                            const isLast = index === sequences.length - 1 || 
                                !filteredSequences.some(s => s.sequenceId === sequences[index + 1]?.sequenceId);
                            
                            return (
                                <Timeline.Item
                                    key={sequence.sequenceId}
                                    dot={
                                        <div className={`${index <= activeAtIndex ? 'bg-success' : 'bg-primary'} text-white rounded-circle d-flex align-items-center justify-content-center`}
                                             style={{ width: '24px', height: '24px', fontSize: '12px', fontWeight: 'bold' }}>
                                            {
                                                index === activeAtIndex ? 
                                                <LoadingOutlined /> : 
                                                index < activeAtIndex ? 
                                                    <CheckOutlined /> : 
                                                    index + 1
                                            }
                                        </div>
                                    }
                                >
                                    <SequenceCard 
                                        sequence={sequence} 
                                        isLast={isLast} 
                                    />
                                </Timeline.Item>
                            );
                        })}
                    </Timeline>
                ) : (
                    <div className="text-center py-5">
                        <Text type="secondary">No matching sequences found</Text>
                    </div>
                )
            ) : (
                <div className="text-center py-5">
                    <Text type="secondary">No offer sequences found for this chain</Text>
                </div>
            )}
        </Card>
    );
}

export default ChainSequencesTimeline;
