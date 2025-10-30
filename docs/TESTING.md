# Vue3 Element Admin 测试指南

## 📋 目录

- [测试架构概览](#测试架构概览)
- [快速开始](#快速开始)
- [测试类型](#测试类型)
- [编写测试](#编写测试)
- [运行测试](#运行测试)
- [覆盖率报告](#覆盖率报告)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 🏗️ 测试架构概览

### 技术栈

- **测试框架**: Vitest
- **组件测试**: Vue Test Utils
- **测试环境**: jsdom
- **覆盖率**: @vitest/coverage-v8
- **Mock工具**: Vitest内置Mock功能
- **断言库**: Vitest内置断言

### 目录结构

```
tests/
├── unit/                    # 单元测试
│   ├── components/         # 组件测试
│   ├── store/             # 状态管理测试
│   ├── utils/             # 工具函数测试
│   └── api/               # API测试
├── integration/            # 集成测试
├── e2e/                   # 端到端测试
├── utils/                 # 测试工具函数
├── coverage/              # 覆盖率报告
├── results/               # 测试结果
└── setup.ts              # 测试环境配置
```

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 运行所有测试

```bash
npm test
```

### 运行特定类型测试

```bash
# 单元测试
npm run test:unit

# 带覆盖率的单元测试
npm run test:unit:coverage

# 集成测试
npm run test:integration

# 端到端测试
npm run test:e2e
```

## 📝 测试类型

### 1. 单元测试

单元测试用于测试独立的代码单元，如函数、组件或模块。

#### 示例：工具函数测试

```typescript
// tests/unit/utils/validate.test.ts
import { describe, it, expect } from 'vitest'
import { validEmail, isExternal } from '@/utils/validate'

describe('validate.ts', () => {
  describe('validEmail', () => {
    it('应该验证有效邮箱', () => {
      expect(validEmail('test@example.com')).toBe(true)
    })

    it('应该拒绝无效邮箱', () => {
      expect(validEmail('invalid-email')).toBe(false)
    })
  })
})
```

#### 示例：组件测试

```typescript
// tests/unit/components/Button.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MyButton from '@/components/MyButton.vue'

describe('MyButton', () => {
  it('应该正确渲染', () => {
    const wrapper = mount(MyButton, {
      props: { label: 'Click me' }
    })

    expect(wrapper.text()).toBe('Click me')
  })

  it('应该响应点击事件', async () => {
    const wrapper = mount(MyButton)
    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

### 2. 集成测试

集成测试用于测试多个组件或模块协同工作的场景。

```typescript
// tests/integration/login-flow.test.ts
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, it, expect, vi } from 'vitest'
import LoginForm from '@/components/LoginForm.vue'

describe('登录流程集成测试', () => {
  it('应该成功处理登录流程', async () => {
    // 模拟API响应
    const mockLogin = vi.fn().mockResolvedValue({ success: true })

    const wrapper = mount(LoginForm, {
      global: {
        mocks: { $api: { login: mockLogin } }
      }
    })

    // 填写表单并提交
    await wrapper.find('[data-testid="username"]').setValue('admin')
    await wrapper.find('[data-testid="password"]').setValue('123456')
    await wrapper.find('form').trigger('submit')

    expect(mockLogin).toHaveBeenCalledWith({
      username: 'admin',
      password: '123456'
    })
  })
})
```

### 3. API测试

测试API接口的正确性。

```typescript
// tests/unit/api/user.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as userApi from '@/api/user'

// Mock请求模块
vi.mock('@/utils/request')

describe('user API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该发送登录请求', async () => {
    const mockRequest = await import('@/utils/request')
    mockRequest.default.mockResolvedValue({ success: true })

    const result = await userApi.login({
      username: 'admin',
      password: '123456'
    })

    expect(mockRequest.default).toHaveBeenCalledWith({
      url: '/vue-element-admin/user/login',
      method: 'post',
      data: { username: 'admin', password: '123456' }
    })
  })
})
```

## 🛠️ 编写测试

### 测试文件命名

- 单元测试：`*.test.ts` 或 `*.spec.ts`
- 集成测试：`*.integration.test.ts`
- E2E测试：`*.e2e.test.ts`

### 测试结构

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('被测试的功能模块', () => {
  beforeEach(() => {
    // 每个测试前的准备
  })

  afterEach(() => {
    // 每个测试后的清理
  })

  it('应该描述具体的测试场景', () => {
    // 测试代码
    expect(result).toBe(expected)
  })

  it('应该处理边界情况', () => {
    // 边界测试代码
  })
})
```

### Mock使用

```typescript
// Mock函数
const mockFn = vi.fn()
mockFn.mockReturnValue('mocked value')
mockFn.mockResolvedValue({ success: true })
mockFn.mockRejectedValue(new Error('test error'))

// Mock模块
vi.mock('@/api/user', () => ({
  login: vi.fn(),
  getInfo: vi.fn()
}))

// Mock组件
vi.mock('@/components/HeavyComponent', () => ({
  default: { template: '<div>Mocked Component</div>' }
}))
```

### 异步测试

```typescript
it('应该处理异步操作', async () => {
  const result = await fetchData()
  expect(result).toBeDefined()
})

it('应该处理Promise错误', async () => {
  await expect(failingOperation()).rejects.toThrow('Error message')
})
```

## 🔧 运行测试

### 基本命令

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 监听模式运行测试
npm run test:unit:watch

# 生成覆盖率报告
npm run test:unit:coverage

# 运行特定测试文件
npx vitest tests/unit/utils/validate.test.ts

# 运行匹配模式的测试
npx vitest --grep "validate"
```

### 测试脚本

项目提供了统一的测试脚本：

```bash
# 运行完整测试套件
node scripts/test-runner.js all

# 运行CI流程
node scripts/test-runner.js ci

# 生成覆盖率报告
node scripts/test-runner.js coverage
```

### 测试UI界面

```bash
npm run test:ui
```

启动可视化测试界面，可以直观地查看和运行测试。

## 📊 覆盖率报告

### 查看覆盖率

```bash
npm run test:unit:coverage
```

### 覆盖率阈值

配置了以下覆盖率阈值：

- 全局：80%
- 工具函数：90%
- API：85%
- 组件：75%
- 页面：70%

### 覆盖率报告位置

- HTML报告：`tests/coverage/index.html`
- JSON报告：`tests/coverage/coverage-final.json`
- LCov报告：`tests/coverage/lcov.info`

## 🎯 最佳实践

### 1. 测试原则

- **AAA模式**：Arrange（准备）、Act（执行）、Assert（断言）
- **单一职责**：每个测试只验证一个功能点
- **独立性**：测试之间不应该相互依赖
- **可重复**：测试结果应该是一致的

### 2. 命名规范

```typescript
// ✅ 好的命名
it('应该在用户输入无效邮箱时显示错误信息')
it('应该正确计算购物车总价')

// ❌ 不好的命名
it('测试1')
it('login test')
```

### 3. 测试数据

```typescript
// 使用常量定义测试数据
const TEST_DATA = {
  VALID_USER: {
    username: 'admin',
    email: 'admin@example.com'
  },
  INVALID_EMAIL: 'invalid-email'
}
```

### 4. 组件测试最佳实践

```typescript
// ✅ 测试用户行为
it('应该在点击按钮时触发事件', async () => {
  const wrapper = mount(MyComponent)
  await wrapper.find('button').trigger('click')
  expect(wrapper.emitted('click')).toBeTruthy()
})

// ✅ 测试props变化
it('应该在props变化时更新显示', async () => {
  const wrapper = mount(MyComponent, { props: { count: 1 } })
  await wrapper.setProps({ count: 2 })
  expect(wrapper.text()).toContain('2')
})

// ❌ 避免测试实现细节
it('不应该测试内部方法名') // 不要这样做
```

### 5. 异步测试

```typescript
// ✅ 使用async/await
it('应该异步加载数据', async () => {
  const wrapper = mount(AsyncComponent)
  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toContain('Loaded data')
})

// ✅ 测试加载状态
it('应该显示加载指示器', async () => {
  const wrapper = mount(AsyncComponent)
  expect(wrapper.find('.loading').exists()).toBe(true)
})
```

## ❓ 常见问题

### Q: 测试运行很慢怎么办？

A:
- 使用`vitest watch`模式进行增量测试
- 合理使用Mock避免真实API调用
- 并行运行测试

### Q: 如何测试Vue组件的样式？

A:
```typescript
it('应该应用正确的CSS类', () => {
  const wrapper = mount(MyComponent, { props: { type: 'primary' } })
  expect(wrapper.classes()).toContain('btn-primary')
})
```

### Q: 如何测试路由相关功能？

A:
```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: Home }]
})

const wrapper = mount(MyComponent, {
  global: { plugins: [router] }
})
```

### Q: 如何测试Pinia store？

A:
```typescript
import { createPinia, setActivePinia } from 'pinia'

beforeEach(() => {
  setActivePinia(createPinia())
})

it('应该正确更新状态', () => {
  const store = useMyStore()
  store.updateValue('test')
  expect(store.value).toBe('test')
})
```

### Q: 覆盖率不达标怎么办？

A:
- 为未覆盖的代码路径添加测试
- 重点测试边界条件和错误处理
- 使用分支测试确保所有条件都被测试

## 📚 延伸阅读

- [Vitest官方文档](https://vitest.dev/)
- [Vue Test Utils文档](https://test-utils.vuejs.org/)
- [JavaScript测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## 🤝 贡献指南

欢迎提交测试相关的PR和Issue！请确保：

1. 新功能包含相应的测试
2. 测试覆盖率不降低
3. 遵循项目的测试规范
4. 提交前运行`npm run test:ci`确保所有测试通过