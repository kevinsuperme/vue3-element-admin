# Pinia 状态管理指南

> Vue3 Element Admin 官方状态管理规范

---

## 📋 Pinia Store 设计原则

### 1. Store 命名规范

```typescript
// ✅ 推荐 - 使用 use + 模块名 + Store
export const useUserStore = defineStore('user', {})
export const usePermissionStore = defineStore('permission', {})
export const useAppStore = defineStore('app', {})

// ❌ 避免
export const UserStore = defineStore('user', {})  // 不用 PascalCase
export const user = defineStore('user', {})       // 不省略 Store 后缀
```

### 2. Store 文件结构

```
src/store/
├── index.ts              # Store 主入口，导出所有 store
├── modules/              # Store 模块
│   ├── user.ts          # 用户模块
│   ├── permission.ts    # 权限模块
│   ├── app.ts           # 应用配置模块
│   ├── tagsView.ts      # 标签页模块
│   └── settings.ts      # 系统设置模块
└── types/               # Store 类型定义
    └── index.ts
```

---

## 📦 标准 Store 模板

### Setup Syntax (推荐)

```typescript
// src/store/modules/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, LoginParams } from '@/types/user'
import { login as apiLogin, getUserInfo } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  // ==================== State ====================
  const token = ref(getToken())
  const userInfo = ref<UserInfo | null>(null)
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])

  // ==================== Getters ====================
  const isLoggedIn = computed(() => !!token.value)
  const hasRole = computed(() => (role: string) => {
    return roles.value.includes(role)
  })
  const hasPermission = computed(() => (permission: string) => {
    return permissions.value.includes(permission)
  })

  // ==================== Actions ====================

  /** 用户登录 */
  async function login(loginParams: LoginParams) {
    try {
      const { data } = await apiLogin(loginParams)
      token.value = data.token
      setToken(data.token)
      return Promise.resolve(data)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /** 获取用户信息 */
  async function fetchUserInfo() {
    if (!token.value) {
      return Promise.reject('No token available')
    }

    try {
      const { data } = await getUserInfo()
      userInfo.value = data
      roles.value = data.roles || []
      permissions.value = data.permissions || []
      return Promise.resolve(data)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /** 用户登出 */
  async function logout() {
    try {
      // 调用登出 API
      // await apiLogout()

      // 清除本地数据
      token.value = ''
      userInfo.value = null
      roles.value = []
      permissions.value = []
      removeToken()

      // 清除其他 store
      const tagsViewStore = useTagsViewStore()
      tagsViewStore.clearVisitedViews()

      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /** 重置 Token */
  function resetToken() {
    token.value = ''
    roles.value = []
    permissions.value = []
    removeToken()
  }

  /** 修改用户信息 */
  function updateUserInfo(data: Partial<UserInfo>) {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...data }
    }
  }

  return {
    // State
    token,
    userInfo,
    roles,
    permissions,

    // Getters
    isLoggedIn,
    hasRole,
    hasPermission,

    // Actions
    login,
    fetchUserInfo,
    logout,
    resetToken,
    updateUserInfo,
  }
})
```

### Options Syntax (可选)

```typescript
// src/store/modules/app.ts
import { defineStore } from 'pinia'

interface AppState {
  sidebar: {
    opened: boolean
    withoutAnimation: boolean
  }
  device: 'desktop' | 'mobile'
  language: string
  size: string
}

export const useAppStore = defineStore('app', {
  // ==================== State ====================
  state: (): AppState => ({
    sidebar: {
      opened: true,
      withoutAnimation: false,
    },
    device: 'desktop',
    language: 'zh-CN',
    size: 'default',
  }),

  // ==================== Getters ====================
  getters: {
    isMobile: (state) => state.device === 'mobile',
    isDesktop: (state) => state.device === 'desktop',
    sidebarOpened: (state) => state.sidebar.opened,
  },

  // ==================== Actions ====================
  actions: {
    toggleSidebar(withoutAnimation?: boolean) {
      this.sidebar.opened = !this.sidebar.opened
      this.sidebar.withoutAnimation = !!withoutAnimation
    },

    closeSidebar(withoutAnimation: boolean) {
      this.sidebar.opened = false
      this.sidebar.withoutAnimation = withoutAnimation
    },

    openSidebar() {
      this.sidebar.opened = true
      this.sidebar.withoutAnimation = false
    },

    setDevice(device: 'desktop' | 'mobile') {
      this.device = device
    },

    setLanguage(language: string) {
      this.language = language
    },

    setSize(size: string) {
      this.size = size
    },
  },

  // ==================== Persist ====================
  persist: {
    key: 'app-store',
    storage: localStorage,
    paths: ['language', 'size'], // 只持久化指定字段
  },
})
```

---

## 🔄 Store 之间的通信

### 1. 在 Store 中调用其他 Store

```typescript
// ✅ 推荐方式
import { usePermissionStore } from './permission'
import { useTagsViewStore } from './tagsView'

export const useUserStore = defineStore('user', () => {
  async function logout() {
    // 获取其他 store 实例
    const permissionStore = usePermissionStore()
    const tagsViewStore = useTagsViewStore()

    // 调用其他 store 的方法
    permissionStore.resetRoutes()
    tagsViewStore.clearAllViews()

    // 清空当前 store
    resetToken()
  }

  return { logout }
})
```

### 2. 组件中使用多个 Store

```vue
<script setup lang="ts">
import { useUserStore } from '@/store/modules/user'
import { usePermissionStore } from '@/store/modules/permission'

// ✅ 推荐 - 直接解构需要的状态和方法
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const { userInfo, roles } = storeToRefs(userStore)  // 响应式解构
const { login, logout } = userStore                  // 方法直接解构

// ❌ 避免 - 不要直接解构 state
const { userInfo } = userStore  // ❌ 会失去响应性
</script>
```

---

## 💾 数据持久化

### 使用 pinia-plugin-persistedstate

```typescript
// src/store/index.ts
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia
```

```typescript
// Store 中启用持久化
export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null,
  }),

  // ✅ 方案1: 全部持久化
  persist: true,

  // ✅ 方案2: 部分持久化（推荐）
  persist: {
    key: 'user-store',
    storage: localStorage,  // 或 sessionStorage
    paths: ['token'],       // 只持久化 token
  },

  // ✅ 方案3: 多存储策略
  persist: [
    {
      key: 'user-token',
      storage: localStorage,
      paths: ['token'],
    },
    {
      key: 'user-settings',
      storage: sessionStorage,
      paths: ['settings'],
    },
  ],
})
```

---

## 📊 异步操作最佳实践

### 1. 错误处理

```typescript
export const useDataStore = defineStore('data', () => {
  const data = ref<DataItem[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchData() {
    isLoading.value = true
    error.value = null

    try {
      const response = await api.getData()
      data.value = response.data
      return response.data
    } catch (err) {
      error.value = err as Error
      ElMessage.error('获取数据失败')
      throw err  // 重新抛出错误，让调用者处理
    } finally {
      isLoading.value = false
    }
  }

  return { data, isLoading, error, fetchData }
})
```

### 2. 请求去重

```typescript
export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  let fetchPromise: Promise<UserInfo> | null = null

  async function fetchUserInfo(force = false) {
    // 如果已有数据且不强制刷新，直接返回
    if (userInfo.value && !force) {
      return Promise.resolve(userInfo.value)
    }

    // 如果正在请求中，返回现有 Promise
    if (fetchPromise) {
      return fetchPromise
    }

    // 发起新请求
    fetchPromise = getUserInfo().then(response => {
      userInfo.value = response.data
      return response.data
    }).finally(() => {
      fetchPromise = null
    })

    return fetchPromise
  }

  return { userInfo, fetchUserInfo }
})
```

### 3. 乐观更新

```typescript
async function updateUser(userId: string, updates: Partial<UserInfo>) {
  const originalData = { ...userInfo.value }

  try {
    // 先更新本地数据（乐观更新）
    Object.assign(userInfo.value, updates)

    // 再发送请求
    await api.updateUser(userId, updates)

    ElMessage.success('更新成功')
  } catch (error) {
    // 失败时回滚
    userInfo.value = originalData
    ElMessage.error('更新失败')
    throw error
  }
}
```

---

## 🎯 性能优化

### 1. 避免不必要的响应式

```typescript
// ✅ 推荐 - 大数据用 shallowRef
const bigData = shallowRef<LargeDataSet[]>([])

// ✅ 推荐 - 只读数据用 readonly
const config = readonly({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
})

// ❌ 避免 - 所有数据都用深层响应式
const data = ref({
  deep: {
    nested: {
      structure: {}  // 会递归创建响应式对象
    }
  }
})
```

### 2. 计算属性缓存

```typescript
// ✅ 使用 computed 缓存复杂计算
const filteredUsers = computed(() => {
  return users.value.filter(user => user.isActive)
})

// ❌ 避免在方法中重复计算
function getFilteredUsers() {
  return users.value.filter(user => user.isActive)
}
```

---

## 📝 类型定义规范

### Store 类型导出

```typescript
// src/store/types/index.ts
import type { useUserStore } from '../modules/user'
import type { useAppStore } from '../modules/app'

export type UserStore = ReturnType<typeof useUserStore>
export type AppStore = ReturnType<typeof useAppStore>

// 在其他地方使用
import type { UserStore } from '@/store/types'

function doSomething(userStore: UserStore) {
  // TypeScript 会有完整的类型提示
}
```

---

## ✅ Store 设计检查清单

- [ ] Store 命名符合规范 (`use + 模块名 + Store`)
- [ ] 使用 TypeScript 严格类型
- [ ] State 最小化，避免冗余数据
- [ ] Getters 用于派生状态
- [ ] Actions 包含完整的错误处理
- [ ] 异步操作有 loading 状态
- [ ] 敏感数据不持久化
- [ ] 大数据使用 shallowRef
- [ ] 导出了类型定义
- [ ] 添加了 JSDoc 注释

---

**下一步**: 查看 [API调用规范](./api-guidelines.md) | [组件设计标准](./component-standards.md)