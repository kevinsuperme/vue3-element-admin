#!/usr/bin/env node

/**
 * @description: 测试运行脚本
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 日志函数
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 执行命令
function runCommand(command, description) {
  log(`\n🚀 ${description}`, 'cyan');
  log(`📝 执行命令: ${command}`, 'yellow');

  try {
    const startTime = Date.now();
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    log(`✅ ${description} 完成 (${duration}s)`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} 失败`, 'red');
    log(`错误信息: ${error.message}`, 'red');
    return false;
  }
}

// 创建测试报告目录
function ensureDirectories() {
  const dirs = [
    'tests/coverage',
    'tests/results',
    'tests/reports'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      log(`📁 创建目录: ${dir}`, 'blue');
    }
  });
}

// 清理旧的测试文件
function cleanup() {
  log('\n🧹 清理旧的测试文件...', 'yellow');

  const cleanupCommands = [
    'rm -rf tests/coverage',
    'rm -rf tests/results',
    'rm -rf node_modules/.cache',
    'rm -rf dist'
  ];

  cleanupCommands.forEach(cmd => {
    try {
      execSync(cmd, { stdio: 'ignore' });
    } catch {
      // 忽略文件不存在的错误
    }
  });

  log('✅ 清理完成', 'green');
}

// 运行单元测试
function runUnitTests(options = {}) {
  const { watch = false, coverage = false, ui = false } = options;

  let command = 'npm run test:unit';

  if (watch) {
    command = 'npm run test:unit:watch';
  }

  if (coverage && !watch) {
    command = 'npm run test:unit:coverage';
  }

  if (ui) {
    command = 'npm run test:ui';
  }

  return runCommand(command, '运行单元测试');
}

// 运行集成测试
function runIntegrationTests() {
  return runCommand(
    'vitest run tests/integration',
    '运行集成测试'
  );
}

// 运行端到端测试
function runE2ETests() {
  // 如果有 Cypress 或 Playwright 配置
  const hasCypress = fs.existsSync('cypress.config.ts') || fs.existsSync('cypress.config.js');
  const hasPlaywright = fs.existsSync('playwright.config.ts') || fs.existsSync('playwright.config.js');

  if (hasCypress) {
    return runCommand('npm run test:e2e', '运行端到端测试 (Cypress)');
  } else if (hasPlaywright) {
    return runCommand('npm run test:e2e', '运行端到端测试 (Playwright)');
  } else {
    log('⚠️  未找到 E2E 测试配置，跳过 E2E 测试', 'yellow');
    return true;
  }
}

// 生成测试报告
function generateReports() {
  log('\n📊 生成测试报告...', 'cyan');

  // 生成覆盖率报告
  const coverageSuccess = runCommand(
    'npm run test:unit:coverage',
    '生成覆盖率报告'
  );

  if (coverageSuccess) {
    log('\n📈 覆盖率报告位置:', 'blue');
    log('   HTML: tests/coverage/index.html', 'blue');
    log('   JSON: tests/coverage/coverage-final.json', 'blue');
    log('   LCov: tests/coverage/lcov.info', 'blue');
  }

  return coverageSuccess;
}

// 检查测试阈值
function checkThresholds() {
  log('\n🔍 检查测试阈值...', 'cyan');

  try {
    const coverageFile = path.join(process.cwd(), 'tests/coverage/coverage-summary.json');

    if (fs.existsSync(coverageFile)) {
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      const { total } = coverage;

      const thresholds = {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      };

      let allPassed = true;

      Object.entries(thresholds).forEach(([metric, threshold]) => {
        const value = total[metric]?.pct || 0;
        const passed = value >= threshold;

        if (passed) {
          log(`✅ ${metric}: ${value.toFixed(2)}% >= ${threshold}%`, 'green');
        } else {
          log(`❌ ${metric}: ${value.toFixed(2)}% < ${threshold}%`, 'red');
          allPassed = false;
        }
      });

      if (allPassed) {
        log('🎉 所有覆盖率阈值检查通过！', 'green');
      } else {
        log('⚠️  覆盖率阈值检查失败，请提高测试覆盖率', 'yellow');
      }

      return allPassed;
    } else {
      log('⚠️  未找到覆盖率报告文件', 'yellow');
      return true;
    }
  } catch (error) {
    log(`❌ 检查阈值时出错: ${error.message}`, 'red');
    return false;
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  log('🧪 Vue3 Element Admin 测试套件', 'bright');
  log('================================', 'cyan');

  // 确保目录存在
  ensureDirectories();

  let success = true;

  switch (command) {
    case 'unit':
      success = runUnitTests({ coverage: args.includes('--coverage') });
      break;

    case 'unit:watch':
      success = runUnitTests({ watch: true });
      break;

    case 'unit:ui':
      success = runUnitTests({ ui: true });
      break;

    case 'integration':
      success = runIntegrationTests();
      break;

    case 'e2e':
      success = runE2ETests();
      break;

    case 'coverage':
      success = generateReports();
      if (success) {
        checkThresholds();
      }
      break;

    case 'ci':
      log('🚀 CI/CD 测试流程', 'cyan');
      cleanup();
      success = runUnitTests({ coverage: true }) &&
                runIntegrationTests() &&
                generateReports() &&
                checkThresholds();
      break;

    case 'all':
    default:
      log('🚀 运行完整测试套件', 'cyan');
      cleanup();
      success = runUnitTests({ coverage: true }) &&
                runIntegrationTests() &&
                generateReports() &&
                checkThresholds();
      break;
  }

  if (success) {
    log('\n🎉 测试套件执行成功！', 'green');
    process.exit(0);
  } else {
    log('\n❌ 测试套件执行失败！', 'red');
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  log(`\n💥 未捕获的异常: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n💥 未处理的 Promise 拒绝: ${reason}`, 'red');
  console.error(promise);
  process.exit(1);
});

// 运行主函数
const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] === thisFile) {
  main();
}

export {
  runUnitTests,
  runIntegrationTests,
  runE2ETests,
  generateReports,
  checkThresholds
};
