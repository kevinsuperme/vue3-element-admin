import mongoose from 'mongoose';
import { User, Role, Permission, Article } from '../models';
import config from '../config';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

const seedData = async () => {
  try {
    logger.info('🚀 开始初始化数据库...');

    // 清空现有数据
    await User.deleteMany({});
    await Role.deleteMany({});
    await Permission.deleteMany({});
    await Article.deleteMany({});

    logger.info('🧹 已清空现有数据');

    // 创建权限
    const permissions = [
      // 用户权限
      { name: 'user.create', description: '创建用户' },
      { name: 'user.read', description: '查看用户' },
      { name: 'user.update', description: '更新用户' },
      { name: 'user.delete', description: '删除用户' },

      // 角色权限
      { name: 'role.create', description: '创建角色' },
      { name: 'role.read', description: '查看角色' },
      { name: 'role.update', description: '更新角色' },
      { name: 'role.delete', description: '删除角色' },

      // 文章权限
      { name: 'article.create', description: '创建文章' },
      { name: 'article.read', description: '查看文章' },
      { name: 'article.update', description: '更新文章' },
      { name: 'article.delete', description: '删除文章' },

      // 系统权限
      { name: 'system.manage', description: '系统管理' },
      { name: 'system.monitor', description: '系统监控' },

      // 文件权限
      { name: 'file.upload', description: '上传文件' },
      { name: 'file.delete', description: '删除文件' }
    ];

    const createdPermissions = await Permission.create(permissions);
    logger.info(`✅ 已创建 ${createdPermissions.length} 个权限`);

    // 创建角色
    const adminRole = await Role.create({
      name: '管理员',
      code: 'admin',
      description: '系统管理员，拥有所有权限',
      permissions: createdPermissions.map(p => p._id),
      status: 'active',
      sort: 1
    });

    const userRole = await Role.create({
      name: '普通用户',
      code: 'user',
      description: '普通用户，拥有基本权限',
      permissions: createdPermissions
        .filter(p => ['user.read', 'article.read', 'article.create', 'article.update', 'file.upload'].includes(p.name))
        .map(p => p._id),
      status: 'active',
      sort: 2
    });

    const moderatorRole = await Role.create({
      name: '版主',
      code: 'moderator',
      description: '版主，拥有管理文章权限',
      permissions: createdPermissions
        .filter(p => ['user.read', 'article.read', 'article.create', 'article.update', 'article.delete', 'file.upload', 'file.delete'].includes(p.name))
        .map(p => p._id),
      status: 'active',
      sort: 3
    });

    logger.info('✅ 已创建角色：管理员、普通用户、版主');

    // 创建管理员用户
    const adminPassword = await bcrypt.hash('admin123456', config.security.bcryptSaltRounds);
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
    const userPassword = await bcrypt.hash('user123456', config.security.bcryptSaltRounds);
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
    const moderatorPassword = await bcrypt.hash('moderator123456', config.security.bcryptSaltRounds);
    await User.create({
      username: 'moderator',
      email: 'moderator@example.com',
      password: moderatorPassword,
      firstName: '版主',
      lastName: '用户',
      roles: [moderatorRole._id],
      isActive: true,
      isEmailVerified: true
    });

    logger.info('✅ 已创建用户：admin、user、moderator');

    // 创建示例文章
    const sampleArticles = [
      {
        title: '欢迎使用Vue3 Element Admin',
        content: '# 欢迎使用Vue3 Element Admin\n\n这是一个基于Vue3和Element Plus的后台管理系统。\n\n## 特性\n\n- 现代化的UI设计\n- 响应式布局\n- 权限管理\n- 国际化支持\n- 丰富的组件库',
        author: adminUser._id,
        status: 'published',
        tags: ['vue3', 'element-plus', 'admin'],
        category: '系统公告'
      },
      {
        title: '系统使用指南',
        content: '# 系统使用指南\n\n## 快速开始\n\n1. 登录系统\n2. 配置权限\n3. 管理用户\n4. 发布内容\n\n## 注意事项\n\n- 请定期修改密码\n- 及时更新系统\n- 备份重要数据',
        author: adminUser._id,
        status: 'published',
        tags: ['guide', 'tutorial'],
        category: '使用指南'
      },
      {
        title: 'Vue3新特性介绍',
        content: '# Vue3新特性介绍\n\n## Composition API\n\nVue3引入了Composition API，提供了更好的逻辑复用和代码组织方式。\n\n## 性能优化\n\n- 更快的渲染速度\n- 更小的包体积\n- 更好的TypeScript支持',
        author: normalUser._id,
        status: 'published',
        tags: ['vue3', 'javascript'],
        category: '技术文章'
      }
    ];

    const createdArticles = await Article.create(sampleArticles);
    logger.info(`✅ 已创建 ${createdArticles.length} 篇示例文章`);

    logger.info('\n🎉 数据库初始化完成！');
    logger.info('\n📋 默认账户信息：');
    logger.info('管理员 - 用户名: admin, 密码: admin123456');
    logger.info('用户 - 用户名: user, 密码: user123456');
    logger.info('版主 - 用户名: moderator, 密码: moderator123456');
  } catch (error) {
    logger.error('❌ 数据库初始化失败:', error);
    throw error;
  }
};

const main = async () => {
  try {
    // 连接数据库
    await mongoose.connect(config.database.uri);
    logger.info('🔗 数据库连接成功');

    // 执行种子数据
    await seedData();
  } catch (error) {
    logger.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('🔌 数据库连接已关闭');
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export default seedData;
