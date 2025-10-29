# Vue3 Element Admin - Claude 项目规则体系

> **版本**: v1.0.0
> **更新时间**: 2025-10-30
> **技术栈**: Vue 3.5 + TypeScript 5.9 + Element Plus 2.11 + Vite 6.3 + Pinia 3.0

---

## 📚 目录

1. [项目概述](#项目概述)
2. [代码规范](#代码规范)
3. [组件设计标准](#组件设计标准)
4. [状态管理指南](#状态管理指南)
5. [API调用规范](#api调用规范)
6. [样式统一方案](#样式统一方案)
7. [目录结构约定](#目录结构约定)
8. [TypeScript规范](#typescript规范)
9. [最佳实践](#最佳实践)
10. [代码模板](#代码模板)

---

## 项目概述

### 技术架构

```yaml
核心框架:
  - Vue: 3.5.18 (Composition API)
  - TypeScript: 5.9.3
  - Vite: 6.3.7

UI框架:
  - Element Plus: 2.11.5
  - unplugin-auto-import: 自动导入 Element Plus 组件
  - unplugin-vue-components: 按需加载组件

状态管理:
  - Pinia: 3.0.3 (替代 Vuex)

路由:
  - Vue Router: 4.5.1

HTTP请求:
  - Axios: 1.11.0

工具库:
  - ECharts: 5.6.0 (图表)
  - xlsx: 0.18.5 (Excel导出)
  - js-cookie: 3.0.5 (Cookie管理)
  - nprogress: 0.2.0 (进度条)
```

### 项目定位
- **后台管理系统** - 企业级中后台解决方案
- **权限管理** - 基于角色的访问控制(RBAC)
- **响应式设计** - 支持桌面端和移动端
- **国际化** - 支持多语言切换

---

## 代码规范

### 命名约定

#### 文件命名

```typescript
// ✅ 推荐 - 使用 PascalCase
components/UserProfile/index.vue
components/DataTable/TableHeader.vue
views/UserManagement/UserList.vue

// ✅ 推荐 - 组合式函数使用 camelCase + use前缀
composables/usePermission.ts
composables/useTheme.ts

// ✅ 推荐 - 工具函数使用 camelCase
utils/formatDate.ts
utils/validateEmail.ts

// ✅ 推荐 - 类型定义使用 PascalCase
types/User.ts
types/ApiResponse.ts

// ❌ 避免
components/user-profile.vue  // 避免 kebab-case
utils/FormatDate.ts          // 避免工具函数用 PascalCase
```

#### 变量命名

```typescript
// ✅ 推荐 - 常量使用 UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PAGE_SIZE = 20;

// ✅ 推荐 - 变量和函数使用 camelCase
const userName = 'John';
const totalCount = 100;
function fetchUserData() {}

// ✅ 推荐 - 类和接口使用 PascalCase
class UserService {}
interface UserInfo {}
type ApiResponse<T> = {}

// ✅ 推荐 - 私有成员使用下划线前缀
class DataService {
  private _cache = new Map();
  private _isLoading = false;
}

// ✅ 推荐 - 布尔值使用 is/has/can 前缀
const isLoading = ref(false);
const hasPermission = computed(() => true);
const canEdit = ref(true);

// ❌ 避免
const UserName = 'John';      // 变量不用 PascalCase
const is_loading = false;     // 不用 snake_case
const Loading = ref(false);   // 布尔值应有明确前缀
```

### 代码格式化

```typescript
// ✅ 使用 2 空格缩进
// ✅ 使用单引号
// ✅ 语句末尾不加分号
// ✅ 使用尾随逗号

// 示例：
const user = {
  name: 'John',
  age: 30,
  roles: ['admin', 'user'],
}

// ✅ 箭头函数单参数不加括号
const double = n => n * 2

// ✅ 对象解构换行
const {
  name,
  age,
  email,
} = user
```

### ESLint 配置要求

```javascript
// .eslintrc.cjs 关键规则
module.exports = {
  rules: {
    // Vue 规则
    'vue/multi-word-component-names': 'off',
    'vue/component-definition-name-casing': ['error', 'PascalCase'],
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],

    // TypeScript 规则
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_'
    }],

    // 通用规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  }
}
```

---

## 组件设计标准

### 组件分类

```
1. 基础组件 (Base)
   - Button, Input, Icon 等最小可复用单元
   - 命名: Base + 组件名 (如 BaseButton.vue)

2. 业务组件 (Business)
   - UserCard, DataTable, FileUploader 等业务场景组件
   - 命名: 业务名称 (如 UserCard.vue)

3. 布局组件 (Layout)
   - Header, Sidebar, Footer 等页面布局组件
   - 命名: Layout + 位置 (如 LayoutHeader.vue)

4. 页面组件 (Views)
   - 路由对应的页面级组件
   - 位于 views/ 目录
```

### 组件结构模板

```vue
<!-- ✅ 推荐的组件结构 -->
<template>
  <div class="user-profile">
    <el-card v-loading="isLoading">
      <template #header>
        <div class="card-header">
          <span>{{ title }}</span>
          <el-button
            type="primary"
            size="small"
            @click="handleEdit"
          >
            编辑
          </el-button>
        </div>
      </template>

      <div class="user-info">
        <div class="info-item">
          <span class="label">姓名:</span>
          <span class="value">{{ userInfo.name }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { UserInfo } from '@/types/user'

// ==================== Props ====================
interface Props {
  userId: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '用户信息',
})

// ==================== Emits ====================
interface Emits {
  (e: 'update', data: UserInfo): void
  (e: 'delete', id: string): void
}

const emit = defineEmits<Emits>()

// ==================== State ====================
const isLoading = ref(false)
const userInfo = ref<UserInfo>({
  id: '',
  name: '',
  email: '',
})

// ==================== Computed ====================
const displayName = computed(() => {
  return userInfo.value.name || '未命名用户'
})

// ==================== Methods ====================
const fetchUserInfo = async () => {
  isLoading.value = true
  try {
    // API 调用
    const response = await getUserInfo(props.userId)
    userInfo.value = response.data
  } catch (error) {
    ElMessage.error('获取用户信息失败')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const handleEdit = () => {
  emit('update', userInfo.value)
}

// ==================== Lifecycle ====================
onMounted(() => {
  fetchUserInfo()
})

// ==================== Expose ====================
defineExpose({
  refresh: fetchUserInfo,
})
</script>

<style lang="scss" scoped>
.user-profile {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .user-info {
    .info-item {
      margin-bottom: 12px;

      .label {
        font-weight: 600;
        margin-right: 8px;
      }

      .value {
        color: var(--el-text-color-regular);
      }
    }
  }
}
</style>
```

### 组件设计原则

```typescript
// ✅ 1. 单一职责原则
// 每个组件只做一件事
// 如果组件超过 300 行代码，考虑拆分

// ✅ 2. Props 向下，Events 向上
// 父组件通过 props 传递数据
// 子组件通过 emit 触发事件

// ✅ 3. 使用 TypeScript 严格类型
interface Props {
  user: UserInfo       // ✅ 明确类型
  count: number        // ✅ 不使用 any
  onSuccess?: () => void  // ✅ 可选属性用 ?
}

// ✅ 4. 响应式数据使用 ref/reactive
const user = ref<UserInfo>()      // ✅ 单一值用 ref
const form = reactive({           // ✅ 对象用 reactive
  name: '',
  email: '',
})

// ❌ 避免
let user = {}  // 不要用普通变量存储响应式数据

// ✅ 5. 副作用隔离
// 在 onMounted 中执行副作用
onMounted(() => {
  fetchData()
  initChart()
})

// ❌ 避免在 setup 顶层执行副作用
```

---

*继续下一部分...*