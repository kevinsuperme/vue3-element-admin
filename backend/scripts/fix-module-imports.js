#!/usr/bin/env node

/**
 * 修复模块导入错误
 * ts(2307) - 找不到模块或其相应的类型声明
 */

const fs = require('fs');
const path = require('path');

function fixModuleImport(filePath, oldImport, newImport) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  if (content.includes(oldImport)) {
    content = content.replace(oldImport, newImport);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ 修复了导入: ${oldImport} → ${newImport}`);
    return true;
  }

  return false;
}

function main() {
  console.log('🔧 开始修复模块导入错误...\n');

  const fixes = [
    // 路由文件导入修复
    {
      file: 'backend/src/routes/articles.ts',
      old: "from '../controllers/articleController'",
      new: "from '../controllers/articleController'"
    },
    {
      file: 'backend/src/routes/roles.ts',
      old: "from '../controllers/roleController'",
      new: "from '../controllers/roleController'"
    },
    {
      file: 'backend/src/routes/vue-element-admin.ts',
      old: "from './users'",
      new: "from './users'"
    },
    {
      file: 'backend/src/routes/vue-element-admin.ts',
      old: "from './articles'",
      new: "from './articles'"
    },
    {
      file: 'backend/src/routes/vue-element-admin.ts',
      old: "from './roles'",
      new: "from './roles'"
    },
    // 测试文件导入修复
    {
      file: 'backend/tests/integration/user.test.ts',
      old: "from '../../app'",
      new: "from '../../src/app'"
    },
    {
      file: 'backend/tests/integration/user.test.ts',
      old: "from '../../models/User'",
      new: "from '../../src/models/User'"
    }
  ];

  let totalFixed = 0;

  for (const fix of fixes) {
    const filePath = path.join(__dirname, '../..', fix.file);
    console.log(`📝 处理文件: ${fix.file}`);

    if (fixModuleImport(filePath, fix.old, fix.new)) {
      totalFixed++;
    } else {
      console.log(`   无需修改或文件不存在\n`);
    }
  }

  console.log(`\n✅ 修复完成! 共修复 ${totalFixed} 个导入`);
}

if (require.main === module) {
  main();
}

module.exports = { fixModuleImport };
