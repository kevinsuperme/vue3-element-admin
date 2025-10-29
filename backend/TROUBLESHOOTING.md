# 后端系统故障排查指南

## 🔍 常见问题及解决方案

### 1. "找不到模块或其相应的类型声明" 错误

#### 问题表现
```
找不到模块'../utils/ipUtils'或其相应的类型声明。ts(2307)
```

#### 可能原因
1. VS Code TypeScript 服务器缓存问题
2. `node_modules` 未正确安装
3. TypeScript 版本不兼容
4. 文件路径大小写问题（Windows/Linux差异）

#### 解决步骤

##### 步骤 1: 重启 TypeScript 服务器
1. 在 VS Code 中按 `Ctrl + Shift + P`（Mac: `Cmd + Shift + P`）
2. 输入 "TypeScript: Restart TS Server"
3. 选择并执行

##### 步骤 2: 重新安装依赖
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

##### 步骤 3: 清理 TypeScript 缓存
```bash
# 删除编译输出
rm -rf dist

# 清理 VS Code 缓存（可选）
# Windows: %APPDATA%\Code\Cache
# Mac: ~/Library/Application Support/Code/Cache
# Linux: ~/.config/Code/Cache
```

##### 步骤 4: 验证 tsconfig.json
确保 `tsconfig.json` 配置正确：
```json
{
  "compilerOptions": {
    "moduleResolution": "node10",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

##### 步骤 5: 检查文件是否存在
```bash
# 验证文件存在
ls -la src/utils/ipUtils.ts

# 验证导出语法
grep "export" src/utils/ipUtils.ts
```

---

### 2. "moduleResolution=node10 已弃用" 警告

#### 问题表现
```
选项'moduleResolution=node10'已弃用，并将停止在 TypeScript 7.0 中运行。
指定 compilerOption"ignoreDeprecations":"5.0"以忽略此错误。
```

#### 解决方案

**方案 A: 添加忽略标记（推荐）**
```json
{
  "compilerOptions": {
    "moduleResolution": "node10",
    "ignoreDeprecations": "5.0"
  }
}
```

**方案 B: 升级到 bundler（如果使用打包工具）**
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

**方案 C: 保持 node（等待 TS 8.0）**
```json
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
```

---

### 3. 拼写检查提示（cSpell）

#### 问题表现
```
"maxsize": Unknown word. cSpell
"vueuse": Unknown word. cSpell
```

#### 解决方案

##### 方案 A: 添加到项目字典（推荐）
已创建 `.vscode/cspell.json` 和 `.vscode/settings.json`，包含常用词汇。

##### 方案 B: 临时禁用
在 VS Code 设置中：
```json
{
  "cSpell.enabled": false
}
```

##### 方案 C: 添加到用户字典
1. 右键点击提示的单词
2. 选择 "Add to Dictionary"
3. 选择 "User Dictionary" 或 "Workspace Dictionary"

---

### 4. 编译错误 "Property does not exist"

#### 问题表现
```typescript
Property 'stats' does not exist on type '{ status: string; ... }'
```

#### 解决方案
添加完整的类型定义，包括可选属性：
```typescript
const health: {
  mongodb: {
    status: string;
    host: string;
    port: number;
    name: string;
    stats?: {  // 使用可选属性
      userCount: number;
      roleCount: number;
    };
  };
} = { /* ... */ };
```

---

### 5. Winston Logger 配置错误

#### 问题表现
```
"maxSize": Unknown property
```

#### 解决方案
Winston 3.x 使用小写命名：
```typescript
// ❌ 错误
new winston.transports.File({
  maxSize: 10485760
})

// ✅ 正确
new winston.transports.File({
  maxsize: 10485760  // 注意小写
})
```

---

## 🔧 快速修复命令

### 完整的重置流程
```bash
# 1. 清理所有缓存
cd backend
rm -rf node_modules dist package-lock.json

# 2. 重新安装依赖
npm install

# 3. 编译检查
npx tsc --noEmit

# 4. 运行项目
npm run dev
```

### VS Code 快捷键
- **重启 TS Server**: `Ctrl/Cmd + Shift + P` → "TypeScript: Restart TS Server"
- **重新加载窗口**: `Ctrl/Cmd + Shift + P` → "Developer: Reload Window"
- **打开输出面板**: `Ctrl/Cmd + Shift + U`

---

## 📚 参考文档

- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Winston Configuration](https://github.com/winstonjs/winston#creating-your-own-logger)
- [Mongoose Schema Types](https://mongoosejs.com/docs/schematypes.html)
- [VS Code TypeScript](https://code.visualstudio.com/docs/languages/typescript)

---

## 🆘 仍然无法解决？

### 检查清单
- [ ] Node.js 版本 >= 16.0.0
- [ ] TypeScript 版本 >= 5.0.0
- [ ] 已安装所有依赖 `npm install`
- [ ] 已重启 TypeScript 服务器
- [ ] 已重启 VS Code
- [ ] 文件路径正确（相对路径）
- [ ] 文件存在且可读

### 获取帮助
1. 查看 TypeScript 编译器输出：`npx tsc --noEmit`
2. 检查 VS Code 输出面板：查看 TypeScript 日志
3. 创建最小可复现示例
4. 提交 GitHub Issue

---

**最后更新**: 2025-10-30
**维护者**: Backend Team