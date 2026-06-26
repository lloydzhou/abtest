/**
 * 新增版本弹窗
 */
import React from 'react';
import { Modal, Form, Input, Slider, Alert } from 'antd';
import { useApp } from '../store/AppContext';

const { Item: FormItem } = Form;
const formLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

export default function NewVersionModal({ open, experiment, onClose }) {
  const [form] = Form.useForm();
  const { testWeight, editVersionWeight } = useApp();

  const varName = experiment?.var_name;
  const testName = experiment?.name || '';
  const usedWeight = experiment ? experiment.weight : 0;
  const remainWeight = Math.max(0, 100 - usedWeight);

  const handleSubmit = async (values) => {
    const { value, weight, name = '' } = values;
    const ok = await editVersionWeight(varName, value, weight, name || value);
    if (ok) {
      form.resetFields();
      onClose();
    }
  };

  return (
    <Modal
      title={`给 ${testName} 新增版本`}
      open={open}
      width={600}
      onCancel={onClose}
      okText="保存"
      cancelText="取消"
      okButtonProps={{ htmlType: 'submit', form: 'newVersionForm' }}
      destroyOnHidden
      maskClosable={false}
    >
      {remainWeight === 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="实验流量已占满，可先设为 0% 创建版本，后续再调整各版本流量分配"
        />
      )}
      <Form id="newVersionForm" form={form} onFinish={handleSubmit}>
        <FormItem
          {...formLayout}
          label="变量取值"
          name="value"
          rules={[
            { required: true, message: '请输入变量取值' },
            {
              validator: (_, value) => {
                const weights =
                  testWeight[varName] ? testWeight[varName].weight : [];
                if (weights.map((w) => w.value).indexOf(value) > -1) {
                  return Promise.reject(new Error('变量取值重复'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder="如：red" />
        </FormItem>

        <FormItem
          {...formLayout}
          label="使用实验流量"
          name="weight"
          initialValue={0}
          rules={[
            {
              validator: (_, value = 0) => {
                if (value < 0) return Promise.reject(new Error('流量不能为负'));
                if (value <= 100 - usedWeight) return Promise.resolve();
                return Promise.reject(new Error(`流量超出剩余: ${100 - usedWeight}`));
              },
            },
          ]}
        >
          <Slider
            min={0}
            max={remainWeight}
            marks={{ 0: '0%', [remainWeight]: `${remainWeight}%` }}
            tooltip={{ open: true, formatter: (v) => `${v}%`, getPopupContainer: (n) => n.parentElement }}
          />
        </FormItem>

        <FormItem {...formLayout} label="版本名称" name="name">
          <Input placeholder="可选" />
        </FormItem>
      </Form>
    </Modal>
  );
}
