# 快速参考手册

> Vue3 Element Admin 常用代码片段和快速查询

---

## 🚀 常用 Composition API

### ref vs reactive

```typescript
import { ref, reactive } from 'vue'

// ✅ ref - 基本类型和单个对象
const count = ref(0)
const user = ref<User | null>(null)
console.log(count.value)  // 需要 .value

// ✅ reactive - 对象和数组
const form = reactive({
  name: '',
  email: '',
})
console.log(form.name)  // 不需要 .value

// ❌ 避免 - ref 解构会失去响应性
const { count } = ref({ count: 0 })  // ❌ count 不是响应式

// ✅ 使用 toRefs
const state = reactive({ count: 0 })
const { count } = toRefs(state)  // ✅ count 是响应式
```

### computed

```typescript
import { ref, computed } from 'vue'

const count = ref(0)

// ✅ 只读计算属性
const double = computed(() => count.value * 2)

// ✅ 可写计算属性
const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (value) => {
    [firstName.value, lastName.value] = value.split(' ')
  }
})
```

### watch vs watchEffect

```typescript
import { ref, watch, watchEffect } from 'vue'

const count = ref(0)
const name = ref('')

// ✅ watch - 监听特定数据源
watch(count, (newVal, oldVal) => {
  console.log(`count changed from ${oldVal} to ${newVal}`)
})

// ✅ watch - 监听多个数据源
watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
  console.log('Multiple values changed')
})

// ✅ watch - 深度监听
watch(user, (newVal) => {
  console.log('User changed:', newVal)
}, { deep: true })

// ✅ watchEffect - 自动追踪依赖
watchEffect(() => {
  console.log(`Count is ${count.value}`)
  // 自动监听 count 的变化
})

// ✅ 停止监听
const stop = watch(count, () => {})
stop()  // 停止监听
```

---

## 📦 Element Plus 常用组件

### 表单验证

```vue
<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
  >
    <el-form-item label="用户名" prop="username">
      <el-input v-model="form.username" />
    </el-form-item>

    <el-form-item label="邮箱" prop="email">
      <el-input v-model="form.email" type="email" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  email: '',
})

const rules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] },
  ],
})

async function submitForm() {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      console.log('submit!', form)
    } else {
      console.log('error submit!')
    }
  })
}

function resetForm() {
  formRef.value?.resetFields()
}
</script>
```

### 表格操作

```vue
<template>
  <el-table
    :data="tableData"
    v-loading="loading"
    @selection-change="handleSelectionChange"
  >
    <el-table-column type="selection" width="55" />
    <el-table-column prop="name" label="姓名" sortable />
    <el-table-column prop="email" label="邮箱" />
    <el-table-column label="操作" width="200">
      <template #default="{ row }">
        <el-button type="primary" size="small" @click="handleEdit(row)">
          编辑
        </el-button>
        <el-button type="danger" size="small" @click="handleDelete(row)">
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>

  <el-pagination
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :total="total"
    :page-sizes="[10, 20, 50, 100]"
    layout="total, sizes, prev, pager, next, jumper"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const loading = ref(false)
const tableData = ref([])
const multipleSelection = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

function handleSelectionChange(val: any[]) {
  multipleSelection.value = val
}

function handleEdit(row: any) {
  console.log('Edit:', row)
}

function handleDelete(row: any) {
  console.log('Delete:', row)
}

function handleSizeChange(val: number) {
  pageSize.value = val
  fetchData()
}

function handleCurrentChange(val: number) {
  currentPage.value = val
  fetchData()
}

async function fetchData() {
  loading.value = true
  try {
    // API 调用
  } finally {
    loading.value = false
  }
}
</script>
```

### 对话框

```vue
<template>
  <el-button @click="dialogVisible = true">打开对话框</el-button>

  <el-dialog
    v-model="dialogVisible"
    title="提示"
    width="500px"
    :before-close="handleClose"
  >
    <span>这是一段信息</span>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'

const dialogVisible = ref(false)

function handleClose(done: () => void) {
  ElMessageBox.confirm('确认关闭？')
    .then(() => {
      done()
    })
    .catch(() => {
      // 取消关闭
    })
}

function handleConfirm() {
  console.log('Confirmed')
  dialogVisible.value = false
}
</script>
```

---

## 🎨 常用样式工具

### Flex 布局

```scss
// 水平垂直居中
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 左右分布
.between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// 垂直排列
.column {
  display: flex;
  flex-direction: column;
}

// 等间距
.around {
  display: flex;
  justify-content: space-around;
}
```

### 文本省略

```scss
// 单行省略
.ellipsis-1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 多行省略 (2行)
.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

---

## 📝 TypeScript 类型定义

### 基础类型

```typescript
// 基本类型
const name: string = 'John'
const age: number = 30
const isActive: boolean = true
const data: any = {}  // ❌ 避免使用

// 数组
const list: number[] = [1, 2, 3]
const users: User[] = []
const matrix: number[][] = [[1, 2], [3, 4]]

// 元组
const tuple: [string, number] = ['John', 30]

// 枚举
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

// 联合类型
type Status = 'pending' | 'success' | 'error'
const status: Status = 'pending'

// 交叉类型
type User = { name: string } & { email: string }
```

### 接口和类型别名

```typescript
// ✅ Interface - 对象结构
interface User {
  id: string
  name: string
  email: string
  age?: number  // 可选
  readonly createdAt: Date  // 只读
}

// ✅ Type Alias - 联合类型、函数类型等
type ID = string | number
type Callback = (data: any) => void

// 扩展接口
interface AdminUser extends User {
  permissions: string[]
}

// 泛型
interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

type Result = ApiResponse<User>
```

### 工具类型

```typescript
// Partial - 所有属性可选
type PartialUser = Partial<User>

// Required - 所有属性必填
type RequiredUser = Required<User>

// Pick - 选择部分属性
type UserPreview = Pick<User, 'id' | 'name'>

// Omit - 排除部分属性
type UserWithoutEmail = Omit<User, 'email'>

// Record - 键值对类型
type UserMap = Record<string, User>

// ReturnType - 函数返回值类型
function getUser() {
  return { id: '1', name: 'John' }
}
type UserReturn = ReturnType<typeof getUser>
```

---

## 🔧 开发工具

### 环境变量

```bash
# .env.development
VITE_APP_TITLE=Vue3 Admin
VITE_APP_BASE_API=/dev-api
VITE_APP_PORT=8080
```

```typescript
// 在代码中使用
const apiUrl = import.meta.env.VITE_APP_BASE_API
const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD
```

### 路由配置

```typescript
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/users',
    component: () => import('@/layout/index.vue'),
    redirect: '/users/list',
    meta: {
      title: '用户管理',
      icon: 'user',
      roles: ['admin'],
    },
    children: [
      {
        path: 'list',
        name: 'UserList',
        component: () => import('@/views/users/list.vue'),
        meta: {
          title: '用户列表',
        },
      },
      {
        path: 'detail/:id',
        name: 'UserDetail',
        component: () => import('@/views/users/detail.vue'),
        meta: {
          title: '用户详情',
          hidden: true,
        },
      },
    ],
  },
]
```

---

## ✅ 常用命令

```bash
# 开发
npm run dev:test      # 开发环境(测试)
npm run dev:prod      # 开发环境(生产)

# 构建
npm run build:test    # 构建测试环境
npm run build:prod    # 构建生产环境

# 预览
npm run preview       # 预览构建结果

# 代码检查
npm run lint          # ESLint 检查并修复
npm run type-check    # TypeScript 类型检查
```

---

## 🎯 调试技巧

### Vue Devtools

```typescript
// 在组件中暴露数据供调试
defineExpose({
  // 这些会在 Vue Devtools 中可见
  userData,
  isLoading,
  refresh: fetchData,
})
```

### Console 技巧

```typescript
// 分组日志
console.group('User Data')
console.log('Name:', user.name)
console.log('Email:', user.email)
console.groupEnd()

// 表格显示
console.table([
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 },
])

// 性能测试
console.time('fetchData')
await fetchData()
console.timeEnd('fetchData')
```

---

**快速导航**: [返回主页](./README.md) | [完整规范](./project-rules.md)