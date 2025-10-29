-- ============================================
-- 数据库升级脚本：从 v1.0 升级到 v2.0
-- ============================================
-- 执行前请务必备份数据库！
-- mysqldump -u root -p mhxy > mhxy_backup_v1.sql
-- ============================================

USE `mhxy`;

-- 开始事务
START TRANSACTION;

-- ============================================
-- 步骤1: 添加新表
-- ============================================

-- 🔴 CRITICAL: 添加 user_tokens 表（JWT管理）
CREATE TABLE IF NOT EXISTS `user_tokens` (
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

-- 🔴 CRITICAL: 添加 role_routes_cache 表（权限路由缓存）
CREATE TABLE IF NOT EXISTS `role_routes_cache` (
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

-- 🟢 RECOMMENDED: 添加文章版本控制表
CREATE TABLE IF NOT EXISTS `article_versions` (
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
-- 步骤2: 修改现有表结构
-- ============================================

-- 🟡 IMPORTANT: users 表 - 统一字段命名
ALTER TABLE `users` CHANGE COLUMN `nickname` `name` varchar(50) DEFAULT NULL COMMENT '姓名';

-- 🟢 RECOMMENDED: users 表 - 添加软删除字段
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `deleted_at` datetime DEFAULT NULL COMMENT '删除时间（软删除）' AFTER `last_login_ip`;

-- 🟡 IMPORTANT: users 表 - 添加复合索引
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_deleted_at` (`deleted_at`);
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_status_login` (`status`, `last_login_time`);

-- 🟢 RECOMMENDED: roles 表 - 添加软删除字段
ALTER TABLE `roles` ADD COLUMN IF NOT EXISTS `deleted_at` datetime DEFAULT NULL COMMENT '删除时间（软删除）' AFTER `status`;
ALTER TABLE `roles` ADD INDEX IF NOT EXISTS `idx_deleted_at` (`deleted_at`);

-- 🟡 IMPORTANT: permissions 表 - 添加新字段
ALTER TABLE `permissions` ADD COLUMN IF NOT EXISTS `redirect` varchar(255) DEFAULT NULL COMMENT '重定向路径' AFTER `component`;
ALTER TABLE `permissions` ADD COLUMN IF NOT EXISTS `hidden` tinyint(1) DEFAULT '0' COMMENT '是否隐藏: 0-否, 1-是' AFTER `sort`;
ALTER TABLE `permissions` ADD COLUMN IF NOT EXISTS `always_show` tinyint(1) DEFAULT '0' COMMENT '是否总是显示: 0-否, 1-是' AFTER `hidden`;
ALTER TABLE `permissions` ADD COLUMN IF NOT EXISTS `no_cache` tinyint(1) DEFAULT '0' COMMENT '是否不缓存: 0-否, 1-是' AFTER `always_show`;
ALTER TABLE `permissions` ADD COLUMN IF NOT EXISTS `breadcrumb` tinyint(1) DEFAULT '1' COMMENT '是否显示面包屑: 0-否, 1-是' AFTER `no_cache`;
ALTER TABLE `permissions` ADD COLUMN IF NOT EXISTS `affix` tinyint(1) DEFAULT '0' COMMENT '是否固定在标签栏: 0-否, 1-是' AFTER `breadcrumb`;
ALTER TABLE `permissions` ADD COLUMN IF NOT EXISTS `deleted_at` datetime DEFAULT NULL COMMENT '删除时间（软删除）' AFTER `status`;

-- 🟡 IMPORTANT: permissions 表 - 添加索引
ALTER TABLE `permissions` ADD INDEX IF NOT EXISTS `idx_deleted_at` (`deleted_at`);
ALTER TABLE `permissions` ADD INDEX IF NOT EXISTS `idx_parent_status` (`parent_id`, `status`);

-- 🟡 IMPORTANT: articles 表 - 添加审计字段
ALTER TABLE `articles` ADD COLUMN IF NOT EXISTS `author_id` int(11) DEFAULT NULL COMMENT '作者ID' AFTER `author`;
ALTER TABLE `articles` ADD COLUMN IF NOT EXISTS `reviewer_id` int(11) DEFAULT NULL COMMENT '审核人ID' AFTER `reviewer`;
ALTER TABLE `articles` ADD COLUMN IF NOT EXISTS `created_by` int(11) DEFAULT NULL COMMENT '创建人ID' AFTER `forecast`;
ALTER TABLE `articles` ADD COLUMN IF NOT EXISTS `updated_by` int(11) DEFAULT NULL COMMENT '更新人ID' AFTER `created_by`;
ALTER TABLE `articles` ADD COLUMN IF NOT EXISTS `deleted_at` datetime DEFAULT NULL COMMENT '删除时间（软删除）' AFTER `updated_by`;

-- 🟡 IMPORTANT: articles 表 - 添加索引
ALTER TABLE `articles` ADD INDEX IF NOT EXISTS `idx_author_id` (`author_id`);
ALTER TABLE `articles` ADD INDEX IF NOT EXISTS `idx_deleted_at` (`deleted_at`);
ALTER TABLE `articles` ADD INDEX IF NOT EXISTS `idx_created_by` (`created_by`);
ALTER TABLE `articles` ADD INDEX IF NOT EXISTS `idx_status_type_time` (`status`, `type`, `display_time`);

-- 🟢 RECOMMENDED: article_pv 表 - 添加 UV 字段
ALTER TABLE `article_pv` ADD COLUMN IF NOT EXISTS `uv` int(11) DEFAULT '0' COMMENT '独立访客数' AFTER `pv`;

-- 🟡 IMPORTANT: attachments 表 - 添加模块关联字段
ALTER TABLE `attachments` ADD COLUMN IF NOT EXISTS `module` varchar(50) DEFAULT NULL COMMENT '所属模块: article, user, system' AFTER `user_id`;
ALTER TABLE `attachments` ADD COLUMN IF NOT EXISTS `module_id` int(11) DEFAULT NULL COMMENT '模块关联ID' AFTER `module`;
ALTER TABLE `attachments` ADD COLUMN IF NOT EXISTS `file_url` varchar(500) DEFAULT NULL COMMENT '文件访问URL' AFTER `file_path`;
ALTER TABLE `attachments` ADD COLUMN IF NOT EXISTS `extension` varchar(20) DEFAULT NULL COMMENT '文件扩展名' AFTER `mime_type`;
ALTER TABLE `attachments` ADD COLUMN IF NOT EXISTS `storage_type` varchar(20) DEFAULT 'local' COMMENT '存储类型: local, oss, cos' AFTER `md5`;
ALTER TABLE `attachments` ADD COLUMN IF NOT EXISTS `deleted_at` datetime DEFAULT NULL COMMENT '删除时间（软删除）' AFTER `storage_type`;

-- 🟡 IMPORTANT: attachments 表 - 添加索引
ALTER TABLE `attachments` ADD INDEX IF NOT EXISTS `idx_module` (`module`, `module_id`);
ALTER TABLE `attachments` ADD INDEX IF NOT EXISTS `idx_deleted_at` (`deleted_at`);

-- 🟡 IMPORTANT: system_logs 表 - 字段类型优化
ALTER TABLE `system_logs` MODIFY COLUMN `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '日志ID';
ALTER TABLE `system_logs` ADD COLUMN IF NOT EXISTS `response` text COMMENT '响应结果' AFTER `params`;
ALTER TABLE `system_logs` ADD COLUMN IF NOT EXISTS `location` varchar(200) DEFAULT NULL COMMENT 'IP归属地' AFTER `ip`;
ALTER TABLE `system_logs` ADD COLUMN IF NOT EXISTS `status` tinyint(1) DEFAULT '1' COMMENT '状态: 0-失败, 1-成功' AFTER `user_agent`;
ALTER TABLE `system_logs` ADD COLUMN IF NOT EXISTS `error_msg` text COMMENT '错误信息' AFTER `status`;

-- 🟡 IMPORTANT: system_logs 表 - 添加索引
ALTER TABLE `system_logs` ADD INDEX IF NOT EXISTS `idx_status` (`status`);
ALTER TABLE `system_logs` ADD INDEX IF NOT EXISTS `idx_user_time` (`user_id`, `created_at`);

-- 🟡 IMPORTANT: system_configs 表 - 添加新字段
ALTER TABLE `system_configs` ADD COLUMN IF NOT EXISTS `group` varchar(50) DEFAULT 'system' COMMENT '配置分组' AFTER `type`;
ALTER TABLE `system_configs` ADD COLUMN IF NOT EXISTS `sort` int(11) DEFAULT '0' COMMENT '排序' AFTER `group`;
ALTER TABLE `system_configs` ADD COLUMN IF NOT EXISTS `is_public` tinyint(1) DEFAULT '0' COMMENT '是否公开: 0-否, 1-是' AFTER `sort`;

-- 🟡 IMPORTANT: system_configs 表 - 添加索引
ALTER TABLE `system_configs` ADD INDEX IF NOT EXISTS `idx_group` (`group`);

-- ============================================
-- 步骤3: 数据迁移
-- ============================================

-- 更新文章的 author_id 和 created_by（根据 author 字段匹配）
UPDATE articles a
LEFT JOIN users u ON a.author = u.name
SET a.author_id = u.id, a.created_by = u.id
WHERE a.author_id IS NULL AND u.id IS NOT NULL;

-- 更新文章的 reviewer_id（根据 reviewer 字段匹配）
UPDATE articles a
LEFT JOIN users u ON a.reviewer = u.name
SET a.reviewer_id = u.id
WHERE a.reviewer_id IS NULL AND u.id IS NOT NULL;

-- ============================================
-- 步骤4: 添加新的系统配置
-- ============================================

INSERT IGNORE INTO `system_configs` (`key`, `value`, `description`, `type`, `group`, `is_public`) VALUES
('token_expires_in', '7200', 'Token过期时间(秒)', 'number', 'auth', 0),
('refresh_token_expires_in', '604800', 'Refresh Token过期时间(秒)', 'number', 'auth', 0),
('max_upload_size', '10485760', '最大上传文件大小(字节)', 'number', 'upload', 1),
('allowed_file_types', 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx', '允许上传的文件类型', 'string', 'upload', 1),
('database_version', '2.0', '数据库版本号', 'string', 'system', 0),
('database_updated_at', NOW(), '数据库更新时间', 'string', 'system', 0);

-- ============================================
-- 步骤5: 更新现有系统配置（添加 group 分组）
-- ============================================

UPDATE `system_configs` SET `group` = 'basic' WHERE `key` IN ('site_name', 'site_description', 'site_keywords');
UPDATE `system_configs` SET `group` = 'auth' WHERE `key` IN ('enable_register', 'max_login_attempts', 'lock_time');

-- ============================================
-- 步骤6: 验证数据完整性
-- ============================================

-- 检查新表是否创建成功
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'mhxy' AND table_name = 'user_tokens') THEN 'OK'
    ELSE 'FAILED'
  END AS user_tokens_table,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'mhxy' AND table_name = 'role_routes_cache') THEN 'OK'
    ELSE 'FAILED'
  END AS role_routes_cache_table,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'mhxy' AND table_name = 'article_versions') THEN 'OK'
    ELSE 'FAILED'
  END AS article_versions_table;

-- 检查关键字段是否添加成功
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mhxy' AND table_name = 'users' AND column_name = 'name') THEN 'OK'
    ELSE 'FAILED - nickname未重命名为name'
  END AS users_name_field,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mhxy' AND table_name = 'users' AND column_name = 'deleted_at') THEN 'OK'
    ELSE 'FAILED'
  END AS users_deleted_at_field,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mhxy' AND table_name = 'articles' AND column_name = 'created_by') THEN 'OK'
    ELSE 'FAILED'
  END AS articles_created_by_field;

-- 提交事务
COMMIT;

-- ============================================
-- 升级完成提示
-- ============================================

SELECT
  '数据库升级完成！' AS message,
  '版本: v1.0 -> v2.0' AS version,
  NOW() AS upgrade_time;

-- ============================================
-- 后续操作建议
-- ============================================

-- 1. 验证应用程序是否正常运行
-- 2. 测试用户登录和权限功能
-- 3. 检查文章管理功能
-- 4. 监控数据库性能

-- ============================================
-- 回滚脚本（如果升级失败）
-- ============================================

/*
-- 回滚操作（谨慎使用！）
START TRANSACTION;

-- 删除新增的表
DROP TABLE IF EXISTS `user_tokens`;
DROP TABLE IF EXISTS `role_routes_cache`;
DROP TABLE IF EXISTS `article_versions`;

-- 恢复 users 表字段名
ALTER TABLE `users` CHANGE COLUMN `name` `nickname` varchar(50) DEFAULT NULL COMMENT '昵称';

-- 删除新增的字段（按需删除）
ALTER TABLE `users` DROP COLUMN IF EXISTS `deleted_at`;
ALTER TABLE `roles` DROP COLUMN IF EXISTS `deleted_at`;
ALTER TABLE `permissions` DROP COLUMN IF EXISTS `deleted_at`;
ALTER TABLE `articles` DROP COLUMN IF EXISTS `author_id`;
ALTER TABLE `articles` DROP COLUMN IF EXISTS `reviewer_id`;
ALTER TABLE `articles` DROP COLUMN IF EXISTS `created_by`;
ALTER TABLE `articles` DROP COLUMN IF EXISTS `updated_by`;
ALTER TABLE `articles` DROP COLUMN IF EXISTS `deleted_at`;

-- 恢复备份数据库
-- mysql -u root -p mhxy < mhxy_backup_v1.sql

COMMIT;
*/
