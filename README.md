# Vue3 Element Admin 🚀

一个基于 Vue 3 + TypeScript + Element Plus + Vite 的现代化后台管理系统模板。

[![Vue 3](https://img.shields.io/badge/Vue-3.5.19-brightgreen.svg)](https://vuejs.org/)
[![Element Plus](https://img.shields.io/badge/ElementPlus-2.11.5-blue.svg)](https://element-plus.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.7-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange.svg)](package.json)

## 👨‍💻 作者信息

- **GitHub**: [Kevinsuperme](https://github.com/Kevinsuperme)
- **Email**: [iphone.com@live.cn](mailto:iphone.com@live.cn)
- **QQ**: 1583812938
- **微信**: Superme8169

## 📖 项目介绍

Vue3 Element Admin 是一个企业级后台管理系统模板，采用最新的前端技术栈，提供了完整的权限管理、组件封装、Mock数据等功能。项目从 Vue Element Admin 移植而来，提供了丰富的功能组件和最佳实践。

### 在线演示
- 🌐 [生产环境演示](https://vue3-element-admin.midfar.com/)
- 📚 [详细文档](https://vue3-element-admin-site.midfar.com/guide/essentials/router-and-nav.html)

### 架构文档
- 📋 [技术架构评估与规划](docs/architecture/README.md) - 完整的架构设计文档
- 🏗️ [系统架构设计](docs/architecture/system-architecture.md) - 技术栈分析和架构优化建议
- 🔌 [API接口设计规范](docs/architecture/api-design.md) - RESTful API设计规范
- ⚡ [性能优化策略](docs/architecture/performance-optimization.md) - 性能优化最佳实践
- 🔐 [安全架构设计](docs/architecture/security-architecture.md) - 安全防护方案
- 🚀 [开发与部署流程](docs/architecture/development-deployment.md) - 开发规范和CI/CD流程

## ✨ 核心特性

### 🏗️ 技术架构
- **Vue 3.5.18** - 采用 Composition API，更好的TypeScript支持
- **Element Plus 2.11.5** - 基于Vue 3的企业级UI组件库
- **Vite 6.3.7** - 新一代前端构建工具，极速的开发体验
- **TypeScript** - 强类型支持，提升代码质量和开发效率
- **Pinia 3.0.3** - Vue官方状态管理库，轻量级且类型安全
- **Vue Router 4.5.1** - Vue.js官方路由管理器

### 🔧 功能特性
- **权限管理** - 基于RBAC的动态路由和权限控制
- **组件封装** - 常用组件二次封装，开箱即用
- **Mock数据** - 内置Mock数据方案，支持开发和测试
- **主题定制** - 支持Element Plus主题自定义
- **国际化** - 多语言支持，易于扩展
- **响应式设计** - 适配多种屏幕尺寸

### 🛡️ 工程化
- **ESLint** - 代码质量检查
- **TypeScript** - 类型安全
- **单元测试** - 支持Vitest测试框架
- **代码规范** - 统一的代码风格和提交规范
- **CI/CD** - 自动化构建和部署流程

### 📦 主要依赖
- **vue** (3.5.18) - Vue.js核心库
- **element-plus** (2.11.5) - Element Plus组件库
- **vue-router** (4.5.1) - Vue路由管理
- **pinia** (3.0.3) - 状态管理
- **axios** (1.8.4) - HTTP客户端
- **@vueuse/core** (12.8.2) - Vue组合式工具库
- **nprogress** (0.2.0) - 进度条组件
- **path-to-regexp** (8.2.0) - 路径匹配工具

### 🔧 开发依赖
- **vite** (6.3.7) - 构建工具
- **typescript** (5.9.3) - TypeScript语言
- **@types/node** (22.13.14) - Node.js类型定义
- **eslint** (9.23.0) - 代码检查工具
- **sass** (1.86.1) - CSS预处理器
- **unplugin-auto-import** (19.1.2) - 自动导入插件
- **unplugin-vue-components** (28.4.1) - 组件自动导入
- **vite-plugin-mock** (3.0.2) - Mock数据插件

## 🎯 功能说明

### 系统管理
- **用户管理** - 用户列表、添加用户、编辑用户、删除用户
- **角色管理** - 角色列表、角色权限分配、角色成员管理
- **菜单管理** - 动态菜单配置、菜单权限控制、菜单排序
- **部门管理** - 组织架构管理、部门层级关系

### 业务功能
- **表格模板** - 多种表格展示方式、分页、搜索、排序
- **表单示例** - 动态表单、验证规则、表单布局
- **图表展示** - ECharts图表集成、数据可视化
- **文件上传** - 文件上传组件、拖拽上传、文件预览

### 系统特性
- **响应式布局** - 适配PC、平板、手机等多种设备
- **多标签页** - 支持多标签页切换、缓存管理
- **国际化** - 支持多语言切换
- **主题切换** - 支持深色/浅色主题切换
- **全屏模式** - 支持全屏浏览
- **快捷键** - 支持键盘快捷键操作

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
# 克隆项目
git clone https://github.com/midfar/vue3-element-admin.git

# 进入项目目录
cd vue3-element-admin

# 安装依赖（推荐使用pnpm）
pnpm install

# 或使用npm
npm install

# 或使用yarn
yarn install
```

### 开发环境
```bash
# 启动开发服务器（连接测试环境）
npm run dev:test

# 启动开发服务器（连接生产环境）
npm run dev:prod

# 默认访问地址
# http://localhost:8001
```

### 构建部署
```bash
# 构建测试环境
npm run build:test

# 构建生产环境
npm run build:prod

# 构建并预览
npm run preview
```

## 💻 代码示例

### 创建新页面
```typescript
// src/views/example/index.vue
<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <span>示例页面</span>
      </template>
      <div>页面内容</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello Vue 3!')
</script>
```

### 添加路由配置
```typescript
// src/router/modules/example.ts
import type { RouteRecordRaw } from 'vue-router'

const exampleRoutes: RouteRecordRaw = {
  path: '/example',
  component: () => import('@/layout/index.vue'),
  redirect: '/example/index',
  name: 'Example',
  meta: {
    title: '示例页面',
    icon: 'example'
  },
  children: [
    {
      path: 'index',
      component: () => import('@/views/example/index.vue'),
      name: 'ExampleIndex',
      meta: {
        title: '示例首页',
        icon: 'dashboard'
      }
    }
  ]
}

export default exampleRoutes
```

### 使用状态管理
```typescript
// src/store/modules/example.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useExampleStore = defineStore('example', () => {
  const count = ref(0)
  
  const increment = () => {
    count.value++
  }
  
  return {
    count,
    increment
  }
})
```

## 📋 项目结构

```
vue3-element-admin
├── public/                    # 静态资源
├── src/
│   ├── api/                   # API接口
│   ├── assets/                # 静态资源
│   ├── components/            # 全局组件
│   ├── directive/             # 自定义指令
│   ├── icons/                 # SVG图标
│   ├── layout/                # 布局组件
│   ├── router/                # 路由配置
│   ├── store/                 # 状态管理
│   ├── styles/                # 全局样式
│   ├── utils/                 # 工具函数
│   ├── views/                 # 页面组件
│   └── main.ts                # 应用入口
├── mock/                      # Mock数据
├── docs/                      # 项目文档
├── tests/                     # 测试文件
├── .env.*                     # 环境配置
├── vite.config.ts             # Vite配置
├── tsconfig.json              # TypeScript配置
├── package.json               # 项目依赖
└── README.md                  # 项目说明
```

## Recommended IDE & Plugins

## 🔧 配置指南

### 环境配置
项目支持多环境配置，通过不同的环境文件进行区分：

- `.env.dev_test` - 开发测试环境
- `.env.dev_prod` - 开发生产环境
- `.env.build_test` - 构建测试环境
- `.env.build_prod` - 构建生产环境

#### 关键配置项
```bash
# API基础路径
VITE_BASE_API = '/'

# 环境标识
VITE_ENV = 'development'

# Cookie配置（测试环境需要）
VITE_COOKIE = ''
```

### Vite配置
项目使用Vite作为构建工具，配置文件为 `vite.config.ts`，包含：
- Element Plus自动按需导入
- SVG图标处理
- Mock数据支持
- 代理配置

### TypeScript配置
项目使用TypeScript，配置文件为 `tsconfig.json`，提供：
- 严格的类型检查
- 路径别名配置
- 模块解析策略

## 🛠️ 开发环境

### 推荐IDE
- [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)
- [WebStorm](https://www.jetbrains.com/webstorm/)

### 开发工具
- [Vue DevTools](https://devtools.vuejs.org/) - Vue开发调试工具
- [Vite Plugin](https://vitejs.dev/guide/features.html) - Vite插件支持
- [Element Plus Playground](https://element-plus.run/) - Element Plus在线调试

## 🌐 浏览器支持

- 现代浏览器（Chrome, Firefox, Safari, Edge）
- Internet Explorer 11+（需要 [polyfills](https://github.com/zloirock/core-js)）
- [Electron](https://electronjs.org/) 桌面应用

## 📝 常见问题解答

### Q: 项目启动失败怎么办？
A: 请检查以下几点：
1. 确保Node.js版本 >= 18.0.0
2. 删除 `node_modules` 和 `pnpm-lock.yaml` 后重新安装依赖
3. 检查端口8001是否被占用

### Q: 如何修改API接口地址？
A: 修改对应的环境配置文件中的 `VITE_BASE_API` 变量，或使用代理配置。

### Q: 如何添加新的页面？
A: 
1. 在 `src/views/` 目录下创建新的页面组件
2. 在 `src/router/modules/` 中添加对应的路由配置
3. 在权限管理中配置相应的权限

### Q: 如何自定义主题？
A: 
1. 修改 `src/styles/element-variables.scss` 文件
2. 使用 Element Plus 主题定制工具
3. 重新构建项目以应用新主题

### Q: 如何启用Mock数据？
A: Mock数据默认在开发环境启用，生产环境需要在 `vite.config.ts` 中配置 `prodMock` 为 `true`。

## 🤝 贡献指南

### 开发流程
1. Fork 项目到您的仓库
2. 创建新的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的修改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范
- 使用 ESLint 进行代码检查
- 遵循 TypeScript 类型规范
- 编写单元测试
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

### 分支策略
- `main` - 主分支，稳定版本
- `develop` - 开发分支，集成测试
- `feature/*` - 功能分支
- `hotfix/*` - 热修复分支

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议发布。

## 🙋‍♂️ 技术支持

如有问题或建议，请通过以下方式联系我们：
- 📧 邮箱: admin@midfar.com
- 💬 提交 [Issue](https://github.com/midfar/vue3-element-admin/issues)

## 📋 更新日志

### v1.0.0 (2024-12)
- ✨ 初始版本发布
- 🏗️ 基于 Vue 3 + TypeScript + Element Plus + Vite 技术栈
- 🔐 完整的权限管理系统
- 📱 响应式布局设计
- 🌍 国际化支持
- 🚀 性能优化和代码分割
- 📚 完整的架构文档和使用指南

### 版本规划
- **v1.1.0** - 微前端架构支持
- **v1.2.0** - 服务端渲染(SSR)支持
- **v1.3.0** - AI智能功能集成
- **v2.0.0** - 移动端适配和PWA支持

---

## 英文说明

### Introduction

This template is built with the latest Vue 3 framework and the Element Plus UI library. It uses Vite as the build tool, Pinia for state management, Vue Router for routing, Mock.js for data simulation, and integrates TypeScript.

### Features
- **Latest Technology Stack**: Vue 3 + TypeScript + Element Plus + Vite
- **TypeScript**: Application-scale JavaScript development
- **Mock Data**: Built-in mock data solution
- **Permission System**: Comprehensive dynamic route and permission generation
- **Components**: Multiple commonly used components are re-encapsulated

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev:test

# Build for production
npm run build:prod
```

For detailed documentation, please visit: [Vue3 Element Admin Documentation](https://vue3-element-admin-site.midfar.com/guide/essentials/router-and-nav.html)


## 简介

这个模板使用了最新的 vue3 和 element-plus UI 框架，vite 构建工具、pinia 状态管理、vue-router 路由管理、mockjs 数据模拟，并集成了 typescript。功能从 Vue Element Admin 移植而来，详细使用可以参考[该文档](https://vue3-element-admin-site.midfar.com/zh/guide/essentials/router-and-nav.html)。

## 特性

- **最新技术栈**：使用 Vue3/vite3 等前端前沿技术开发
- **TypeScript**: 应用程序级 JavaScript 的语言
- **Mock 数据** 内置 Mock 数据方案
- **权限** 内置完善的动态路由权限生成方案
- **组件** 二次封装了多个常用的组件

## 在线示例

[vue3 element admin](https://vue3-element-admin.midfar.com/)

## 准备
开发前请确保熟悉并掌握以下技术栈：

- vue: https://cn.vuejs.org/
- TypeScript：https://www.tslang.cn/index.html
- element-plus：https://cn.element-plus.org/
- pinia: https://pinia.vuejs.org/zh/
- vue-router: https://router.vuejs.org/zh/

注：开发前请务必阅读上述所有文档。应用至实际项目开发请修改 readme 内容。

## 推荐的 IDE 工具和插件

[VSCode](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (需禁用旧插件 Vetur、Volar )

## Vite 构建工具配置

参考 [Vite 配置](https://vitejs.dev/config/)

## 主要结构

```
- mock // 模拟数据
- public
- src
  - components // 组件
  - views // 页面
    - tableTemplates // 示例模块
	  - index.ts
   - login // 登录模块
	  - index.vue
 - settings.ts // 全局配置
 - main.ts // 入口文件
-  types // TypeScript类型
- package.json
- CODE_OF_CONDUCT.md // 框架开发要求
- README.md //框架使用手册
```

## 使用

### 确定本地的node版本>=20。本地使用v20.18.0验证通过。

```sh
node -v
```

### 安装依赖

```sh
npm install
```

### 开发模式连接测试服

```sh
npm run dev:test
```

### 打包到测试服

```sh
npm run build:test
```

### 代码检查 [ESLint](https://eslint.org/)

```sh
npm run lint
```

## 支持环境

现代浏览器。

| Chrome          | Edge            | Firefox         | Safari          | 
| --------------- | --------------- | --------------- | --------------- | 
| Chrome ≥ 85     | Edge ≥ 85       | Firefox ≥ 79    | Safari ≥ 14.1   | 

## 参与贡献

我们非常欢迎你的贡献，你可以通过以下方式和我们一起共建基线框架：


