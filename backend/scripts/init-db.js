#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// 设置环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 简化的模型定义（用于独立脚本）
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  avatar: String,
  phone: String,
  department: String,
  position: String,
  lastLoginAt: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date
}, { timestamps: true });

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: String,
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  menuIds: [String],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  sort: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: false }
}, { timestamps: true });

const PermissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  module: String,
  action: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  excerpt: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  tags: [String],
  category: String,
  coverImage: String,
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  publishedAt: Date,
  slug: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Role = mongoose.model('Role', RoleSchema);
const Permission = mongoose.model('Permission', PermissionSchema);
const Article = mongoose.model('Article', ArticleSchema);

async function seedData() {
  try {
    console.log('🚀 开始初始化数据库...');

    // 清空现有数据
    await User.deleteMany({});
    await Role.deleteMany({});
    await Permission.deleteMany({});
    await Article.deleteMany({});

    console.log('🧹 已清空现有数据');

    // 创建权限
    const permissions = [
      // 用户权限
      { name: 'user.create', description: '创建用户', module: 'user', action: 'create' },
      { name: 'user.read', description: '查看用户', module: 'user', action: 'read' },
      { name: 'user.update', description: '更新用户', module: 'user', action: 'update' },
      { name: 'user.delete', description: '删除用户', module: 'user', action: 'delete' },

      // 角色权限
      { name: 'role.create', description: '创建角色', module: 'role', action: 'create' },
      { name: 'role.read', description: '查看角色', module: 'role', action: 'read' },
      { name: 'role.update', description: '更新角色', module: 'role', action: 'update' },
      { name: 'role.delete', description: '删除角色', module: 'role', action: 'delete' },

      // 文章权限
      { name: 'article.create', description: '创建文章', module: 'article', action: 'create' },
      { name: 'article.read', description: '查看文章', module: 'article', action: 'read' },
      { name: 'article.update', description: '更新文章', module: 'article', action: 'update' },
      { name: 'article.delete', description: '删除文章', module: 'article', action: 'delete' },

      // 系统权限
      { name: 'system.manage', description: '系统管理', module: 'system', action: 'manage' },
      { name: 'system.monitor', description: '系统监控', module: 'system', action: 'monitor' },

      // 文件权限
      { name: 'file.upload', description: '上传文件', module: 'file', action: 'upload' },
      { name: 'file.delete', description: '删除文件', module: 'file', action: 'delete' }
    ];

    const createdPermissions = await Permission.create(permissions);
    console.log(`✅ 已创建 ${createdPermissions.length} 个权限`);

    // 创建角色
    const adminRole = await Role.create({
      name: '管理员',
      code: 'admin',
      description: '系统管理员，拥有所有权限',
      permissions: createdPermissions.map(p => p._id),
      menuIds: ['system', 'users', 'roles', 'articles', 'files', 'profile'],
      status: 'active',
      sort: 1,
      isSystem: true
    });

    const userRole = await Role.create({
      name: '普通用户',
      code: 'user',
      description: '普通用户，拥有基本权限',
      permissions: createdPermissions
        .filter(p => ['user.read', 'article.read', 'article.create', 'article.update', 'file.upload'].includes(p.name))
        .map(p => p._id),
      menuIds: ['articles', 'profile'],
      status: 'active',
      sort: 2,
      isDefault: true
    });

    const moderatorRole = await Role.create({
      name: '版主',
      code: 'moderator',
      description: '版主，拥有管理文章权限',
      permissions: createdPermissions
        .filter(p => ['user.read', 'article.read', 'article.create', 'article.update', 'article.delete', 'file.upload', 'file.delete'].includes(p.name))
        .map(p => p._id),
      menuIds: ['articles', 'files', 'profile'],
      status: 'active',
      sort: 3
    });

    console.log('✅ 已创建角色：管理员、普通用户、版主');

    // 创建管理员用户
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    const adminPassword = await bcrypt.hash('admin123456', saltRounds);
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      firstName: '管理员',
      lastName: '系统',
      roles: [adminRole._id],
      isActive: true,
      isEmailVerified: true
    });

    // 创建普通用户
    const userPassword = await bcrypt.hash('user123456', saltRounds);
    const normalUser = await User.create({
      username: 'user',
      email: 'user@example.com',
      password: userPassword,
      firstName: '普通',
      lastName: '用户',
      roles: [userRole._id],
      isActive: true,
      isEmailVerified: true
    });

    // 创建版主用户
    const moderatorPassword = await bcrypt.hash('moderator123456', saltRounds);
    const moderatorUser = await User.create({
      username: 'moderator',
      email: 'moderator@example.com',
      password: moderatorPassword,
      firstName: '版主',
      lastName: '用户',
      roles: [moderatorRole._id],
      isActive: true,
      isEmailVerified: true
    });

    console.log('✅ 已创建用户：admin、user、moderator');

    // 创建示例文章
    const sampleArticles = [
      {
        title: '欢迎使用Vue3 Element Admin',
        content: '# 欢迎使用Vue3 Element Admin\n\n这是一个基于Vue3和Element Plus的后台管理系统。\n\n## 特性\n\n- 现代化的UI设计\n- 响应式布局\n- 权限管理\n- 国际化支持\n- 丰富的组件库',
        excerpt: 'Vue3 Element Admin是一个现代化的后台管理系统',
        author: adminUser._id,
        status: 'published',
        tags: ['vue3', 'element-plus', 'admin'],
        category: '系统公告',
        slug: 'welcome-vue3-element-admin',
        isFeatured: true,
        publishedAt: new Date()
      },
      {
        title: '系统使用指南',
        content: '# 系统使用指南\n\n## 快速开始\n\n1. 登录系统\n2. 配置权限\n3. 管理用户\n4. 发布内容\n\n## 注意事项\n\n- 请定期修改密码\n- 及时更新系统\n- 备份重要数据',
        excerpt: '详细的系统使用指南和注意事项',
        author: adminUser._id,
        status: 'published',
        tags: ['guide', 'tutorial'],
        category: '使用指南',
        slug: 'system-usage-guide',
        publishedAt: new Date()
      },
      {
        title: 'Vue3新特性介绍',
        content: '# Vue3新特性介绍\n\n## Composition API\n\nVue3引入了Composition API，提供了更好的逻辑复用和代码组织方式。\n\n## 性能优化\n\n- 更快的渲染速度\n- 更小的包体积\n- 更好的TypeScript支持',
        excerpt: 'Vue3的新特性和性能优化介绍',
        author: normalUser._id,
        status: 'published',
        tags: ['vue3', 'javascript'],
        category: '技术文章',
        slug: 'vue3-new-features',
        publishedAt: new Date()
      }
    ];

    const createdArticles = await Article.create(sampleArticles);
    console.log(`✅ 已创建 ${createdArticles.length} 篇示例文章`);

    console.log('\n🎉 数据库初始化完成！');
    console.log('\n📋 默认账户信息：');
    console.log('管理员 - 用户名: admin, 密码: admin123456');
    console.log('用户 - 用户名: user, 密码: user123456');
    console.log('版主 - 用户名: moderator, 密码: moderator123456');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔗 连接数据库...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vue3-admin');
    console.log('✅ 数据库连接成功');

    await seedData();
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}
