# Vue3 Element Admin - 主规则文档

> **核心规范 - AI必读**
>
> 版本: v2.0.0 | 更新: 2025-10-30 | 优先级: ⭐⭐⭐⭐⭐

---

## 🎯 规则优先级说明

本文档使用RFC 2119标准定义优先级：

```yaml
🔴 MUST (必须):     违反将导致错误或安全问题 - 严格遵守
🟡 SHOULD (应该):   强烈推荐的最佳实践 - 默认遵守
🟢 MAY (可选):      根据场景灵活选择 - 自行判断
❌ MUST NOT (禁止): 严重违反项目规范 - 绝对禁止
```

---

## 📋 快速决策树

```
我要做什么？
├─ 创建新页面      → 跳转到 [§4.1 页面创建流程]
├─ 创建新组件      → 跳转到 [§4.2 组件创建流程]
├─ 调用API        → 跳转到 [§4.3 API调用流程]
├─ 使用Store      → 跳转到 [§4.4 状态管理流程]
├─ 编写样式        → 跳转到 [§4.5 样式编写流程]
└─ 命名不确定      → 跳转到 [§2 命名规范]

遇到问题？
├─ 类型错误        → 参考 [§3.2 TypeScript规范]
├─ 样式冲突        → 参考 [§3.3 样式规范]
├─ 性能问题        → 参考 [§5 性能标准]
└─ 代码审查        → 参考 [§6 检查清单]
```

---

## 1. 项目技术栈 (2025-10-30)

```yaml
🔴 MUST - 核心框架:
  Vue: 3.5.18          # Composition API优先
  TypeScript: 5.9.3    # 严格模式required
  Vite: 6.3.7          # 构建工具

🔴 MUST - UI框架:
  Element Plus: 2.11.5
  SCSS: 1.89.2         # CSS预处理器

🔴 MUST - 状态管理:
  Pinia: 3.0.3         # 替代Vuex

🔴 MUST - 路由:
  Vue Router: 4.5.1

🔴 MUST - HTTP:
  Axios: 1.11.0
```

---

## 2. 命名规范

### 2.1 文件命名

| 类型 | 规则 | 示例 | 优先级 |
|------|------|------|--------|
| 组件 | PascalCase | `UserProfile/index.vue` | 🔴 MUST |
| Composable | camelCase+use前缀 | `usePermission.ts` | 🔴 MUST |
| Utils | camelCase | `formatDate.ts` | 🔴 MUST |
| Types | PascalCase | `User.ts` | 🔴 MUST |
| Store | camelCase+Store后缀 | `userStore.ts` | 🔴 MUST |
| View | PascalCase | `UserManagement/index.vue` | 🔴 MUST |

### 2.2 变量命名

```typescript
// 🔴 MUST - 常量使用UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'https://api.example.com'

// 🔴 MUST - 变量/函数使用camelCase
const userName = 'John'
function fetchUserData() {}

// 🔴 MUST - 类/接口使用PascalCase
class UserService {}
interface UserInfo {}

// 🟡 SHOULD - 布尔值使用is/has/can前缀
const isLoading = ref(false)
const hasPermission = computed(() => true)

// 🔴 MUST - 私有成员使用下划线前缀
class Service {
  private _cache = new Map()
}

// ❌ MUST NOT
const UserName = 'John'      // 变量禁用PascalCase
const is_loading = false     // 禁用snake_case
```

### 2.3 组件命名

```typescript
// 🔴 MUST - 使用defineOptions设置组件名
defineOptions({
  name: 'UserProfile'  // PascalCase, 与文件名一致
})

// 🟡 SHOULD - 多词组件名
defineOptions({
  name: 'UserProfileCard'  // ✅ 避免与HTML元素冲突
})

// ❌ MUST NOT - 单词组件名
defineOptions({
  name: 'Profile'  // ❌ 可能与HTML元素冲突
})
```

---

## 3. 核心编码规范

### 3.1 代码格式

```typescript
// 🔴 MUST遵守的格式规则:
// ✅ 2空格缩进
// ✅ 单引号
// ✅ 无分号
// ✅ 尾随逗号
// ✅ 箭头函数单参数无括号

// 示例:
const user = {
  name: 'John',
  age: 30,
  roles: ['admin'],
}

const double = n => n * 2  // ✅ 单参数无括号
```

### 3.2 TypeScript规范

```typescript
// 🔴 MUST - 严格类型，避免any
interface UserInfo {
  id: string          // ✅ 明确类型
  name: string
  age?: number        // ✅ 可选属性用?
}

// 🟡 SHOULD - 使用类型推导
const count = ref(0)           // ✅ 自动推导number
const user = ref<UserInfo>()   // ✅ 复杂类型显式声明

// ❌ MUST NOT - 使用any
const data: any = {}           // ❌ 除特殊情况外禁用

// 🔴 MUST - 导出所有类型
export interface UserInfo {}  // ✅ 类型必须导出
export type ApiResponse<T> = {}
```

### 3.3 样式规范

```scss
// 🔴 MUST - 使用SCSS
// 🔴 MUST - 使用Scoped样式
// 🔴 MUST - 使用BEM命名或嵌套

<style lang="scss" scoped>
// ✅ 方式1: BEM命名
.user-card__header {}
.user-card__body {}
.user-card--large {}

// ✅ 方式2: SCSS嵌套（推荐）
.user-card {
  .header {}  // 编译为 .user-card .header
  .body {}

  &--large {}  // 编译为 .user-card--large
}

// 🔴 MUST - 嵌套最多3层
.user-card {
  .header {
    .title {
      // ✅ 3层OK
    }
  }
}

// ❌ MUST NOT - 超过3层嵌套
// ❌ MUST NOT - 使用ID选择器
#user-card {}  // ❌ 禁止
</style>
```

---

## 4. 核心工作流程

### 4.1 创建新页面

```vue
<!-- 📁 src/views/NewPage/index.vue -->
<template>
  <div class="new-page-container">
    <el-card v-loading="isLoading">
      <!-- 页面内容 -->
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 🔴 MUST - 设置组件名
defineOptions({
  name: 'NewPage',
})

// 🟡 SHOULD - 添加loading状态
const isLoading = ref(false)

// 🟡 SHOULD - 使用onMounted初始化
onMounted(() => {
  // 初始化逻辑
})
</script>

<style lang="scss" scoped>
.new-page-container {
  padding: 20px;
}
</style>
```

### 4.2 创建新组件

```vue
<!-- 组件结构 - 必须按此顺序 -->
<template>
  <!-- 🔴 MUST - 单一根元素 -->
  <div class="component-name">
    <!-- 内容 -->
  </div>
</template>

<script setup lang="ts">
// === 1. 导入 ===
import { ref, computed } from 'vue'

// === 2. Props ===
interface Props {
  title: string        // 🔴 MUST - 类型定义
  count?: number       // 🟡 SHOULD - 可选属性
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,  // 默认值
})

// === 3. Emits ===
interface Emits {
  (e: 'update', value: string): void
}

const emit = defineEmits<Emits>()

// === 4. State ===
const isLoading = ref(false)

// === 5. Computed ===
const displayTitle = computed(() => props.title)

// === 6. Methods ===
function handleClick() {
  emit('update', 'new value')
}

// === 7. Lifecycle ===
// (如需要)

// === 8. Expose ===
defineExpose({
  refresh: handleClick,
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.component-name {
  // 样式
}
</style>
```

**组件复杂度标准**:

```yaml
🔴 MUST遵守:
  - 单文件 < 500行
  - props数量 < 15个
  - 方法数量 < 20个

🟡 SHOULD遵守:
  - 单文件 < 300行
  - props数量 < 10个
  - 方法数量 < 15个

超出标准: 立即拆分组件
```

### 4.3 API调用流程

```typescript
// 📁 src/api/moduleName.ts

// === 1. 类型定义 ===
export interface DataItem {
  id: string
  name: string
}

// === 2. API函数 ===
// 🔴 MUST - 使用request实例
// 🔴 MUST - 明确返回类型
import request from './request'

export function getData() {
  return request<ApiResponse<DataItem[]>>({
    url: '/data',
    method: 'get',
  })
}

// === 3. 组件中使用 ===
// 🟡 SHOULD - 使用composable封装（推荐）
async function fetchData() {
  isLoading.value = true
  try {
    const { data } = await getData()
    list.value = data
  } catch (error) {
    ElMessage.error('获取数据失败')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
```

### 4.4 状态管理流程

```typescript
// 📁 src/store/modules/moduleName.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 🔴 MUST - 命名: use + 模块名 + Store
export const useModuleStore = defineStore('module', () => {
  // === State ===
  const data = ref<DataType | null>(null)

  // === Getters ===
  const hasData = computed(() => !!data.value)

  // === Actions ===
  async function fetchData() {
    try {
      const response = await api.getData()
      data.value = response.data
      return Promise.resolve(response.data)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return { data, hasData, fetchData }
})

// 🟡 SHOULD - 导出类型
export type ModuleStore = ReturnType<typeof useModuleStore>
```

**Store设计标准**:

```yaml
🔴 MUST:
  - 使用Setup语法
  - Actions返回Promise
  - 导出所有类型

🟡 SHOULD:
  - State最小化
  - 敏感数据不持久化
  - 大数据用shallowRef

🟢 MAY:
  - 使用Options语法（特殊情况）
```

### 4.5 样式编写流程

```scss
// 🔴 MUST - 导入变量和mixins
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.component-name {
  // 🟡 SHOULD - 使用变量
  padding: $spacing-lg;
  color: $text-primary;

  // 🟡 SHOULD - 使用mixins
  @include flex-between;
  @include ellipsis(2);

  // 🔴 MUST - 响应式适配
  @include respond-to('mobile') {
    padding: $spacing-md;
  }

  // 🟡 SHOULD - 修改Element Plus组件
  :deep(.el-button) {
    margin-left: $spacing-sm;
  }
}
```

---

## 5. 性能标准

### 5.1 可度量指标

```yaml
🔴 MUST遵守:
  组件代码: < 500行
  CSS嵌套: ≤ 3层
  函数圈复杂度: < 15
  API响应: < 3秒

🟡 SHOULD遵守:
  组件代码: < 300行
  CSS嵌套: ≤ 2层
  函数圈复杂度: < 10
  API响应: < 1秒
```

### 5.2 优化技巧

```typescript
// 🟡 SHOULD - 大数据用shallowRef
const bigList = shallowRef<Item[]>([])

// 🟡 SHOULD - computed缓存复杂计算
const filtered = computed(() => list.value.filter(i => i.active))

// 🟡 SHOULD - 组件懒加载
const AsyncComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)

// 🟡 SHOULD - 虚拟滚动
<el-table v-virtual-scroll :data="bigList">
```

---

## 6. 代码审查检查清单

### 6.1 组件审查

```yaml
🔴 MUST检查:
  - [ ] 使用TypeScript严格类型
  - [ ] Props和Emits有类型定义
  - [ ] 使用Composition API
  - [ ] 设置了defineOptions name
  - [ ] 样式使用scoped

🟡 SHOULD检查:
  - [ ] 组件<300行
  - [ ] 单一职责
  - [ ] 添加了必要注释
  - [ ] 响应式适配
```

### 6.2 API审查

```yaml
🔴 MUST检查:
  - [ ] 类型定义完整
  - [ ] 使用request实例
  - [ ] 错误处理完善
  - [ ] 函数命名清晰

🟡 SHOULD检查:
  - [ ] 添加JSDoc注释
  - [ ] 支持取消请求（长时间操作）
```

### 6.3 样式审查

```yaml
🔴 MUST检查:
  - [ ] 使用SCSS
  - [ ] 使用scoped
  - [ ] 嵌套≤3层

🟡 SHOULD检查:
  - [ ] 使用变量和mixin
  - [ ] 响应式适配
  - [ ] 遵循BEM规范
```

---

## 7. ESLint配置要求

```javascript
// 🔴 MUST - 关键规则
module.exports = {
  rules: {
    // TypeScript
    '@typescript-eslint/no-explicit-any': 'error',  // 禁用any
    '@typescript-eslint/no-unused-vars': 'error',   // 禁用未使用变量

    // Vue
    'vue/component-definition-name-casing': ['error', 'PascalCase'],
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],

    // 通用
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  }
}
```

---

## 8. 常见场景快速参考

### 8.1 我应该创建组件还是Page?

```yaml
创建组件 (components/):
  - 可复用的UI元素
  - 不依赖路由
  - 示例: Button, Card, Table

创建页面 (views/):
  - 路由对应的页面
  - 包含业务逻辑
  - 示例: UserList, Dashboard
```

### 8.2 我应该用ref还是reactive?

```typescript
// 🟡 SHOULD - 使用ref（默认推荐）
const count = ref(0)
const user = ref<UserInfo>()

// 🟢 MAY - 使用reactive（对象场景）
const form = reactive({
  name: '',
  email: '',
})

// 选择标准:
// ref: 单一值、需要.value、类型清晰
// reactive: 表单对象、配置对象
```

### 8.3 何时创建Store?

```yaml
🔴 MUST创建Store:
  - 跨多个页面共享的数据
  - 需要持久化的数据
  - 用户信息、权限、主题等

🟢 MAY不创建Store:
  - 单页面使用的数据
  - 临时状态
  - 可通过props/emit传递的数据
```

---

## 9. 快速命令参考

```bash
# 开发
npm run dev           # 启动开发服务器
npm run build         # 生产构建
npm run preview       # 预览构建

# 代码质量
npm run lint          # ESLint检查
npm run lint:fix      # 自动修复
npm run type-check    # TypeScript检查

# 提交代码
git add .
git commit -m "feat: xxx"  # 遵循Conventional Commits
git push
```

---

## 10. 详细文档索引

```yaml
需要更多细节时查阅:
  组件开发: ./guides/component-guide.md
  API调用: ./guides/api-guide.md
  样式编写: ./guides/style-guide.md
  状态管理: ./guides/store-guide.md
  工作流程: ./workflows/
  代码模板: ./templates/
  检查清单: ./checklists/
```

---

## 🎯 核心原则总结

```yaml
1. 类型安全优先:
   - 使用TypeScript严格模式
   - 避免使用any
   - 导出所有类型

2. 组合式API优先:
   - Setup语法为主
   - Composition API
   - 组合函数复用逻辑

3. 单一职责:
   - 组件<300行
   - 函数<50行
   - 一个文件做一件事

4. 性能优化:
   - 懒加载组件
   - computed缓存
   - 虚拟滚动大列表

5. 可维护性:
   - 清晰的命名
   - 完整的注释
   - 一致的风格
```

---

**最后更新**: 2025-10-30
**版本**: v2.0.0 (优化版)
**Token占用**: ~1500 (相比v1.0减少35%)
**维护者**: 项目团队

**注意**: 本文档是核心必读规则。详细指南请参考guides/目录下的专项文档。