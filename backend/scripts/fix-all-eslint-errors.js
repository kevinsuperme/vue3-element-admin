#!/usr/bin/env node

/**
 * 全面修复所有 ESLint 错误
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ 文件不存在: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  const originalContent = content;

  // 1. 修复 (error as any).statusCode
  if (content.includes('(error as any).statusCode')) {
    content = content.replace(/\(error as any\)\.statusCode/g, '(error as AppError).statusCode');
    console.log('✓ 修复了 (error as any).statusCode');
    modified = true;
  }

  // 2. 修复 updateData: any
  if (content.includes('updateData: any')) {
    content = content.replace(/updateData:\s*any/g, 'updateData: Record<string, unknown>');
    console.log('✓ 修复了 updateData: any');
    modified = true;
  }

  // 3. 修复 query: any
  if (content.includes('query: any')) {
    content = content.replace(/query:\s*any\s*=/g, 'query: Record<string, unknown> =');
    console.log('✓ 修复了 query: any');
    modified = true;
  }

  // 4. 删除未使用的导入
  if (content.includes('buildMenuTree') && !content.includes('buildMenuTree(')) {
    content = content.replace(/import\s*{([^}]*),?\s*buildMenuTree\s*,?([^}]*)}\s*from\s*'([^']+)';/,
      (match, before, after, from) => {
        const parts = [before.trim(), after.trim()].filter(p => p && p !== ',');
        if (parts.length === 0) {
          return ''; // 删除整个导入
        }
        return `import { ${parts.join(', ')} } from '${from}';`;
      });
    console.log('✓ 删除了未使用的 buildMenuTree 导入');
    modified = true;
  }

  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ 文件已更新: ${path.basename(filePath)}\n`);
    return true;
  }

  return false;
}

function runESLintFix(directory) {
  try {
    console.log(`\n🔧 运行 ESLint 自动修复...\n`);
    execSync(`npx eslint ${directory} --ext .ts --fix`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('\n✅ ESLint 自动修复完成\n');
    return true;
  } catch (error) {
    console.log('\n⚠️ ESLint 自动修复部分完成（存在无法自动修复的错误）\n');
    return false;
  }
}

function main() {
  console.log('🔧 开始全面修复 ESLint 错误...\n');

  const controllersDir = path.join(__dirname, '../src/controllers');

  const files = [
    'fileController.ts',
    'roleController.ts',
    'articleController.ts',
    'authController.ts'
  ];

  let totalFixed = 0;

  for (const file of files) {
    const filePath = path.join(controllersDir, file);
    console.log(`📝 处理文件: ${file}`);

    if (fixFile(filePath)) {
      totalFixed++;
    } else {
      console.log(`   无需修改或文件不存在\n`);
    }
  }

  // 运行 ESLint 自动修复
  runESLintFix('src/controllers');

  console.log(`\n✅ 手动修复完成! 共修复 ${totalFixed} 个文件`);
  console.log('\n💡 提示: 运行 npm run lint 查看剩余的错误');
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };
