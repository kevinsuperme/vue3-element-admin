/**
 * @description: 表单验证组件测试示例
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { createTestWrapper, simulateInput, simulateClick } from '@/tests/utils/test-helpers';

// 模拟表单组件
const MockFormComponent = {
  template: `
    <el-form ref="formRef" :model="formData" :rules="rules" @submit.prevent="handleSubmit">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="formData.username" data-testid="username-input" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" type="email" data-testid="email-input" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="formData.password" type="password" data-testid="password-input" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="formData.confirmPassword" type="password" data-testid="confirm-password-input" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" data-testid="submit-button">
          提交
        </el-button>
        <el-button @click="resetForm" data-testid="reset-button">
          重置
        </el-button>
      </el-form-item>
    </el-form>
  `,
  props: {
    onSubmit: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      formData: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入密码', trigger: 'blur' },
          {
            validator: (rule: any, value: string, callback: Function) => {
              if (value !== this.formData.password) {
                callback(new Error('两次输入密码不一致'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ]
      }
    };
  },
  methods: {
    async handleSubmit() {
      try {
        await this.$refs.formRef.validate();
        this.loading = true;
        await this.onSubmit(this.formData);
      } catch (error) {
        console.error('表单验证失败:', error);
      } finally {
        this.loading = false;
      }
    },
    resetForm() {
      this.$refs.formRef.resetFields();
    }
  }
};

describe('表单验证组件测试', () => {
  let wrapper: any;
  let mockSubmit: any;

  beforeEach(async () => {
    mockSubmit = vi.fn().mockResolvedValue({ success: true });
    wrapper = await createTestWrapper(MockFormComponent, {
      props: { onSubmit: mockSubmit },
      stubs: {
        'el-form': {
          template: '<form><slot></slot></form>',
          methods: {
            validate: vi.fn().mockResolvedValue(true),
            resetFields: vi.fn(),
            validateField: vi.fn()
          }
        },
        'el-form-item': {
          template: '<div><label><slot name="label"></slot></label><slot></slot></div>'
        },
        'el-input': {
          template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @blur="$emit(\'blur\')" />',
          props: ['modelValue', 'type'],
          emits: ['update:modelValue', 'blur']
        },
        'el-button': {
          template: '<button :disabled="loading" @click="$emit(\'click\')"><slot></slot></button>',
          props: ['type', 'loading', 'disabled'],
          emits: ['click']
        }
      }
    });
  });

  it('应该正确渲染表单组件', () => {
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('[data-testid="username-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="email-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="password-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="confirm-password-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="submit-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reset-button"]').exists()).toBe(true);
  });

  it('应该正确初始化表单数据', () => {
    expect(wrapper.vm.formData.username).toBe('');
    expect(wrapper.vm.formData.email).toBe('');
    expect(wrapper.vm.formData.password).toBe('');
    expect(wrapper.vm.formData.confirmPassword).toBe('');
    expect(wrapper.vm.loading).toBe(false);
  });

  describe('输入验证', () => {
    it('应该验证必填字段', async () => {
      const formRef = wrapper.findComponent({ name: 'ElForm' });

      // 模拟验证失败
      formRef.vm.validate.mockResolvedValue(false);

      await simulateClick(wrapper, '[data-testid="submit-button"]');

      expect(formRef.vm.validate).toHaveBeenCalled();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('应该验证用户名长度', async () => {
      await simulateInput(wrapper, '[data-testid="username-input"]', 'ab'); // 少于3个字符

      const formRef = wrapper.findComponent({ name: 'ElForm' });
      formRef.vm.validate.mockResolvedValue(false);

      await simulateClick(wrapper, '[data-testid="submit-button"]');

      expect(formRef.vm.validateField).toHaveBeenCalledWith('username');
    });

    it('应该验证邮箱格式', async () => {
      await simulateInput(wrapper, '[data-testid="email-input"]', 'invalid-email');

      const formRef = wrapper.findComponent({ name: 'ElForm' });
      formRef.vm.validate.mockResolvedValue(false);

      await simulateClick(wrapper, '[data-testid="submit-button"]');

      expect(formRef.vm.validateField).toHaveBeenCalledWith('email');
    });

    it('应该验证密码长度', async () => {
      await simulateInput(wrapper, '[data-testid="password-input"]', '123'); // 少于6位

      const formRef = wrapper.findComponent({ name: 'ElForm' });
      formRef.vm.validate.mockResolvedValue(false);

      await simulateClick(wrapper, '[data-testid="submit-button"]');

      expect(formRef.vm.validateField).toHaveBeenCalledWith('password');
    });

    it('应该验证密码确认', async () => {
      await simulateInput(wrapper, '[data-testid="password-input"]', 'password123');
      await simulateInput(wrapper, '[data-testid="confirm-password-input"]', 'different');

      const formRef = wrapper.findComponent({ name: 'ElForm' });
      formRef.vm.validate.mockResolvedValue(false);

      await simulateClick(wrapper, '[data-testid="submit-button"]');

      expect(formRef.vm.validateField).toHaveBeenCalledWith('confirmPassword');
    });
  });

  describe('表单提交', () => {
    it('应该在验证通过时提交表单', async () => {
      // 填写有效数据
      await simulateInput(wrapper, '[data-testid="username-input"]', 'testuser');
      await simulateInput(wrapper, '[data-testid="email-input"]', 'test@example.com');
      await simulateInput(wrapper, '[data-testid="password-input"]', 'password123');
      await simulateInput(wrapper, '[data-testid="confirm-password-input"]', 'password123');

      // 模拟验证成功
      const formRef = wrapper.findComponent({ name: 'ElForm' });
      formRef.vm.validate.mockResolvedValue(true);

      await simulateClick(wrapper, '[data-testid="submit-button"]');

      expect(mockSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
    });

    it('应该在提交时显示加载状态', async () => {
      // 模拟异步提交
      mockSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const formRef = wrapper.findComponent({ name: 'ElForm' });
      formRef.vm.validate.mockResolvedValue(true);

      // 点击提交
      await simulateClick(wrapper, '[data-testid="submit-button"]');

      // 检查加载状态
      expect(wrapper.vm.loading).toBe(true);

      // 等待提交完成
      await new Promise(resolve => setTimeout(resolve, 150));
      await nextTick();

      expect(wrapper.vm.loading).toBe(false);
    });

    it('应该处理提交错误', async () => {
      mockSubmit.mockRejectedValue(new Error('提交失败'));

      const formRef = wrapper.findComponent({ name: 'ElForm' });
      formRef.vm.validate.mockResolvedValue(true);

      await simulateClick(wrapper, '[data-testid="submit-button"]');

      // 等待错误处理
      await new Promise(resolve => setTimeout(resolve, 50));
      await nextTick();

      expect(wrapper.vm.loading).toBe(false);
    });
  });

  describe('表单重置', () => {
    it('应该重置表单字段', async () => {
      // 填写一些数据
      await simulateInput(wrapper, '[data-testid="username-input"]', 'testuser');
      await simulateInput(wrapper, '[data-testid="email-input"]', 'test@example.com');

      // 重置表单
      await simulateClick(wrapper, '[data-testid="reset-button"]');

      const formRef = wrapper.findComponent({ name: 'ElForm' });
      expect(formRef.vm.resetFields).toHaveBeenCalled();
    });
  });

  describe('数据绑定', () => {
    it('应该正确双向绑定数据', async () => {
      const usernameInput = wrapper.find('[data-testid="username-input"]');

      await usernameInput.setValue('newusername');
      await usernameInput.trigger('input');

      expect(wrapper.vm.formData.username).toBe('newusername');
    });

    it('应该在表单数据变化时更新输入框', async () => {
      wrapper.vm.formData.username = 'directupdate';
      await nextTick();

      const usernameInput = wrapper.find('[data-testid="username-input"]');
      expect(usernameInput.element.value).toBe('directupdate');
    });
  });

  describe('可访问性', () => {
    it('应该有正确的标签关联', () => {
      const labels = wrapper.findAll('label');
      expect(labels.length).toBeGreaterThan(0);

      // 检查每个标签都有对应的输入框
      labels.forEach((label: any) => {
        const labelText = label.text();
        expect(['用户名', '邮箱', '密码', '确认密码']).toContain(labelText);
      });
    });

    it('应该支持键盘导航', async () => {
      const inputs = wrapper.findAll('input');

      // 测试 Tab 键导航
      await inputs[0].trigger('focus');
      expect(document.activeElement).toBe(inputs[0].element);

      await inputs[0].trigger('keydown', { key: 'Tab' });
      // 注意：在测试环境中，Tab 键的实际行为可能需要手动模拟
    });
  });

  describe('响应式设计', () => {
    it('应该在移动端正确显示', async () => {
      // 模拟移动端视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      window.dispatchEvent(new Event('resize'));
      await nextTick();

      // 检查表单是否仍然正常渲染
      expect(wrapper.find('form').exists()).toBe(true);
    });
  });
});
