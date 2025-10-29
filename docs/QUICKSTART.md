# Vue3 Element Admin - 数据库快速启动指南

**⚡ 5分钟快速部署数据库**

---

## 📦 文件说明

- `mhxy.sql` - **优化后的完整数据库**（v2.0，推荐使用）
- `mhxy_v1_backup.sql` - 旧版本备份（v1.0）
- `database_migration_v1_to_v2.sql` - 升级脚本（从v1.0升级到v2.0）

---

## 🚀 快速开始（新项目）

### 1. 导入数据库

```bash
# 方法A：命令行导入（推荐）
mysql -u root -p < mhxy.sql

# 方法B：使用 MySQL Workbench
# 打开 MySQL Workbench → Data Import → Import from Self-Contained File → 选择 mhxy.sql
```

### 2. 验证安装

```sql
USE mhxy;

-- 检查表是否创建成功
SHOW TABLES;

-- 应该看到以下关键表：
-- ✅ user_tokens (新增)
-- ✅ role_routes_cache (新增)
-- ✅ article_versions (新增)

-- 验证用户表
SELECT id, username, name FROM users;

-- 验证系统配置
SELECT * FROM system_configs WHERE `group` = 'auth';
```

### 3. 测试登录

```sql
-- 测试账号
-- 用户名: admin  密码: admin123456
-- 用户名: editor 密码: editor123456

SELECT
  u.id, u.username, u.name,
  GROUP_CONCAT(r.key) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin'
GROUP BY u.id;
```

---

## 🔄 升级现有数据库（从v1.0到v2.0）

### 步骤1：备份现有数据

```bash
mysqldump -u root -p mhxy > mhxy_backup_$(date +%Y%m%d).sql
```

### 步骤2：执行升级脚本

```bash
mysql -u root -p mhxy < database_migration_v1_to_v2.sql
```

### 步骤3：验证升级结果

```sql
USE mhxy;

-- 检查新表
SHOW TABLES LIKE '%token%';
SHOW TABLES LIKE '%cache%';
SHOW TABLES LIKE '%version%';

-- 检查字段修改
DESC users;  -- 应该有 'name' 字段，不是 'nickname'

-- 检查版本号
SELECT * FROM system_configs WHERE `key` = 'database_version';
-- 应该显示 2.0
```

---

## 🔧 配置后端

### Node.js Express 示例

#### 1. 安装依赖

```bash
npm install mysql2 bcryptjs jsonwebtoken dotenv
```

#### 2. 配置环境变量

创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mhxy

# JWT配置
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7200

# 服务器配置
PORT=3000
```

#### 3. 创建数据库连接

```javascript
// config/database.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
```

#### 4. 测试连接

```javascript
// test-connection.js
import db from './config/database.js';

async function testConnection() {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM users');
    console.log('✅ 数据库连接成功！');
    console.log(`📊 用户数量: ${rows[0].count}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

testConnection();
```

运行测试：
```bash
node test-connection.js
```

---

## 📋 快速测试清单

### ✅ 数据库安装验证

```bash
# 1. 登录 MySQL
mysql -u root -p

# 2. 使用数据库
USE mhxy;

# 3. 检查关键表
SHOW TABLES;

# 4. 检查用户数据
SELECT * FROM users;

# 5. 检查系统配置
SELECT * FROM system_configs;

# 6. 退出
EXIT;
```

### ✅ API 功能测试（使用 curl）

```bash
# 1. 用户登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'

# 预期返回:
# {"code":20000,"data":{"token":"eyJhbGciOiJIUzI1..."}}

# 2. 获取用户信息（替换YOUR_TOKEN）
curl http://localhost:3000/api/user/info?token=YOUR_TOKEN

# 预期返回:
# {"code":20000,"data":{"name":"Super Admin","avatar":"...","roles":["admin"]}}

# 3. 获取路由
curl http://localhost:3000/api/routes \
  -H "Authorization: Bearer YOUR_TOKEN"

# 预期返回:
# {"code":20000,"data":[{"path":"/dashboard",...}]}
```

---

## 🔥 核心功能实现示例

### 最小化登录API（5分钟实现）

```javascript
// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 查询用户
    const [users] = await db.query(`
      SELECT u.*, GROUP_CONCAT(r.key) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.username = ? AND u.status = 1 AND u.deleted_at IS NULL
      GROUP BY u.id
    `, [username]);

    if (users.length === 0) {
      return res.status(401).json({ code: 60204, message: '用户名或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const isValid = await bcrypt.compare(password + user.salt, user.password);
    if (!isValid) {
      return res.status(401).json({ code: 60204, message: '用户名或密码错误' });
    }

    // 生成token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 存储token
    await db.query(`
      INSERT INTO user_tokens (user_id, token, expires_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))
    `, [user.id, token, parseInt(process.env.JWT_EXPIRES_IN)]);

    res.json({ code: 20000, data: { token } });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ code: 50000, message: '服务器错误' });
  }
});

export default router;
```

### app.js 主文件

```javascript
// app.js
import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
```

### 运行

```bash
node app.js
```

---

## 🎯 下一步

1. ✅ **数据库已就绪**
2. ⏭️ 实现完整的后端API（参考 [database-optimization-report.md](database-optimization-report.md)）
3. ⏭️ 集成前端项目
4. ⏭️ 部署到生产环境

---

## 🐛 常见问题

### Q1: 导入数据库时报错 "Unknown collation: 'utf8mb4_unicode_ci'"

**解决方案**:
```sql
-- 修改数据库字符集
ALTER DATABASE mhxy CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### Q2: 密码验证失败

**原因**: 示例数据中的密码是哈希后的，需要重新生成。

**解决方案**:
```javascript
import bcrypt from 'bcryptjs';

const password = 'admin123456';
const salt = 'salt_admin';
const hash = await bcrypt.hash(password + salt, 10);
console.log(hash);

// 更新数据库
// UPDATE users SET password = '新hash值' WHERE username = 'admin';
```

### Q3: Token验证失败

**检查点**:
1. JWT_SECRET 是否配置正确
2. token 是否过期
3. user_tokens 表中是否有记录

**调试**:
```sql
-- 查看所有token
SELECT * FROM user_tokens WHERE user_id = 1;

-- 删除过期token
DELETE FROM user_tokens WHERE expires_at < NOW();
```

### Q4: 路由缓存不生效

**解决方案**:
```sql
-- 清空缓存
DELETE FROM role_routes_cache;

-- 重新生成（调用 GET /api/routes 接口）
```

---

## 📞 技术支持

- 📖 完整文档: [database-optimization-report.md](database-optimization-report.md)
- 🐛 问题反馈: GitHub Issues
- 💬 技术交流: kevinsuperme

---

**快速启动指南 v1.0**
**最后更新**: 2025-10-30
