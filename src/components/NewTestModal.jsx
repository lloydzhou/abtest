/**
 * 新增实验弹窗
 */
import React from 'react';
import { Modal, Form, Input, Select, Slider, Radio, Alert } from 'antd';
import { useApp } from '../store/AppContext';

const { Item: FormItem } = Form;

const formLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

export default function NewTestModal({ open, defaultLayer, onClose }) {
  const [form] = Form.useForm();
  const { layers = [], layerWeight = {}, addTest } = useApp();
  const selectedLayer = Form.useWatch('layer', form);
  const selectedLayerWeight = selectedLayer
    ? layerWeight[selectedLayer] || { total: 0 }
    : { total: 0 };
  const remainWeight = Math.max(0, 100 - (selectedLayerWeight.total || 0));

  React.useEffect(() => {
    if (open && defaultLayer) {
      form.setFieldValue('layer', defaultLayer);
    }
  }, [open, defaultLayer]);

  const handleSubmit = async (values) => {
    const ok = await addTest(values);
    if (ok) {
      form.resetFields();
      onClose();
    }
  };

  return (
    <Modal
      title="新增实验"
      open={open}
      width={880}
      onCancel={onClose}
      okText="保存"
      cancelText="取消"
      okButtonProps={{ htmlType: 'submit', form: 'newTestForm' }}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={
          selectedLayer
            ? remainWeight > 0
              ? `当前流量层剩余 ${remainWeight}% 流量，创建后可随时调整`
              : '当前流量层流量已占满，可先设为 0% 创建，后续再调整各实验流量分配'
            : '请选择流量层后再分配实验流量'
        }
      />
      <Form id="newTestForm" form={form} onFinish={handleSubmit}>
        <FormItem
          {...formLayout}
          label="流量层名称"
          name="layer"
          rules={[{ required: true, message: '请选择流量层名称' }]}
        >
          <Select
            placeholder="选择流量层"
            options={layers.map((layer) => ({ value: layer, label: layer }))}
          />
        </FormItem>

        <FormItem
          {...formLayout}
          label="使用流量层流量"
          name="layer_weight"
          initialValue={0}
          rules={[
            {
              validator: (_, value = 0) => {
                const layer = form.getFieldValue('layer');
                const lw = layerWeight[layer] || { total: 0 };
                if (!layer) return Promise.reject(new Error('请选择流量层'));
                if (value < 0) return Promise.reject(new Error('流量不能为负'));
                if (value <= 100 - lw.total) return Promise.resolve();
                return Promise.reject(new Error(`流量超出剩余: ${100 - lw.total}`));
              },
            },
          ]}
        >
          <Slider
            min={0}
            max={Math.max(0, remainWeight)}
            marks={{ 0: '0%', [Math.max(0, remainWeight)]: `${remainWeight}%` }}
            tooltip={{ open: true, formatter: (v) => `${v}%`, getPopupContainer: (n) => n.parentElement }}
          />
        </FormItem>

        <FormItem
          {...formLayout}
          label="实验名称"
          name="test_name"
          rules={[{ required: true, message: '请输入实验名称' }]}
        >
          <Input placeholder="实验名称" />
        </FormItem>

        <FormItem
          {...formLayout}
          label="变量名称"
          name="var_name"
          rules={[{ required: true, message: '请输入变量名称' }]}
        >
          <Input placeholder="如：button_color" />
        </FormItem>

        <FormItem
          {...formLayout}
          label="变量类型"
          name="var_type"
          rules={[{ required: true, message: '请选择变量类型' }]}
        >
          <Radio.Group
            options={[
              { value: 'number', label: '数字' },
              { value: 'string', label: '字符串' },
            ]}
          />
        </FormItem>

        <FormItem
          {...formLayout}
          label="变量默认值"
          name="default_value"
          rules={[{ required: true, message: '请输入变量默认值' }]}
        >
          <Input placeholder="默认值" />
        </FormItem>
      </Form>
    </Modal>
  );
}
