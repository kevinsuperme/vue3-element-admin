# API 调用规范指南

> Vue3 Element Admin 统一的 API 调用标准

---

## 📋 目录结构

```
src/api/
├── index.ts              # API 统一导出
├── request.ts            # Axios 实例配置
├── types/                # API 类型定义
│   └── index.ts
├── user.ts              # 用户相关 API
├── permission.ts        # 权限相关 API
├── dashboard.ts         # 仪表板数据 API
└── ...                  # 其他业务模块 API
```

---

## 🔧 Axios 实例配置

### request.ts 标准配置

```typescript
// src/api/request.ts
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import router from '@/router'

// ==================== 类型定义 ====================

/** API 响应数据结构 */
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

/** 请求配置扩展 */
export interface CustomRequestConfig extends AxiosRequestConfig {
  /** 是否显示加载提示 */
  showLoading?: boolean
  /** 是否显示错误提示 */
  showError?: boolean
  /** 自定义错误消息 */
  errorMessage?: string
  /** 重试次数 */
  retryCount?: number
}

// ==================== 常量配置 ====================

/** API 基础 URL */
const BASE_URL = import.meta.env.VITE_APP_BASE_API || '/api'

/** 请求超时时间 */
const TIMEOUT = 60000

/** 成功状态码 */
const SUCCESS_CODE = 20000

/** Token 过期状态码 */
const TOKEN_EXPIRED_CODES = [50008, 50012, 50014]

// ==================== 创建实例 ====================

const service: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
})

// ==================== 请求拦截器 ====================

service.interceptors.request.use(
  (config) => {
    // 添加 Token
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }

    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }

    return config
  },
  (error: AxiosError) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// ==================== 响应拦截器 ====================

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    const config = response.config as CustomRequestConfig

    // 成功响应
    if (res.code === SUCCESS_CODE) {
      return res
    }

    // Token 过期处理
    if (TOKEN_EXPIRED_CODES.includes(res.code)) {
      handleTokenExpired()
      return Promise.reject(new Error(res.message || 'Token 已过期'))
    }

    // 业务错误处理
    if (config.showError !== false) {
      ElMessage.error(config.errorMessage || res.message || '请求失败')
    }

    return Promise.reject(new Error(res.message || 'Error'))
  },
  (error: AxiosError) => {
    const config = error.config as CustomRequestConfig

    // 网络错误处理
    if (config?.showError !== false) {
      handleNetworkError(error)
    }

    return Promise.reject(error)
  }
)

// ==================== 错误处理函数 ====================

/** Token 过期处理 */
function handleTokenExpired() {
  ElMessageBox.confirm(
    '您已登出，请重新登录',
    '确认登出',
    {
      confirmButtonText: '重新登录',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const userStore = useUserStore()
    userStore.logout().then(() => {
      router.push('/login')
    })
  })
}

/** 网络错误处理 */
function handleNetworkError(error: AxiosError) {
  let message = '请求失败'

  if (error.response) {
    switch (error.response.status) {
      case 400:
        message = '请求参数错误'
        break
      case 401:
        message = '未授权，请重新登录'
        break
      case 403:
        message = '权限不足'
        break
      case 404:
        message = '请求的资源不存在'
        break
      case 500:
        message = '服务器内部错误'
        break
      case 502:
        message = '网关错误'
        break
      case 503:
        message = '服务暂时不可用'
        break
      case 504:
        message = '网关超时'
        break
      default:
        message = `请求失败: ${error.response.status}`
    }
  } else if (error.code === 'ECONNABORTED') {
    message = '请求超时'
  } else if (!window.navigator.onLine) {
    message = '网络连接失败'
  }

  ElMessage.error(message)
}

// ==================== 导出 ====================

export default service
```

---

## 📦 API 模块定义规范

### 基础 API 模板

```typescript
// src/api/user.ts
import request from './request'
import type { ApiResponse } from './request'

// ==================== 类型定义 ====================

/** 用户信息 */
export interface UserInfo {
  id: string
  username: string
  email: string
  avatar: string
  roles: string[]
  permissions: string[]
}

/** 登录参数 */
export interface LoginParams {
  username: string
  password: string
}

/** 登录响应 */
export interface LoginResponse {
  token: string
  refreshToken: string
}

/** 用户列表查询参数 */
export interface UserListParams {
  page: number
  pageSize: number
  keyword?: string
  role?: string
  status?: 'active' | 'inactive'
}

/** 分页响应 */
export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ==================== API 函数 ====================

/** 用户登录 */
export function login(data: LoginParams) {
  return request<ApiResponse<LoginResponse>>({
    url: '/auth/login',
    method: 'post',
    data,
  })
}

/** 用户登出 */
export function logout() {
  return request<ApiResponse<void>>({
    url: '/auth/logout',
    method: 'post',
  })
}

/** 获取当前用户信息 */
export function getUserInfo() {
  return request<ApiResponse<UserInfo>>({
    url: '/auth/profile',
    method: 'get',
  })
}

/** 获取用户列表 */
export function getUserList(params: UserListParams) {
  return request<ApiResponse<PaginationResponse<UserInfo>>>({
    url: '/users',
    method: 'get',
    params,
  })
}

/** 创建用户 */
export function createUser(data: Partial<UserInfo>) {
  return request<ApiResponse<UserInfo>>({
    url: '/users',
    method: 'post',
    data,
  })
}

/** 更新用户 */
export function updateUser(id: string, data: Partial<UserInfo>) {
  return request<ApiResponse<UserInfo>>({
    url: `/users/${id}`,
    method: 'put',
    data,
  })
}

/** 删除用户 */
export function deleteUser(id: string) {
  return request<ApiResponse<void>>({
    url: `/users/${id}`,
    method: 'delete',
  })
}

/** 批量删除用户 */
export function batchDeleteUsers(ids: string[]) {
  return request<ApiResponse<void>>({
    url: '/users/batch-delete',
    method: 'post',
    data: { ids },
  })
}

/** 重置用户密码 */
export function resetPassword(id: string, newPassword: string) {
  return request<ApiResponse<void>>({
    url: `/users/${id}/reset-password`,
    method: 'post',
    data: { password: newPassword },
  })
}

/** 上传用户头像 */
export function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return request<ApiResponse<{ url: string }>>({
    url: '/users/avatar',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
```

---

## 🎯 组件中使用 API

### 1. 基础使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { getUserList } from '@/api/user'
import type { UserInfo } from '@/api/user'
import { ElMessage } from 'element-plus'

const isLoading = ref(false)
const userList = ref<UserInfo[]>([])
const total = ref(0)

async function fetchUsers() {
  isLoading.value = true
  try {
    const { data } = await getUserList({
      page: 1,
      pageSize: 20,
    })
    userList.value = data.list
    total.value = data.total
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
</script>
```

### 2. 使用组合式函数封装 (推荐)

```typescript
// src/composables/useUsers.ts
import { ref } from 'vue'
import { getUserList, createUser, updateUser, deleteUser } from '@/api/user'
import type { UserInfo, UserListParams } from '@/api/user'
import { ElMessage } from 'element-plus'

export function useUsers() {
  const isLoading = ref(false)
  const userList = ref<UserInfo[]>([])
  const total = ref(0)

  /** 获取用户列表 */
  async function fetchUsers(params: UserListParams) {
    isLoading.value = true
    try {
      const { data } = await getUserList(params)
      userList.value = data.list
      total.value = data.total
      return data
    } catch (error) {
      ElMessage.error('获取用户列表失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /** 创建用户 */
  async function handleCreate(userData: Partial<UserInfo>) {
    try {
      await createUser(userData)
      ElMessage.success('创建成功')
      return true
    } catch (error) {
      ElMessage.error('创建失败')
      return false
    }
  }

  /** 更新用户 */
  async function handleUpdate(id: string, userData: Partial<UserInfo>) {
    try {
      await updateUser(id, userData)
      ElMessage.success('更新成功')
      return true
    } catch (error) {
      ElMessage.error('更新失败')
      return false
    }
  }

  /** 删除用户 */
  async function handleDelete(id: string) {
    try {
      await deleteUser(id)
      ElMessage.success('删除成功')
      return true
    } catch (error) {
      ElMessage.error('删除失败')
      return false
    }
  }

  return {
    isLoading,
    userList,
    total,
    fetchUsers,
    handleCreate,
    handleUpdate,
    handleDelete,
  }
}
```

```vue
<!-- 组件中使用 -->
<script setup lang="ts">
import { useUsers } from '@/composables/useUsers'

const {
  isLoading,
  userList,
  total,
  fetchUsers,
  handleCreate,
  handleDelete,
} = useUsers()

onMounted(() => {
  fetchUsers({ page: 1, pageSize: 20 })
})
</script>
```

---

## 🔄 高级功能

### 1. 请求取消

```typescript
import { ref, onBeforeUnmount } from 'vue'
import axios from 'axios'

const controller = ref<AbortController | null>(null)

async function fetchData() {
  // 取消上一个请求
  controller.value?.abort()

  // 创建新的控制器
  controller.value = new AbortController()

  try {
    const { data } = await getData({
      signal: controller.value.signal,
    })
    return data
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled')
    } else {
      throw error
    }
  }
}

// 组件卸载时取消请求
onBeforeUnmount(() => {
  controller.value?.abort()
})
```

### 2. 请求重试

```typescript
async function requestWithRetry<T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// 使用
const data = await requestWithRetry(() => getUserInfo())
```

### 3. 并发请求

```typescript
// ✅ 推荐 - 使用 Promise.all
async function fetchDashboardData() {
  try {
    const [users, orders, stats] = await Promise.all([
      getUserList({ page: 1, pageSize: 10 }),
      getOrderList({ page: 1, pageSize: 10 }),
      getStatistics(),
    ])

    return { users, orders, stats }
  } catch (error) {
    ElMessage.error('获取数据失败')
    throw error
  }
}

// ✅ 使用 Promise.allSettled (部分失败不影响其他)
async function fetchMultipleData() {
  const results = await Promise.allSettled([
    getUserList({}),
    getOrderList({}),
    getStatistics(),
  ])

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Request ${index} failed:`, result.reason)
    }
  })

  return results
}
```

---

## ✅ API 设计检查清单

- [ ] 使用 TypeScript 严格类型
- [ ] 函数命名清晰（get/create/update/delete）
- [ ] 导出所有类型定义
- [ ] 添加 JSDoc 注释
- [ ] 错误处理完整
- [ ] 支持取消请求（长时间操作）
- [ ] 请求参数验证
- [ ] 响应数据验证
- [ ] 敏感操作需要二次确认
- [ ] 添加单元测试

---

**下一步**: 查看 [样式规范](./style-guide.md) | [TypeScript 规范](./typescript-guide.md)