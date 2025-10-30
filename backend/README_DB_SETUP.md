# 数据库初始化解决方案

## 🚀 快速解决

你的数据库初始化问题已经解决！现在可以使用以下任一方法：

### 方法1：一键设置（推荐）
```bash
npm run setup
```

### 方法2：内存数据库（无需安装MongoDB）
```bash
npm run init:db:memory
```

### 方法3：本地MongoDB（需要安装MongoDB）
```bash
# 首先确保MongoDB正在运行
net start MongoDB  # Windows
# 或者
brew services start mongodb-community  # macOS

# 然后初始化数据库
npm run init:db
```

## 📋 问题总结

之前遇到的问题：
- ❌ `npm run init:db` 报错 "Missing script: 'init:db'"
- ❌ 本地MongoDB未安装或未启动

现在的解决方案：
- ✅ 创建了新的初始化脚本 `scripts/init-db-safe.js`
- ✅ 支持内存数据库模式（无需安装MongoDB）
- ✅ 改进了错误处理和用户提示
- ✅ 添加了多个便捷的npm脚本

## 🔧 可用脚本

| 脚本 | 说明 |
|------|------|
| `npm run setup` | 🔥 一键完成所有设置 |
| `npm run init:db:memory` | 使用内存数据库（推荐） |
| `npm run init:db` | 使用本地MongoDB |
| `npm run check:db` | 检查MongoDB连接 |
| `npm run dev` | 启动开发服务器 |

## 🎯 下一步

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **测试API**
   - 管理员登录：POST http://localhost:3000/api/auth/login
   - 用户名：`admin`
   - 密码：`admin123456`

3. **查看API文档**
   - 查看 `src/docs/` 目录下的文档
   - 或者导入Postman集合文件

## 💡 提示

- **内存数据库** 是最简单的选择，无需安装任何额外软件
- 如果需要 **持久化数据**，请安装并启动本地MongoDB
- 使用 `npm run check:db` 可以快速诊断连接问题

## 🆘 如果仍然有问题

1. 确保Node.js版本 >= 16
2. 尝试运行：`npm run check:db` 查看详细错误信息
3. 查看 `DATABASE_SETUP_GUIDE.md` 获取完整的安装指南
4. 使用内存数据库模式：`npm run init:db:memory`

数据库初始化问题已经完全解决！🎉