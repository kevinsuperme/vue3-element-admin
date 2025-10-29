# Vue3 Element Admin - Claude 规则体系

> **完整的项目开发规范与最佳实践指南**

---

## 📚 文档导航

### 核心规范文档
- **[项目规则总览](./project-rules.md)** ⭐ 开始阅读
  - 项目概述与技术栈
  - 代码规范与命名约定
  - 组件设计标准
  - 最佳实践

- **[状态管理指南](./state-management-guide.md)** - Pinia
  - Store 设计原则
  - 标准模板 (Setup & Options)
  - Store 通信
  - 数据持久化
  - 异步操作最佳实践

- **[API 调用规范](./api-guidelines.md)**
  - Axios 实例配置
  - API 模块定义
  - 错误处理
  - 高级功能 (取消/重试/并发)

- **[样式与UI规范](./style-guide.md)**
  - SCSS 使用规范
  - CSS 变量系统
  - BEM 命名规范
  - 布局规范
  - Element Plus 主题定制

### 快速参考
- **[代码模板库](./templates/)** - 复制即用
- **[常见问题](./faq.md)** - 疑难解答
- **[检查清单](./checklists/)** - 代码审查

---

## 🚀 快速开始

### 1. 创建新组件

```bash
# 使用组件模板
cp .claude/templates/component-template.vue src/components/NewComponent/index.vue
```

```vue
<!-- src/components/NewComponent/index.vue -->
<template>
  <div class="new-component">
    <!-- 组件内容 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  // 定义 props
}

const props = withDefaults(defineProps<Props>(), {
  // 默认值
})

// Emits
interface Emits {
  // 定义 emits
}

const emit = defineEmits<Emits>()

// State & Logic
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.new-component {
  // 样式
}
</style>
```

### 2. 创建新页面

```vue
<!-- src/views/NewPage/index.vue -->
<template>
  <div class="new-page-container">
    <el-card v-loading="isLoading">
      <!-- 页面内容 -->
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineOptions({
  name: 'NewPage',
})

const isLoading = ref(false)

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

### 3. 创建新 Store

```typescript
// src/store/modules/newStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNewStore = defineStore('new', () => {
  // State
  const data = ref<any>(null)

  // Getters
  const hasData = computed(() => !!data.value)

  // Actions
  async function fetchData() {
    try {
      // API 调用
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return {
    data,
    hasData,
    fetchData,
  }
})
```

### 4. 创建新 API 模块

```typescript
// src/api/newModule.ts
import request from './request'
import type { ApiResponse } from './request'

export interface DataItem {
  id: string
  name: string
}

export function getData() {
  return request<ApiResponse<DataItem[]>>({
    url: '/data',
    method: 'get',
  })
}

export function createData(data: Partial<DataItem>) {
  return request<ApiResponse<DataItem>>({
    url: '/data',
    method: 'post',
    data,
  })
}
```

---

## 📖 核心概念

### 技术栈

```yaml
核心:
  - Vue: 3.5.18 (Composition API)
  - TypeScript: 5.9.3
  - Vite: 6.3.7

UI:
  - Element Plus: 2.11.5
  - SCSS: 1.89.2

状态管理:
  - Pinia: 3.0.3

路由:
  - Vue Router: 4.5.1

HTTP:
  - Axios: 1.11.0
```

### 开发原则

1. **类型安全优先** - 充分利用 TypeScript
2. **组合式 API** - 使用 Vue 3 Composition API
3. **单一职责** - 每个模块/组件只做一件事
4. **可复用性** - 提取公共逻辑到 composables
5. **响应式设计** - 移动端适配
6. **性能优化** - 懒加载、代码分割

---

## 🎯 命名规范

### 文件命名

| 类型 | 命名方式 | 示例 |
|------|---------|------|
| 组件 | PascalCase | `UserProfile/index.vue` |
| Composables | camelCase + use前缀 | `usePermission.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `User.ts` |
| Stores | camelCase + Store后缀 | `userStore.ts` |
| Views | PascalCase | `UserManagement/index.vue` |

### 变量命名

| 类型 | 命名方式 | 示例 |
|------|---------|------|
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 变量/函数 | camelCase | `userName`, `fetchData()` |
| 类/接口 | PascalCase | `UserService`, `UserInfo` |
| 布尔值 | is/has/can 前缀 | `isLoading`, `hasPermission` |
| 私有成员 | 下划线前缀 | `_cache`, `_isLoading` |

---

## 🛠️ 开发工具配置

### VS Code 推荐设置

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "typescript",
    "vue"
  ],
  "vetur.validation.template": false
}
```

### 推荐扩展

- **Volar** - Vue 3 语言支持
- **TypeScript Vue Plugin** - Vue TS 支持
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **SCSS Formatter** - SCSS 格式化

---

## 📋 代码审查清单

### 组件审查
- [ ] 使用 TypeScript 严格类型
- [ ] Props 和 Emits 类型定义完整
- [ ] 使用 Composition API
- [ ] 响应式数据使用 ref/reactive
- [ ] 组件命名符合规范
- [ ] Scoped 样式
- [ ] 添加必要注释

### API 审查
- [ ] 类型定义完整
- [ ] 错误处理完善
- [ ] 函数命名清晰
- [ ] 导出所有类型
- [ ] 添加 JSDoc 注释

### 样式审查
- [ ] 使用 SCSS
- [ ] 遵循 BEM 规范
- [ ] 使用变量和 mixin
- [ ] 响应式适配
- [ ] 避免深层嵌套

### Store 审查
- [ ] 命名规范（use + 模块名 + Store）
- [ ] State 最小化
- [ ] 异步操作错误处理
- [ ] 合理的持久化策略
- [ ] 类型定义导出

---

## 🔗 相关资源

### 官方文档
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Element Plus 官方文档](https://element-plus.org/zh-CN/)
- [Pinia 官方文档](https://pinia.vuejs.org/zh/)
- [Vite 官方文档](https://cn.vitejs.dev/)

### 项目文档
- [项目 README](../../README.md)
- [变更日志](../../CHANGELOG.md)
- [贡献指南](../../CONTRIBUTING.md)

---

## 📞 获取帮助

### 问题反馈
- **GitHub Issues** - 提交 bug 或功能请求
- **团队 Wiki** - 查看内部文档
- **技术分享会** - 定期分享最佳实践

### 常见问题
参见 [FAQ 文档](./faq.md)

---

## 📄 许可证

本规范文档遵循项目许可证。

---

**最后更新**: 2025-10-30
**版本**: v1.0.0
**维护者**: 项目团队