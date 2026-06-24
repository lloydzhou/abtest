/**
 * 新增流量层弹窗
 */
import React from 'react';
import { Modal, Form, Input } from 'antd';
import { useApp } from '../store/AppContext';

const { Item: FormItem } = Form;
const formLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

export default function NewLayerModal({ open, onClose }) {
  const [form] = Form.useForm();
  const { addLayer } = useApp();

  const handleSubmit = async (values) => {
    const ok = await addLayer(values.layer);
    if (ok) {
      form.resetFields();
      onClose();
    }
  };

  return (
    <Modal
      title="新增流量层"
      open={open}
      width={600}
      onCancel={onClose}
      okText="保存"
      cancelText="取消"
      okButtonProps={{ htmlType: 'submit', form: 'newLayerForm' }}
      destroyOnHidden
    >
      <Form id="newLayerForm" form={form} onFinish={handleSubmit}>
        <FormItem
          {...formLayout}
          label="流量层名称"
          name="layer"
          rules={[{ required: true, message: '请输入流量层名称' }]}
        >
          <Input placeholder="如：L1" />
        </FormItem>
      </Form>
    </Modal>
  );
}
