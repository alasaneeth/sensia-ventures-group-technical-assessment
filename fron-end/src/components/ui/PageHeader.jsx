import { Row, Col } from 'antd';

function PageHeader({ title, rightContent }) {
  return (
    <Row className="mb-4 pb-3 border-bottom" align="middle" justify="space-between">
      <Col>
        <h2 className="m-0">{title}</h2>
      </Col>
      
      {rightContent && (
        <Col>
          {rightContent}
        </Col>
      )}
    </Row>
  );
}

export default PageHeader;
