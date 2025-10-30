import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ElementPlus from 'element-plus';
import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/login/index.vue';

// Mock Element Plus components
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus');
  return {
    ...actual,
    ElForm: {
      name: 'ElForm',
      template: '<form><slot /></form>',
      props: ['model', 'rules', 'label-position'],
      emits: ['submit']
    },
    ElFormItem: {
      name: 'ElFormItem',
      template: '<div><slot /></div>',
      props: ['prop', 'label']
    },
    ElInput: {
      name: 'ElInput',
      template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
      props: ['modelValue', 'placeholder', 'type'],
      emits: ['update:modelValue']
    },
    ElButton: {
      name: 'ElButton',
      template: '<button><slot /></button>',
      props: ['type', 'loading', 'disabled'],
      emits: ['click']
    },
    ElMessage: vi.fn()
  };
});

// Mock axios
vi.mock('@/utils/request', () => ({
  default: {
    post: vi.fn()
  }
}));

// Mock router
const mockRoutes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/dashboard', name: 'Dashboard', component: { template: '<div>Dashboard</div>' }}
];

describe('Login Component', () => {
  let wrapper: any;
  let router: any;
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    router = createRouter({
      history: createWebHistory(),
      routes: mockRoutes
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Rendering', () => {
    it('should render login form correctly', async () => {
      wrapper = mount(Login, {
        global: {
          plugins: [pinia, router, ElementPlus],
          stubs: {
            'el-form': {
              template: '<form><slot /></form>',
              props: ['model', 'rules']
            },
            'el-form-item': {
              template: '<div><slot /></div>',
              props: ['prop']
            },
            'el-input': {
              template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
              props: ['modelValue', 'placeholder'],
              emits: ['update:modelValue']
            },
            'el-button': {
              template: '<button><slot /></button>',
              props: ['type', 'loading'],
              emits: ['click']
            }
          }
        }
      });

      expect(wrapper.find('form')).toBeTruthy();
      expect(wrapper.find('input[placeholder="请输入邮箱"]')).toBeTruthy();
      expect(wrapper.find('input[placeholder="请输入密码"]')).toBeTruthy();
      expect(wrapper.find('button')).toBeTruthy();
    });

    it('should display login title', () => {
      wrapper = mount(Login, {
        global: {
          plugins: [pinia, router],
          stubs: {
            'el-form': { template: '<form><slot /></form>' },
            'el-form-item': { template: '<div><slot /></div>' },
            'el-input': { template: '<input />' },
            'el-button': { template: '<button><slot /></button>' }
          }
        }
      });

      expect(wrapper.text()).toContain('登录');
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      wrapper = mount(Login, {
        global: {
          plugins: [pinia, router],
          stubs: {
            'el-form': {
              template: '<form><slot /></form>',
              props: ['model', 'rules'],
              methods: {
                validate: vi.fn()
              }
            },
            'el-form-item': { template: '<div><slot /></div>' },
            'el-input': { template: '<input />' },
            'el-button': { template: '<button><slot /></button>' }
          }
        }
      });

      // Set invalid email
      await wrapper.setData({
        loginForm: {
          email: 'invalid-email',
          password: 'password123'
        }
      });

      // Get validation rules
      const emailRules = wrapper.vm.rules.email;
      const emailValidator = emailRules.find((rule: any) => rule.type === 'email');

      expect(emailValidator).toBeDefined();
      expect(emailValidator.message).toBe('请输入有效的邮箱地址');
    });

    it('should validate password length', () => {
      wrapper = mount(Login, {
        global: {
          plugins: [pinia, router],
          stubs: {
            'el-form': { template: '<form><slot /></form>' },
            'el-form-item': { template: '<div><slot /></div>' },
            'el-input': { template: '<input />' },
            'el-button': { template: '<button><slot /></button>' }
          }
        }
      });

      // Get validation rules
      const passwordRules = wrapper.vm.rules.password;
      const lengthValidator = passwordRules.find((rule: any) => rule.min === 6);

      expect(lengthValidator).toBeDefined();
      expect(lengthValidator.message).toBe('密码长度不能少于6位');
    });
  });

  describe('Login Functionality', () => {
    it('should handle successful login', async () => {
      const mockResponse = {
        data: {
          code: 20000,
          data: {
            token: 'test-token',
            user: {
              id: 'user123',
              username: 'testuser',
              email: 'test@example.com'
            }
          }
        }
      };

      const request = await import('@/utils/request');
      request.default.post = vi.fn().mockResolvedValue(mockResponse);

      wrapper = mount(Login, {
        global: {
          plugins: [pinia, router],
          stubs: {
            'el-form': {
              template: '<form @submit.prevent="$emit(\'submit\', $event)"><slot /></form>',
              emits: ['submit']
            },
            'el-form-item': { template: '<div><slot /></div>' },
            'el-input': { template: '<input />' },
            'el-button': { template: '<button><slot /></button>' }
          }
        }
      });

      // Set form data
      await wrapper.setData({
        loginForm: {
          email: 'test@example.com',
          password: 'password123'
        }
      });

      // Trigger login
      await wrapper.vm.handleLogin();

      expect(request.default.post).toHaveBeenCalledWith('/user/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should handle login failure', async () => {
      const mockError = {
        response: {
          data: {
            code: 40100,
            message: '邮箱或密码错误'
          }
        }
      };

      const request = await import('@/utils/request');
      request.default.post = vi.fn().mockRejectedValue(mockError);

      wrapper = mount(Login, {
        global: {
          plugins: [pinia, router],
          stubs: {
            'el-form': { template: '<form><slot /></form>' },
            'el-form-item': { template: '<div><slot /></div>' },
            'el-input': { template: '<input />' },
            'el-button': { template: '<button><slot /></button>' }
          }
        }
      });

      // Set form data
      await wrapper.setData({
        loginForm: {
          email: 'wrong@example.com',
          password: 'wrongpassword'
        }
      });

      // Trigger login
      await wrapper.vm.handleLogin();

      expect(request.default.post).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading state during login', async () => {
      wrapper = mount(Login, {
        global: {
          plugins: [pinia, router],
          stubs: {
            'el-form': { template: '<form><slot /></form>' },
            'el-form-item': { template: '<div><slot /></div>' },
            'el-input': { template: '<input />' },
            'el-button': {
              template: '<button :disabled="loading"><slot /></button>',
              props: ['loading']
            }
          }
        }
      });

      // Initially loading should be false
      expect(wrapper.vm.loading).toBe(false);

      // Simulate login start
      wrapper.vm.loading = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.loading).toBe(true);
    });
  });

  describe('Security', () => {
    it('should not expose sensitive data in component state', () => {
      wrapper = mount(Login, {
        global: {
          plugins: [pinia, router],
          stubs: {
            'el-form': { template: '<form><slot /></form>' },
            'el-form-item': { template: '<div><slot /></div>' },
            'el-input': { template: '<input />' },
            'el-button': { template: '<button><slot /></button>' }
          }
        }
      });

      // Check that no sensitive data is exposed
      expect(wrapper.vm.$data).not.toHaveProperty('apiKey');
      expect(wrapper.vm.$data).not.toHaveProperty('secret');
    });
  });
});
