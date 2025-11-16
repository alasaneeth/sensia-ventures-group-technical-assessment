import React from 'react';
import { Modal, Spin } from 'antd';

const ModalForm = ({
  title,
  open,
  onCancel,
  children,
  loading = false,
  width = 600,
  destroyOnClose = true,
  submitButton = null,
  cancelButton = null,
  showFooter = true,
}) => {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      width={width}
      destroyOnClose={destroyOnClose}
      footer={showFooter ? [cancelButton, submitButton] : null}
      maskClosable={!loading}
      closable={!loading}
    >
      <Spin spinning={loading}>
        {children}
      </Spin>
    </Modal>
  );
};

export default ModalForm;