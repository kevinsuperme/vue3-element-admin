-- Vue3 Element Admin 数据库结构（优化版）
-- 数据库名称: mhxy
-- 创建时间: 2024-10-30
-- 版本: 2.0
-- 优化内容:
--   1. 添加 user_tokens 表（JWT管理）
--   2. 添加 role_routes_cache 表（权限路由缓存）
--   3. 统一字段命名（nickname → name）
--   4. 优化数据库索引
--   5. 添加审计字段（created_by, updated_by）
--   6. 添加软删除支持（deleted_at）

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `mhxy` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `mhxy`;

-- ============================================
-- 用户认证相关表
-- ============================================

-- 用户表
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码(加密)',
  `salt` varchar(50) DEFAULT NULL COMMENT '密码盐值',
  `name` varchar(50) DEFAULT NULL COMMENT '姓名',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `introduction` text COMMENT '个人介绍',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态: 0-禁用, 1-启用',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(50) DEFAULT NULL COMMENT '最后登录IP',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间（软删除）',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`),
  KEY `idx_status` (`status`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_status_login` (`status`, `last_login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 🔴 CRITICAL: 用户Token表（JWT管理）
CREATE TABLE `user_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Token ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `token` varchar(500) NOT NULL COMMENT 'JWT token',
  `device_type` varchar(50) DEFAULT NULL COMMENT '设备类型: web, mobile, ios, android',
  `device_name` varchar(100) DEFAULT NULL COMMENT '设备名称',
  `ip_address` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '用户代理',
  `expires_at` datetime NOT NULL COMMENT '过期时间',
  `last_used_at` datetime DEFAULT NULL COMMENT '最后使用时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_token` (`token`(255)),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_user_expires` (`user_id`, `expires_at`),
  CONSTRAINT `fk_user_tokens_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户Token表';

-- ============================================
-- 角色权限相关表
-- ============================================

-- 角色表
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `key` varchar(50) NOT NULL COMMENT '角色标识',
  `name` varchar(50) NOT NULL COMMENT '角色名称',
  `description` varchar(255) DEFAULT NULL COMMENT '角色描述',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态: 0-禁用, 1-启用',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间（软删除）',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_key` (`key`),
  KEY `idx_status` (`status`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 用户角色关联表
CREATE TABLE `user_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_role` (`user_id`, `role_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`),
  CONSTRAINT `fk_user_roles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- 权限表
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `parent_id` int(11) DEFAULT '0' COMMENT '父权限ID',
  `name` varchar(100) NOT NULL COMMENT '权限名称',
  `key` varchar(100) NOT NULL COMMENT '权限标识',
  `type` tinyint(1) DEFAULT '1' COMMENT '权限类型: 1-菜单, 2-按钮',
  `path` varchar(255) DEFAULT NULL COMMENT '路由路径',
  `component` varchar(255) DEFAULT NULL COMMENT '组件路径',
  `redirect` varchar(255) DEFAULT NULL COMMENT '重定向路径',
  `icon` varchar(100) DEFAULT NULL COMMENT '图标',
  `sort` int(11) DEFAULT '0' COMMENT '排序',
  `hidden` tinyint(1) DEFAULT '0' COMMENT '是否隐藏: 0-否, 1-是',
  `always_show` tinyint(1) DEFAULT '0' COMMENT '是否总是显示: 0-否, 1-是',
  `no_cache` tinyint(1) DEFAULT '0' COMMENT '是否不缓存: 0-否, 1-是',
  `breadcrumb` tinyint(1) DEFAULT '1' COMMENT '是否显示面包屑: 0-否, 1-是',
  `affix` tinyint(1) DEFAULT '0' COMMENT '是否固定在标签栏: 0-否, 1-是',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态: 0-禁用, 1-启用',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间（软删除）',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_key` (`key`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_parent_status` (`parent_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 角色权限关联表
CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `permission_id` int(11) NOT NULL COMMENT '权限ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_role_permission` (`role_id`, `permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permissions_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- 🔴 CRITICAL: 角色路由缓存表（性能优化）
CREATE TABLE `role_routes_cache` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '缓存ID',
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `routes_json` longtext NOT NULL COMMENT '缓存的路由JSON',
  `cache_key` varchar(100) NOT NULL COMMENT '缓存键（MD5）',
  `version` int(11) DEFAULT '1' COMMENT '版本号',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_role_id` (`role_id`),
  KEY `idx_cache_key` (`cache_key`),
  KEY `idx_updated_at` (`updated_at`),
  CONSTRAINT `fk_role_routes_cache_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色路由缓存表';

-- ============================================
-- 业务功能相关表
-- ============================================

-- 文章表
CREATE TABLE `articles` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '文章ID',
  `title` varchar(255) NOT NULL COMMENT '标题',
  `content` longtext COMMENT '内容',
  `content_short` varchar(500) DEFAULT NULL COMMENT '摘要',
  `author` varchar(50) DEFAULT NULL COMMENT '作者',
  `author_id` int(11) DEFAULT NULL COMMENT '作者ID',
  `reviewer` varchar(50) DEFAULT NULL COMMENT '审核人',
  `reviewer_id` int(11) DEFAULT NULL COMMENT '审核人ID',
  `image_uri` varchar(255) DEFAULT NULL COMMENT '封面图片',
  `importance` tinyint(1) DEFAULT '1' COMMENT '重要性: 1-低, 2-中, 3-高',
  `type` varchar(10) DEFAULT 'CN' COMMENT '类型: CN, US, JP, EU',
  `status` varchar(20) DEFAULT 'draft' COMMENT '状态: draft-草稿, published-已发布, archived-已归档',
  `display_time` datetime DEFAULT NULL COMMENT '发布时间',
  `comment_disabled` tinyint(1) DEFAULT '0' COMMENT '是否禁用评论: 0-否, 1-是',
  `pageviews` int(11) DEFAULT '0' COMMENT '浏览量',
  `platforms` json DEFAULT NULL COMMENT '平台列表',
  `forecast` decimal(10,2) DEFAULT NULL COMMENT '预测值',
  `created_by` int(11) DEFAULT NULL COMMENT '创建人ID',
  `updated_by` int(11) DEFAULT NULL COMMENT '更新人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间（软删除）',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_author` (`author`),
  KEY `idx_author_id` (`author_id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `idx_importance` (`importance`),
  KEY `idx_display_time` (`display_time`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_status_type_time` (`status`, `type`, `display_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- 文章浏览统计表
CREATE TABLE `article_pv` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `article_id` int(11) NOT NULL COMMENT '文章ID',
  `date` date NOT NULL COMMENT '日期',
  `platform` varchar(20) NOT NULL COMMENT '平台: PC, mobile, ios, android',
  `pv` int(11) DEFAULT '0' COMMENT '浏览量',
  `uv` int(11) DEFAULT '0' COMMENT '独立访客数',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_article_date_platform` (`article_id`, `date`, `platform`),
  KEY `idx_article_id` (`article_id`),
  KEY `idx_date` (`date`),
  KEY `idx_platform` (`platform`),
  CONSTRAINT `fk_article_pv_article_id` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章浏览统计表';

-- 🟢 RECOMMENDED: 文章版本控制表
CREATE TABLE `article_versions` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '版本ID',
  `article_id` int(11) NOT NULL COMMENT '文章ID',
  `version` int(11) NOT NULL COMMENT '版本号',
  `title` varchar(255) DEFAULT NULL COMMENT '标题',
  `content` longtext COMMENT '内容',
  `content_short` varchar(500) DEFAULT NULL COMMENT '摘要',
  `change_note` varchar(500) DEFAULT NULL COMMENT '修改说明',
  `created_by` int(11) DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_article_id` (`article_id`),
  KEY `idx_version` (`article_id`, `version`),
  CONSTRAINT `fk_article_versions_article_id` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章版本控制表';

-- ============================================
-- 系统功能相关表
-- ============================================

-- 系统日志表
CREATE TABLE `system_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID',
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `operation` varchar(100) DEFAULT NULL COMMENT '操作类型',
  `method` varchar(200) DEFAULT NULL COMMENT '请求方法',
  `params` text COMMENT '请求参数',
  `response` text COMMENT '响应结果',
  `time` int(11) DEFAULT NULL COMMENT '执行时长(毫秒)',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `location` varchar(200) DEFAULT NULL COMMENT 'IP归属地',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '用户代理',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态: 0-失败, 1-成功',
  `error_msg` text COMMENT '错误信息',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_username` (`username`),
  KEY `idx_operation` (`operation`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_time` (`user_id`, `created_at`),
  CONSTRAINT `fk_system_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表';

-- 文件上传表
CREATE TABLE `attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '附件ID',
  `user_id` int(11) DEFAULT NULL COMMENT '上传用户ID',
  `module` varchar(50) DEFAULT NULL COMMENT '所属模块: article, user, system',
  `module_id` int(11) DEFAULT NULL COMMENT '模块关联ID',
  `original_name` varchar(255) NOT NULL COMMENT '原始文件名',
  `file_name` varchar(255) NOT NULL COMMENT '存储文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
  `file_url` varchar(500) DEFAULT NULL COMMENT '文件访问URL',
  `file_size` int(11) DEFAULT '0' COMMENT '文件大小(字节)',
  `file_type` varchar(50) DEFAULT NULL COMMENT '文件类型',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME类型',
  `extension` varchar(20) DEFAULT NULL COMMENT '文件扩展名',
  `md5` varchar(32) DEFAULT NULL COMMENT '文件MD5',
  `storage_type` varchar(20) DEFAULT 'local' COMMENT '存储类型: local, oss, cos',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间（软删除）',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_md5` (`md5`),
  KEY `idx_module` (`module`, `module_id`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_attachments_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件上传表';

-- 系统配置表
CREATE TABLE `system_configs` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `key` varchar(100) NOT NULL COMMENT '配置键',
  `value` text COMMENT '配置值',
  `description` varchar(255) DEFAULT NULL COMMENT '配置描述',
  `type` varchar(20) DEFAULT 'string' COMMENT '配置类型: string, number, boolean, json',
  `group` varchar(50) DEFAULT 'system' COMMENT '配置分组',
  `sort` int(11) DEFAULT '0' COMMENT '排序',
  `is_public` tinyint(1) DEFAULT '0' COMMENT '是否公开: 0-否, 1-是',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_key` (`key`),
  KEY `idx_group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================
-- 插入初始数据
-- ============================================

-- 插入默认角色
INSERT INTO `roles` (`key`, `name`, `description`) VALUES
('admin', '超级管理员', 'Super Administrator. Have access to view all pages.'),
('editor', '编辑员', 'Normal Editor. Can see all pages except permission page'),
('visitor', '访客', 'Just a visitor. Can only see the home page and the document page');

-- 插入默认用户 (密码: admin123456, editor123456)
-- 密码使用 bcrypt 加密，需要后端实际加密后再插入
INSERT INTO `users` (`username`, `password`, `salt`, `name`, `avatar`, `introduction`) VALUES
('admin', '$2a$10$7JB720yubVSOfvVWbfXCOOxjTOQcQjmrJF1ZM4nAVccp/.rkMlDWy', 'salt_admin', 'Super Admin', 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif', 'I am a super administrator'),
('editor', '$2a$10$7JB720yubVSOfvVWbfXCOOxjTOQcQjmrJF1ZM4nAVccp/.rkMlDWy', 'salt_editor', 'Normal Editor', 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif', 'I am an editor');

-- 关联用户角色
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1), -- admin用户关联admin角色
(2, 2); -- editor用户关联editor角色

-- 插入默认权限（菜单）
INSERT INTO `permissions` (`parent_id`, `name`, `key`, `type`, `path`, `component`, `redirect`, `icon`, `sort`, `hidden`, `always_show`) VALUES
-- 一级菜单
(0, 'Dashboard', 'dashboard', 1, '/dashboard', 'dashboard/index', NULL, 'dashboard', 1, 0, 0),
(0, 'Documentation', 'documentation', 1, 'https://panjiachen.github.io/vue-element-admin-site/', NULL, NULL, 'documentation', 2, 0, 0),
(0, 'Guide', 'guide', 1, '/guide', 'guide/index', NULL, 'guide', 3, 0, 0),
(0, 'Permission', 'permission', 1, '/permission', 'permission', '/permission/page', 'lock', 4, 0, 1),
(0, 'Components', 'components', 1, '/components', 'components', '/components/tinymce', 'component', 5, 0, 1),
(0, 'Charts', 'charts', 1, '/charts', 'charts', '/charts/keyboard', 'chart', 6, 0, 1),
(0, 'Example', 'example', 1, '/example', 'example', '/example/list', 'example', 7, 0, 1),
(0, 'Table', 'table', 1, '/table', 'table', '/table/complex-table', 'table', 8, 0, 1),

-- Permission 子菜单
(4, 'Page Permission', 'permission-page', 1, 'page', 'permission/page', NULL, 'user', 1, 0, 0),
(4, 'Directive Permission', 'permission-directive', 1, 'directive', 'permission/directive', NULL, 'lock', 2, 0, 0),
(4, 'Role Permission', 'permission-role', 1, 'role', 'permission/role', NULL, 'peoples', 3, 0, 0),

-- Components 子菜单
(5, 'Tinymce', 'components-tinymce', 1, 'tinymce', 'components/Tinymce', NULL, 'edit', 1, 0, 0),
(5, 'Markdown', 'components-markdown', 1, 'markdown', 'components/Markdown', NULL, 'markdown', 2, 0, 0),
(5, 'JSON Editor', 'components-json-editor', 1, 'json-editor', 'components/JsonEditor', NULL, 'code', 3, 0, 0),

-- Charts 子菜单
(6, 'Keyboard Chart', 'charts-keyboard', 1, 'keyboard', 'charts/keyboard', NULL, 'chart', 1, 0, 0),
(6, 'Line Chart', 'charts-line', 1, 'line', 'charts/line', NULL, 'chart', 2, 0, 0),
(6, 'Mix Chart', 'charts-mix', 1, 'mix-chart', 'charts/mixChart', NULL, 'chart', 3, 0, 0),

-- Example 子菜单
(7, 'Create Article', 'example-create', 1, 'create', 'example/create', NULL, 'edit', 1, 0, 0),
(7, 'Edit Article', 'example-edit', 1, 'edit/:id(\\d+)', 'example/edit', NULL, 'edit', 2, 1, 0),
(7, 'Article List', 'example-list', 1, 'list', 'example/list', NULL, 'list', 3, 0, 0),

-- Table 子菜单
(8, 'Dynamic Table', 'table-dynamic', 1, 'dynamic-table', 'table/dynamicTable', NULL, 'table', 1, 0, 0),
(8, 'Drag Table', 'table-drag', 1, 'drag-table', 'table/dragTable', NULL, 'table', 2, 0, 0),
(8, 'Inline Edit Table', 'table-inline-edit', 1, 'inline-edit-table', 'table/inlineEditTable', NULL, 'table', 3, 0, 0),
(8, 'Complex Table', 'table-complex', 1, 'complex-table', 'table/complexTable', NULL, 'table', 4, 0, 0);

-- 关联角色权限
-- admin 拥有所有权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, id FROM permissions WHERE deleted_at IS NULL;

-- editor 拥有除 Permission 相关的所有权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, id FROM permissions WHERE deleted_at IS NULL AND `key` NOT LIKE 'permission%';

-- 插入系统配置
INSERT INTO `system_configs` (`key`, `value`, `description`, `type`, `group`, `is_public`) VALUES
('site_name', 'Vue3 Element Admin', '网站名称', 'string', 'basic', 1),
('site_description', 'Vue3 Element Admin - A modern admin dashboard template', '网站描述', 'string', 'basic', 1),
('site_keywords', 'vue3,element-plus,admin,dashboard', '网站关键词', 'string', 'basic', 1),
('enable_register', 'false', '是否允许注册', 'boolean', 'auth', 1),
('max_login_attempts', '5', '最大登录尝试次数', 'number', 'auth', 0),
('lock_time', '30', '锁定时间(分钟)', 'number', 'auth', 0),
('token_expires_in', '7200', 'Token过期时间(秒)', 'number', 'auth', 0),
('refresh_token_expires_in', '604800', 'Refresh Token过期时间(秒)', 'number', 'auth', 0),
('max_upload_size', '10485760', '最大上传文件大小(字节)', 'number', 'upload', 1),
('allowed_file_types', 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx', '允许上传的文件类型', 'string', 'upload', 1);

-- 插入示例文章
INSERT INTO `articles` (`title`, `content`, `content_short`, `author`, `author_id`, `reviewer`, `image_uri`, `importance`, `type`, `status`, `display_time`, `comment_disabled`, `pageviews`, `platforms`, `forecast`, `created_by`) VALUES
('Vue3 Element Admin 使用指南', '<h2>Vue3 Element Admin 快速上手</h2><p>I am testing data, I am testing data.</p><p><img src="https://wpimg.wallstcn.com/4c69009c-0fd4-4153-b112-6cb53d1cf943"></p>', 'Vue3 Element Admin 是一个基于 Vue3 和 Element Plus 的后台管理系统模板', 'Super Admin', 1, 'Super Admin', 'https://wpimg.wallstcn.com/e4558086-631c-425c-9430-56ffb46e70b3', 3, 'CN', 'published', NOW(), 0, 1024, '["a-platform","b-platform"]', 88.88, 1),
('TypeScript 在 Vue3 中的应用', '<h2>TypeScript 最佳实践</h2><p>I am testing data, I am testing data.</p><p><img src="https://wpimg.wallstcn.com/4c69009c-0fd4-4153-b112-6cb53d1cf943"></p>', '本文介绍如何在Vue3项目中使用TypeScript', 'Normal Editor', 2, 'Super Admin', 'https://wpimg.wallstcn.com/e4558086-631c-425c-9430-56ffb46e70b3', 2, 'US', 'published', NOW(), 0, 2048, '["a-platform"]', 76.54, 2),
('Element Plus 组件库使用技巧', '<h2>Element Plus 进阶指南</h2><p>I am testing data, I am testing data.</p><p><img src="https://wpimg.wallstcn.com/4c69009c-0fd4-4153-b112-6cb53d1cf943"></p>', 'Element Plus 是 Vue3 的优秀组件库', 'Normal Editor', 2, 'Normal Editor', 'https://wpimg.wallstcn.com/e4558086-631c-425c-9430-56ffb46e70b3', 1, 'JP', 'draft', NOW(), 1, 512, '["a-platform"]', 65.32, 2);

-- 插入文章浏览统计
INSERT INTO `article_pv` (`article_id`, `date`, `platform`, `pv`, `uv`) VALUES
(1, CURDATE(), 'PC', 1024, 856),
(1, CURDATE(), 'mobile', 1024, 723),
(1, CURDATE(), 'ios', 1024, 612),
(1, CURDATE(), 'android', 1024, 534),
(2, CURDATE(), 'PC', 512, 398),
(2, CURDATE(), 'mobile', 512, 345),
(2, CURDATE(), 'ios', 256, 189),
(2, CURDATE(), 'android', 256, 167),
(3, CURDATE(), 'PC', 128, 98),
(3, CURDATE(), 'mobile', 128, 87),
(3, CURDATE(), 'ios', 64, 45),
(3, CURDATE(), 'android', 64, 43);

-- ============================================
-- 索引优化建议
-- ============================================

-- 已在表创建时添加以下复合索引：
-- users: idx_status_login (status, last_login_time)
-- articles: idx_status_type_time (status, type, display_time)
-- permissions: idx_parent_status (parent_id, status)
-- user_tokens: idx_user_expires (user_id, expires_at)
-- system_logs: idx_user_time (user_id, created_at)

-- ============================================
-- 数据库优化建议
-- ============================================

-- 1. 定期清理过期 token
-- DELETE FROM user_tokens WHERE expires_at < NOW();

-- 2. 定期归档旧日志（保留最近3个月）
-- INSERT INTO system_logs_archive SELECT * FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);
-- DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);

-- 3. 更新路由缓存（权限变更时）
-- DELETE FROM role_routes_cache WHERE role_id = ?;

-- 4. 定期备份数据库
-- mysqldump -u root -p mhxy > mhxy_backup_$(date +%Y%m%d).sql

-- ============================================
-- 数据库版本信息
-- ============================================

INSERT INTO `system_configs` (`key`, `value`, `description`, `type`, `group`, `is_public`) VALUES
('database_version', '2.0', '数据库版本号', 'string', 'system', 0),
('database_updated_at', NOW(), '数据库更新时间', 'string', 'system', 0);
