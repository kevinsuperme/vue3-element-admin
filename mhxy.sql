-- Vue3 Element Admin 数据库结构
-- 数据库名称: mhxy
-- 创建时间: 2024-06-20
-- 版本: 1.0

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `mhxy` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `mhxy`;

-- 用户表
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码(加密)',
  `salt` varchar(50) DEFAULT NULL COMMENT '密码盐值',
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `introduction` text COMMENT '个人介绍',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态: 0-禁用, 1-启用',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(50) DEFAULT NULL COMMENT '最后登录IP',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 角色表
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `key` varchar(50) NOT NULL COMMENT '角色标识',
  `name` varchar(50) NOT NULL COMMENT '角色名称',
  `description` varchar(255) DEFAULT NULL COMMENT '角色描述',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态: 0-禁用, 1-启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_key` (`key`),
  KEY `idx_status` (`status`)
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
  `icon` varchar(100) DEFAULT NULL COMMENT '图标',
  `sort` int(11) DEFAULT '0' COMMENT '排序',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态: 0-禁用, 1-启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_key` (`key`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
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

-- 文章表
CREATE TABLE `articles` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '文章ID',
  `title` varchar(255) NOT NULL COMMENT '标题',
  `content` longtext COMMENT '内容',
  `content_short` varchar(500) DEFAULT NULL COMMENT '摘要',
  `author` varchar(50) DEFAULT NULL COMMENT '作者',
  `reviewer` varchar(50) DEFAULT NULL COMMENT '审核人',
  `image_uri` varchar(255) DEFAULT NULL COMMENT '封面图片',
  `importance` tinyint(1) DEFAULT '1' COMMENT '重要性: 1-低, 2-中, 3-高',
  `type` varchar(10) DEFAULT 'CN' COMMENT '类型: CN, US, JP, EU',
  `status` varchar(20) DEFAULT 'draft' COMMENT '状态: draft-草稿, published-已发布',
  `display_time` datetime DEFAULT NULL COMMENT '发布时间',
  `comment_disabled` tinyint(1) DEFAULT '0' COMMENT '是否禁用评论: 0-否, 1-是',
  `pageviews` int(11) DEFAULT '0' COMMENT '浏览量',
  `platforms` json DEFAULT NULL COMMENT '平台列表',
  `forecast` decimal(10,2) DEFAULT NULL COMMENT '预测值',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_author` (`author`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `idx_importance` (`importance`),
  KEY `idx_display_time` (`display_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- 文章浏览统计表
CREATE TABLE `article_pv` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `article_id` int(11) NOT NULL COMMENT '文章ID',
  `date` date NOT NULL COMMENT '日期',
  `platform` varchar(20) NOT NULL COMMENT '平台: PC, mobile, ios, android',
  `pv` int(11) DEFAULT '0' COMMENT '浏览量',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_article_date_platform` (`article_id`, `date`, `platform`),
  KEY `idx_article_id` (`article_id`),
  KEY `idx_date` (`date`),
  KEY `idx_platform` (`platform`),
  CONSTRAINT `fk_article_pv_article_id` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章浏览统计表';

-- 系统日志表
CREATE TABLE `system_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID',
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `operation` varchar(100) DEFAULT NULL COMMENT '操作类型',
  `method` varchar(200) DEFAULT NULL COMMENT '请求方法',
  `params` text COMMENT '请求参数',
  `time` int(11) DEFAULT NULL COMMENT '执行时长(毫秒)',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '用户代理',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_username` (`username`),
  KEY `idx_operation` (`operation`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_system_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表';

-- 文件上传表
CREATE TABLE `attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '附件ID',
  `user_id` int(11) DEFAULT NULL COMMENT '上传用户ID',
  `original_name` varchar(255) NOT NULL COMMENT '原始文件名',
  `file_name` varchar(255) NOT NULL COMMENT '存储文件名',
  `file_path` varchar(500) NOT NULL COMMENT '文件路径',
  `file_size` int(11) DEFAULT '0' COMMENT '文件大小(字节)',
  `file_type` varchar(50) DEFAULT NULL COMMENT '文件类型',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME类型',
  `md5` varchar(32) DEFAULT NULL COMMENT '文件MD5',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_md5` (`md5`),
  CONSTRAINT `fk_attachments_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件上传表';

-- 系统配置表
CREATE TABLE `system_configs` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `key` varchar(100) NOT NULL COMMENT '配置键',
  `value` text COMMENT '配置值',
  `description` varchar(255) DEFAULT NULL COMMENT '配置描述',
  `type` varchar(20) DEFAULT 'string' COMMENT '配置类型: string, number, boolean, json',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入初始数据

-- 插入默认角色
INSERT INTO `roles` (`key`, `name`, `description`) VALUES
('admin', '超级管理员', 'Super Administrator. Have access to view all pages.'),
('editor', '编辑员', 'Normal Editor. Can see all pages except permission page'),
('visitor', '访客', 'Just a visitor. Can only see the home page and the document page');

-- 插入默认用户 (密码: 123456)
INSERT INTO `users` (`username`, `password`, `salt`, `nickname`, `avatar`, `introduction`) VALUES
('admin', '$2a$10$7JB720yubVSOfvVWbfXCOOxjTOQcQjmrJF1ZM4nAVccp/.rkMlDWy', 'salt123', '超级管理员', 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif', 'I am a super administrator'),
('editor', '$2a$10$7JB720yubVSOfvVWbfXCOOxjTOQcQjmrJF1ZM4nAVccp/.rkMlDWy', 'salt123', '普通编辑', 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif', 'I am an editor');

-- 关联用户角色
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1), -- admin用户关联admin角色
(2, 2); -- editor用户关联editor角色

-- 插入默认权限
INSERT INTO `permissions` (`parent_id`, `name`, `key`, `type`, `path`, `component`, `icon`, `sort`) VALUES
(0, '仪表盘', 'dashboard', 1, '/dashboard', 'dashboard/index', 'dashboard', 1),
(0, '示例', 'example', 1, '/example', '', 'example', 2),
(1, '工作台', 'workspace', 1, '/dashboard/workspace', 'dashboard/workspace', 'skill', 2),
(4, '表格', 'table', 1, '/example/table', '', 'table', 1),
(5, '复杂表格', 'complex-table', 1, '/example/table/complex-table', 'table/complex-table', 'table', 1),
(5, '基础表格', 'basic-table', 1, '/example/table/basic-table', 'table/basic-table', 'table', 2);

-- 关联角色权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), -- admin拥有所有权限
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7); -- editor拥有除权限管理外的所有权限

-- 插入系统配置
INSERT INTO `system_configs` (`key`, `value`, `description`, `type`) VALUES
('site_name', 'Vue3 Element Admin', '网站名称', 'string'),
('site_description', 'Vue3 Element Admin - A modern admin dashboard template', '网站描述', 'string'),
('site_keywords', 'vue3,element-plus,admin,dashboard', '网站关键词', 'string'),
('enable_register', 'false', '是否允许注册', 'boolean'),
('max_login_attempts', '5', '最大登录尝试次数', 'number'),
('lock_time', '30', '锁定时间(分钟)', 'number');

-- 插入示例文章
INSERT INTO `articles` (`title`, `content`, `content_short`, `author`, `reviewer`, `image_uri`, `importance`, `type`, `status`, `display_time`, `comment_disabled`, `pageviews`, `platforms`, `forecast`) VALUES
('Vue3 Element Admin 使用指南', '<p>I am testing data, I am testing data.</p><p><img src="https://wpimg.wallstcn.com/4c69009c-0fd4-4153-b112-6cb53d1cf943"></p>', 'Vue3 Element Admin 是一个基于 Vue3 和 Element Plus 的后台管理系统模板', 'Admin', 'Admin', 'https://wpimg.wallstcn.com/e4558086-631c-425c-9430-56ffb46e70b3', 3, 'CN', 'published', NOW(), 0, 1024, '["a-platform"]', 88.88),
('TypeScript 在 Vue3 中的应用', '<p>I am testing data, I am testing data.</p><p><img src="https://wpimg.wallstcn.com/4c69009c-0fd4-4153-b112-6cb53d1cf943"></p>', '本文介绍如何在Vue3项目中使用TypeScript', 'Editor', 'Admin', 'https://wpimg.wallstcn.com/e4558086-631c-425c-9430-56ffb46e70b3', 2, 'US', 'published', NOW(), 0, 2048, '["a-platform"]', 76.54),
('Element Plus 组件库使用技巧', '<p>I am testing data, I am testing data.</p><p><img src="https://wpimg.wallstcn.com/4c69009c-0fd4-4153-b112-6cb53d1cf943"></p>', 'Element Plus 是 Vue3 的优秀组件库', 'Editor', 'Editor', 'https://wpimg.wallstcn.com/e4558086-631c-425c-9430-56ffb46e70b3', 1, 'JP', 'draft', NOW(), 1, 512, '["a-platform"]', 65.32);

-- 插入文章浏览统计
INSERT INTO `article_pv` (`article_id`, `date`, `platform`, `pv`) VALUES
(1, CURDATE(), 'PC', 1024),
(1, CURDATE(), 'mobile', 1024),
(1, CURDATE(), 'ios', 1024),
(1, CURDATE(), 'android', 1024),
(2, CURDATE(), 'PC', 512),
(2, CURDATE(), 'mobile', 512),
(2, CURDATE(), 'ios', 256),
(2, CURDATE(), 'android', 256),
(3, CURDATE(), 'PC', 128),
(3, CURDATE(), 'mobile', 128),
(3, CURDATE(), 'ios', 64),
(3, CURDATE(), 'android', 64);