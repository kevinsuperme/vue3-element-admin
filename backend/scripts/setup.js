#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Vue3 Element Admin 后端设置工具');
console.log('=====================================');

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令失败: ${command} ${args.join(' ')} (exit code: ${code})`));
      }
    });

    child.on('error', reject);
  });
}

async function setup() {
  try {
    // 1. 检查并创建.env文件
    console.log('📋 检查环境配置文件...');
    const envPath = path.join(__dirname, '../.env');
    const envExamplePath = path.join(__dirname, '../.env.example');

    if (!fs.existsSync(envPath)) {
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ 已创建 .env 文件');
      } else {
        console.log('⚠️  未找到 .env.example 文件，跳过环境配置');
      }
    } else {
      console.log('✅ .env 文件已存在');
    }

    // 2. 安装依赖
    console.log('\n📦 安装依赖包...');
    await runCommand('npm', ['install']);
    console.log('✅ 依赖安装完成');

    // 3. 测试数据库连接
    console.log('\n🔍 测试数据库连接...');
    try {
      await runCommand('npm', ['run', 'check:db']);
      console.log('✅ 本地MongoDB连接正常');

      // 4. 使用本地数据库初始化
      console.log('\n🗄️  初始化本地数据库...');
      await runCommand('npm', ['run', 'init:db']);
    } catch (error) {
      console.log('⚠️  本地MongoDB未启动，使用内存数据库...');

      // 5. 使用内存数据库初始化
      console.log('\n🧠 初始化内存数据库...');
      await runCommand('npm', ['run', 'init:db:memory']);
    }

    // 6. 完成设置
    console.log('\n🎉 设置完成！');
    console.log('\n📋 下一步操作:');
    console.log('• 启动开发服务器: npm run dev');
    console.log('• 运行测试: npm test');
    console.log('• 查看API文档: 查看 src/docs 目录');
    console.log('\n🔑 默认账户:');
    console.log('• 管理员: admin / admin123456');
    console.log('• 用户: user / user123456');
    console.log('• 版主: moderator / moderator123456');
  } catch (error) {
    console.error('\n❌ 设置失败:', error.message);
    console.log('\n💡 解决建议:');
    console.log('1. 确保Node.js版本 >= 16');
    console.log('2. 检查网络连接');
    console.log('3. 手动运行: npm install');
    console.log('4. 手动运行: npm run init:db:memory');
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  setup();
}
