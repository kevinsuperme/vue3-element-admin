# 样式与UI规范指南

> Vue3 Element Admin 统一的样式编写标准

---

## 📋 CSS 预处理器

本项目使用 **SASS (SCSS)** 作为 CSS 预处理器

```scss
// ✅ 使用 SCSS 语法
.user-card {
  padding: 20px;

  .header {
    font-size: 18px;
    font-weight: bold;
  }
}

// ❌ 不使用 SASS 缩进语法
.user-card
  padding: 20px
```

---

## 🎨 CSS 变量系统

### Element Plus 主题变量

```scss
// src/styles/variables.scss

// ==================== 颜色变量 ====================
$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$info-color: #909399;

// 文本颜色
$text-primary: #303133;
$text-regular: #606266;
$text-secondary: #909399;
$text-placeholder: #c0c4cc;

// 边框颜色
$border-base: #dcdfe6;
$border-light: #e4e7ed;
$border-lighter: #ebeef5;
$border-extra-light: #f2f6fc;

// 背景颜色
$bg-color: #ffffff;
$bg-page: #f2f3f5;

// ==================== 尺寸变量 ====================
$--header-height: 50px;
$--sidebar-width: 210px;
$--sidebar-collapsed-width: 64px;
$--tag-view-height: 34px;

// 间距
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 20px;
$spacing-xxl: 24px;

// 圆角
$border-radius-base: 4px;
$border-radius-small: 2px;
$border-radius-large: 6px;
$border-radius-circle: 50%;

// 阴影
$box-shadow-base: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
$box-shadow-light: 0 2px 8px 0 rgba(0, 0, 0, 0.06);
$box-shadow-hover: 0 4px 16px 0 rgba(0, 0, 0, 0.12);

// ==================== 动画变量 ====================
$transition-base: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
$transition-fast: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
```

### CSS 自定义属性 (推荐)

```scss
// src/styles/variables.module.scss
:export {
  primaryColor: $primary-color;
  sidebarWidth: $--sidebar-width;
}
```

```vue
<script setup lang="ts">
import variables from '@/styles/variables.module.scss'

console.log(variables.primaryColor) // 在 JS 中使用 SCSS 变量
</script>
```

---

## 📏 样式架构

### 目录结构

```
src/styles/
├── index.scss              # 全局样式入口
├── variables.scss          # 变量定义
├── variables.module.scss   # 可导出变量
├── mixins.scss            # Mixin 工具
├── transition.scss        # 过渡动画
├── element-ui.scss        # Element Plus 主题定制
├── sidebar.scss           # 侧边栏样式
├── reset.scss             # 样式重置
└── common.scss            # 通用工具类
```

### index.scss 全局入口

```scss
// src/styles/index.scss
@import './variables.scss';
@import './mixins.scss';
@import './transition.scss';
@import './element-ui.scss';
@import './reset.scss';
@import './sidebar.scss';
@import './common.scss';

// 全局样式
body {
  height: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-family: Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif;
}

html {
  height: 100%;
  box-sizing: border-box;
}

*,
*:before,
*:after {
  box-sizing: inherit;
}

// 滚动条样式
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }
}
```

---

## 🛠️ Mixin 工具库

```scss
// src/styles/mixins.scss

// ==================== 清除浮动 ====================
@mixin clearfix {
  &::after {
    content: "";
    display: table;
    clear: both;
  }
}

// ==================== 文本省略 ====================
@mixin ellipsis($lines: 1) {
  @if $lines == 1 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// ==================== Flex 布局 ====================
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@mixin flex-start {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

// ==================== 响应式断点 ====================
@mixin respond-to($breakpoint) {
  @if $breakpoint == "mobile" {
    @media (max-width: 768px) {
      @content;
    }
  } @else if $breakpoint == "tablet" {
    @media (min-width: 769px) and (max-width: 1024px) {
      @content;
    }
  } @else if $breakpoint == "desktop" {
    @media (min-width: 1025px) {
      @content;
    }
  }
}

// ==================== 阴影效果 ====================
@mixin box-shadow($type: "base") {
  @if $type == "base" {
    box-shadow: $box-shadow-base;
  } @else if $type == "light" {
    box-shadow: $box-shadow-light;
  } @else if $type == "hover" {
    box-shadow: $box-shadow-hover;
  }
}

// ==================== 过渡动画 ====================
@mixin transition($property: all, $duration: 0.3s, $timing: ease) {
  transition: $property $duration $timing;
}

// 使用示例
.example {
  @include ellipsis(2);
  @include flex-between;
  @include box-shadow('hover');
  @include transition(all, 0.2s);

  @include respond-to('mobile') {
    padding: 10px;
  }
}
```

---

## 🎯 BEM 命名规范

```scss
// ✅ 推荐 - 使用 BEM (Block Element Modifier)

// Block
.user-card {
  // Element
  &__header {
    font-size: 18px;
  }

  &__body {
    padding: 20px;
  }

  &__footer {
    border-top: 1px solid #ddd;
  }

  // Modifier
  &--large {
    width: 500px;
  }

  &--small {
    width: 300px;
  }

  // State (使用 is- 前缀)
  &.is-active {
    border-color: $primary-color;
  }

  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
```

```html
<!-- HTML 使用 -->
<div class="user-card user-card--large is-active">
  <div class="user-card__header">标题</div>
  <div class="user-card__body">内容</div>
  <div class="user-card__footer">底部</div>
</div>
```

---

## 📐 布局规范

### 1. Flex 布局

```scss
// ✅ 推荐 - 优先使用 Flex 布局
.container {
  display: flex;
  flex-direction: row;    // row | column
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

// 常用布局模式
.layout {
  // 水平居中
  &--center {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  // 左右分布
  &--between {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  // 等间距分布
  &--around {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
}
```

### 2. Grid 布局

```scss
// ✅ 复杂布局使用 Grid
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;

  @include respond-to('mobile') {
    grid-template-columns: 1fr;
  }
}
```

---

## 🎨 组件样式编写规范

### Scoped Styles

```vue
<template>
  <div class="user-profile">
    <div class="user-profile__header">
      <h2 class="title">{{ title }}</h2>
    </div>
    <div class="user-profile__content">
      <p>内容</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ==================== 变量导入 ====================
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

// ==================== 组件根元素 ====================
.user-profile {
  padding: $spacing-xl;
  background-color: $bg-color;
  border-radius: $border-radius-base;
  box-shadow: $box-shadow-base;

  // ==================== 子元素 ====================
  &__header {
    @include flex-between;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid $border-light;

    .title {
      @include ellipsis(1);
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
    }
  }

  &__content {
    p {
      line-height: 1.6;
      color: $text-regular;
    }
  }

  // ==================== 状态修饰 ====================
  &.is-loading {
    opacity: 0.6;
    pointer-events: none;
  }

  // ==================== 响应式 ====================
  @include respond-to('mobile') {
    padding: $spacing-md;
  }
}

// ==================== Deep 选择器 ====================
// 修改 Element Plus 组件样式
:deep(.el-button) {
  margin-left: $spacing-sm;
}

// ==================== Global 选择器 ====================
// 定义全局样式（谨慎使用）
:global(.custom-class) {
  color: red;
}
</style>
```

---

## 🌈 主题定制

### Element Plus 主题变量覆盖

```scss
// src/styles/element-ui.scss
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': (
      'base': #409eff,
    ),
    'success': (
      'base': #67c23a,
    ),
    'warning': (
      'base': #e6a23c,
    ),
    'danger': (
      'base': #f56c6c,
    ),
    'error': (
      'base': #f56c6c,
    ),
    'info': (
      'base': #909399,
    ),
  ),
  $border-radius: (
    'base': 4px,
    'small': 2px,
    'large': 6px,
    'circle': 50%,
  )
);

// 组件样式覆盖
.el-button {
  font-weight: 500;
}

.el-table {
  // 表格样式定制
}
```

---

## ✅ 样式编写检查清单

### 通用规则
- [ ] 使用 SCSS 预处理器
- [ ] 遵循 BEM 命名规范
- [ ] 使用 scoped 防止样式污染
- [ ] 导入必要的变量和 mixin
- [ ] 样式按功能分组并添加注释

### 性能优化
- [ ] 避免深层嵌套（最多3层）
- [ ] 避免使用 ID 选择器
- [ ] 避免使用 !important
- [ ] 合理使用 CSS 变量
- [ ] 移除未使用的样式

### 响应式设计
- [ ] 使用相对单位（rem, em, %, vh/vw）
- [ ] 添加移动端适配
- [ ] 测试不同屏幕尺寸
- [ ] 使用媒体查询断点

### 可维护性
- [ ] 变量命名语义化
- [ ] Mixin 可复用
- [ ] 样式模块化
- [ ] 添加必要注释

---

**下一步**: 查看 [目录结构规范](./directory-structure.md) | [TypeScript规范](./typescript-guide.md)