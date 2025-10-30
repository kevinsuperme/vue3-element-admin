#!/usr/bin/env node

/**
 * 全面修复所有 TypeScript/ESLint 错误
 */

const fs = require('fs');
const path = require('path');

function fixFile(filePath, fixes) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let modified = false;

  for (const fix of fixes) {
    if (fix.regex) {
      if (fix.regex.test(content)) {
        content = content.replace(fix.regex, fix.replacement);
        console.log(`  ✓ ${fix.description}`);
        modified = true;
      }
    } else if (fix.search && content.includes(fix.search)) {
      content = content.replace(fix.search, fix.replacement);
      console.log(`  ✓ ${fix.description}`);
      modified = true;
    }
  }

  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }

  return false;
}

function main() {
  console.log('🔧 开始全面修复 TypeScript/ESLint 错误...\n');

  const filesFixes = {
    'backend/src/services/AuthService.ts': [
      {
        regex: /(\w+):\s*\1(?=\s*[,}])/g,
        replacement: '$1',
        description: '修复对象简写 (object-shorthand)'
      }
    ],
    'backend/src/routes/vue-element-admin.ts': [
      {
        search: "import { logRoutes } from './logs';",
        replacement: "import logRoutes from './logs';",
        description: '修复 logs 路由导入'
      },
      {
        search: "import { systemRoutes } from './system';",
        replacement: "import systemRoutes from './system';",
        description: '修复 system 路由导入'
      },
      {
        search: "import { fileRoutes } from './files';",
        replacement: "import fileRoutes from './files';",
        description: '修复 files 路由导入'
      }
    ]
  };

  let totalFixed = 0;

  for (const [file, fixes] of Object.entries(filesFixes)) {
    const filePath = path.join(__dirname, '../..', file);
    console.log(`\n📝 处理文件: ${file}`);

    if (fixFile(filePath, fixes)) {
      totalFixed++;
      console.log(`✅ 文件已更新`);
    } else {
      console.log(`  无需修改或文件不存在`);
    }
  }

  console.log(`\n✅ 全面修复完成! 共修复 ${totalFixed} 个文件`);
  console.log('\n💡 提示: 运行 cd backend && npx tsc --noEmit 检查剩余错误');
}

if (require.main === module) {
  main();
}

module.exports = { fixFile };
