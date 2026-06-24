/**
 * 新增指标弹窗
 */
import React from 'react';
import { Modal, Form, Input } from 'antd';
import { useApp } from '../store/AppContext';

const { Item: FormItem } = Form;
const formLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

export default function NewTargetModal({ open, varName, onClose }) {
  const [form] = Form.useForm();
  const { addTarget } = useApp();

  const handleSubmit = async (values) => {
    const ok = await addTarget(varName, values.target);
    if (ok) {
      form.resetFields();
      onClose();
    }
  };

  return (
    <Modal
      title={`给 ${varName} 新增指标`}
      open={open}
      width={600}
      onCancel={onClose}
      okText="保存"
      cancelText="取消"
      okButtonProps={{ htmlType: 'submit', form: 'newTargetForm' }}
      destroyOnHidden
    >
      <Form id="newTargetForm" form={form} onFinish={handleSubmit}>
        <FormItem
          {...formLayout}
          label="指标名称"
          name="target"
          rules={[{ required: true, message: '请输入指标名称' }]}
        >
          <Input placeholder="如：click_submit" />
        </FormItem>
      </Form>
    </Modal>
  );
}
