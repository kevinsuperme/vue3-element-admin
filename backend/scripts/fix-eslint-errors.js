#!/usr/bin/env node

/**
 * 自动修复 ESLint 错误的脚本
 * 主要修复：
 * 1. 替换 (req as any) 为 (req as AuthRequest)
 * 2. 替换 (response.data as any) 为明确类型
 * 3. 修复 object-shorthand 问题
 */

const fs = require('fs');
const path = require('path');

function fixFileControllerTypes(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 修复 1: 替换 (req as any).user 为 (req as AuthRequest).user
  const anyUserRegex = /\(req as any\)\.user/g;
  if (anyUserRegex.test(content)) {
    content = content.replace(anyUserRegex, '(req as AuthRequest).user');
    modified = true;
    console.log('✓ 修复了 (req as any).user');
  }

  // 修复 2: 替换 req.files as any[] 为 req.files as MulterFile[]
  const anyArrayRegex = /req\.files as any\[\]/g;
  if (anyArrayRegex.test(content)) {
    content = content.replace(anyArrayRegex, 'req.files as MulterFile[]');
    modified = true;
    console.log('✓ 修复了 req.files as any[]');
  }

  // 修复 3: 替换 (response.data as any) 为明确类型
  const responseDataRegex = /\(response\.data as any\)/g;
  if (responseDataRegex.test(content)) {
    content = content.replace(responseDataRegex, '(response.data as Record<string, unknown>)');
    modified = true;
    console.log('✓ 修复了 (response.data as any)');
  }

  // 修复 4: object shorthand - errors: errors 改为 errors
  const objectShorthandRegex = /errors:\s*errors\b/g;
  if (objectShorthandRegex.test(content)) {
    content = content.replace(objectShorthandRegex, 'errors');
    modified = true;
    console.log('✓ 修复了 object shorthand (errors: errors)');
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ 文件已更新: ${filePath}`);
    return true;
  }

  return false;
}

function fixRoleControllerTypes(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 替换 any 为更具体的类型
  const anyTypeRegex = /: any\b/g;
  const matches = content.match(anyTypeRegex);

  if (matches && matches.length > 0) {
    console.log(`⚠️ 发现 ${matches.length} 个 any 类型使用`);

    // 针对特定上下文替换
    // error 参数
    content = content.replace(/catch\s*\(\s*error:\s*any\s*\)/g, 'catch (error: unknown)');

    // req.body, req.params, req.query
    content = content.replace(/req\.body:\s*any/g, 'req.body: Record<string, unknown>');
    content = content.replace(/req\.params:\s*any/g, 'req.params: Record<string, unknown>');
    content = content.replace(/req\.query:\s*any/g, 'req.query: Record<string, unknown>');

    modified = true;
    console.log('✓ 修复了 any 类型定义');
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ 文件已更新: ${filePath}`);
    return true;
  }

  return false;
}

function main() {
  console.log('🔧 开始修复 ESLint 错误...\n');

  const controllersDir = path.join(__dirname, '../src/controllers');

  const filesToFix = [
    path.join(controllersDir, 'fileController.ts'),
    path.join(controllersDir, 'roleController.ts')
  ];

  let totalFixed = 0;

  for (const filePath of filesToFix) {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ 文件不存在: ${filePath}`);
      continue;
    }

    console.log(`\n📝 处理文件: ${path.basename(filePath)}`);

    if (filePath.includes('fileController')) {
      if (fixFileControllerTypes(filePath)) {
        totalFixed++;
      }
    } else if (filePath.includes('roleController')) {
      if (fixRoleControllerTypes(filePath)) {
        totalFixed++;
      }
    }
  }

  console.log(`\n✅ 修复完成! 共修复 ${totalFixed} 个文件`);
}

if (require.main === module) {
  main();
}

module.exports = { fixFileControllerTypes, fixRoleControllerTypes };
