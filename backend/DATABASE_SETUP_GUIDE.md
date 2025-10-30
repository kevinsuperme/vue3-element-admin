# 数据库设置指南

## 🎯 快速开始

### 方法1：使用内存数据库（推荐）
```bash
# 一键设置（安装依赖 + 初始化内存数据库）
npm run setup

# 或者手动执行
npm install
npm run init:db:memory
```

### 方法2：使用本地MongoDB
```bash
# 1. 安装MongoDB（如果未安装）
# 2. 启动MongoDB服务
# 3. 初始化数据库
npm run init:db
```

## 📋 可用脚本

| 脚本 | 说明 |
|------|------|
| `npm run init:db` | 使用本地MongoDB初始化数据库 |
| `npm run init:db:memory` | 使用内存数据库初始化 |
| `npm run init:db:safe` | 安全模式初始化（带错误处理） |
| `npm run check:db` | 检查MongoDB连接状态 |
| `npm run setup` | 一键设置（安装依赖+内存数据库） |

## 🔧 MongoDB安装指南

### Windows
1. **下载安装包**
   - 访问：https://www.mongodb.com/try/download/community
   - 选择Windows版本下载

2. **安装MongoDB**
   ```bash
   # 使用安装向导完成安装
   # 记住安装路径，默认为：C:\Program Files\MongoDB\Server\5.0\
   ```

3. **启动MongoDB服务**
   ```bash
   # 以管理员身份运行PowerShell
   net start MongoDB
   
   # 如果服务不存在，手动创建
   mongod --dbpath "C:\data\db" --logpath "C:\data\log\mongod.log" --install
   net start MongoDB
   ```

### macOS
```bash
# 使用Homebrew安装
brew tap mongodb/brew
brew install mongodb-community

# 启动服务
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)
```bash
# 导入公钥
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# 创建列表文件
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# 更新包数据库并安装
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 🧪 连接测试

### 测试本地MongoDB
```bash
npm run check:db
```

### 手动测试连接
```bash
# 使用mongo shell
mongo

# 在mongo shell中执行
show dbs
use vue3-admin
show collections
```

## ⚙️ 环境配置

### 环境变量文件
项目会自动加载 `.env` 文件，如果没有会自动从 `.env.example` 复制：

```bash
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/vue3-admin
DB_HOST=localhost
DB_PORT=27017

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# 默认管理员账户
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123456
DEFAULT_ADMIN_EMAIL=admin@example.com
```

### 自定义数据库连接
```bash
# 修改.env文件中的MONGODB_URI
MONGODB_URI=mongodb://username:password@host:port/database
```

## 🚨 常见问题

### 1. 连接被拒绝 (ECONNREFUSED)
```bash
❌ connect ECONNREFUSED ::1:27017

💡 解决方案：
- 检查MongoDB是否启动：net start MongoDB (Windows)
- 检查端口是否正确：默认27017
- 检查防火墙设置
```

### 2. 认证失败
```bash
❌ Authentication failed

💡 解决方案：
- 检查用户名和密码
- 检查认证数据库
- 确保用户有相应权限
```

### 3. 超时错误
```bash
❌ connection timeout

💡 解决方案：
- 检查网络连接
- 增加超时时间
- 检查服务器地址
```

## 🎮 开发模式

### 使用内存数据库开发
```bash
# 启动内存数据库（适合开发测试）
npm run init:db:memory

# 启动开发服务器
npm run dev
```

### 使用本地数据库开发
```bash
# 确保MongoDB运行
net start MongoDB

# 初始化数据库
npm run init:db

# 启动开发服务器
npm run dev
```

## 📊 数据库结构

初始化后会创建以下数据：

### 权限 (Permissions)
- user.create, user.read, user.update, user.delete
- role.create, role.read, role.update, role.delete
- article.create, article.read, article.update, article.delete
- system.manage, system.monitor
- file.upload, file.delete

### 角色 (Roles)
- **管理员 (admin)**：拥有所有权限
- **普通用户 (user)**：基本权限
- **版主 (moderator)**：文章管理权限

### 默认用户
- **admin/admin123456**：系统管理员
- **user/user123456**：普通用户
- **moderator/moderator123456**：版主

### 示例文章
- 欢迎使用Vue3 Element Admin
- 系统使用指南
- Vue3新特性介绍

## 🔍 调试技巧

### 查看详细错误
```bash
# 设置调试模式
DEBUG=* npm run init:db

# 或者修改脚本添加console.log
```

### MongoDB日志
```bash
# Windows
C:\data\log\mongod.log

# macOS/Linux
/var/log/mongodb/mongod.log
```

### 手动连接测试
```javascript
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/vue3-admin')
  .then(() => console.log('连接成功'))
  .catch(err => console.error('连接失败:', err));
```

## 📚 相关资源

- [MongoDB官方文档](https://docs.mongodb.com/)
- [Mongoose文档](https://mongoosejs.com/docs/)
- [MongoDB安装指南](https://docs.mongodb.com/manual/installation/)
- [MongoDB内存服务器](https://github.com/nodkz/mongodb-memory-server)

## 🆘 获取帮助

如果仍然遇到问题：

1. 检查MongoDB服务状态
2. 查看详细错误日志
3. 使用内存数据库作为替代方案
4. 在GitHub Issues中寻求帮助