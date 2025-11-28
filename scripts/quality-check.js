#!/usr/bin/env node

/**
 * 代码质量检查脚本
 * 检查前端和后端的代码质量，包括TypeScript、ESLint、测试覆盖率等
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  divider: () => console.log(chalk.gray('─'.repeat(50)))
};

function runCommand(command, description, cwd = process.cwd()) {
  log.info(description);
  try {
    execSync(command, {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    log.success(`${description} - 通过`);
    return true;
  } catch {
    log.error(`${description} - 失败`);
    return false;
  }
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    log.success(`${description} - 存在`);
    return true;
  } else {
    log.warning(`${description} - 不存在`);
    return false;
  }
}

function runFrontendQualityChecks() {
  log.divider();
  log.info('开始前端代码质量检查...');

  const results = [];
  const frontendDir = path.join(__dirname, '..');

  // 检查必要文件
  results.push(
    checkFileExists(
      path.join(frontendDir, 'tsconfig.json'),
      'TypeScript配置文件'
    )
  );

  // TypeScript类型检查
  results.push(
    runCommand(
      'npx vue-tsc --noEmit',
      'TypeScript类型检查',
      frontendDir
    )
  );

  // ESLint检查
  results.push(
    runCommand(
      'npx eslint src --ext .vue,.js,.ts --max-warnings 0',
      'ESLint代码规范检查',
      frontendDir
    )
  );

  // 单元测试
  results.push(
    runCommand(
      'npm run test:unit',
      '前端单元测试',
      frontendDir
    )
  );

  // 测试覆盖率
  results.push(
    runCommand(
      'npm run test:coverage',
      '测试覆盖率检查',
      frontendDir
    )
  );

  return results.every(Boolean);
}

function runBackendQualityChecks() {
  log.divider();
  log.info('开始后端代码质量检查...');

  const results = [];
  const backendDir = path.join(__dirname, '../backend');

  if (!fs.existsSync(backendDir)) {
    log.warning('后端目录不存在，跳过后端检查');
    return true;
  }

  // 检查必要文件
  results.push(
    checkFileExists(
      path.join(backendDir, 'tsconfig.json'),
      '后端TypeScript配置文件'
    ),
    checkFileExists(
      path.join(backendDir, 'jest.config.js'),
      'Jest测试配置文件'
    )
  );

  // TypeScript类型检查
  results.push(
    runCommand(
      'npx tsc --noEmit',
      '后端TypeScript类型检查',
      backendDir
    )
  );

  // ESLint检查
  results.push(
    runCommand(
      'npx eslint src --ext .ts --max-warnings 0',
      '后端ESLint代码规范检查',
      backendDir
    )
  );

  // 单元测试
  results.push(
    runCommand(
      'npm run test',
      '后端单元测试',
      backendDir
    )
  );

  // 测试覆盖率
  results.push(
    runCommand(
      'npm run test:coverage',
      '后端测试覆盖率检查',
      backendDir
    )
  );

  return results.every(Boolean);
}

function runSecurityChecks() {
  log.divider();
  log.info('开始安全检查...');

  const results = [];
  const frontendDir = path.join(__dirname, '..');
  const backendDir = path.join(__dirname, '../backend');

  // 前端依赖安全检查
  results.push(
    runCommand(
      'npm audit --audit-level moderate',
      '前端依赖安全检查',
      frontendDir
    )
  );

  // 后端依赖安全检查
  if (fs.existsSync(backendDir)) {
    results.push(
      runCommand(
        'npm audit --audit-level moderate',
        '后端依赖安全检查',
        backendDir
      )
    );
  }

  return results.every(Boolean);
}

function generateQualityReport(frontendPassed, backendPassed, securityPassed) {
  log.divider();
  log.info('生成质量报告...');

  const report = {
    timestamp: new Date().toISOString(),
    results: {
      frontend: frontendPassed ? 'PASS' : 'FAIL',
      backend: backendPassed ? 'PASS' : 'FAIL',
      security: securityPassed ? 'PASS' : 'FAIL'
    },
    summary: frontendPassed && backendPassed && securityPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED',
    recommendations: []
  };

  if (!frontendPassed) {
    report.recommendations.push('修复前端代码质量问题');
  }

  if (!backendPassed) {
    report.recommendations.push('修复后端代码质量问题');
  }

  if (!securityPassed) {
    report.recommendations.push('修复安全漏洞');
  }

  // 保存报告
  const reportPath = path.join(__dirname, '../quality-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log.success(`质量报告已生成: ${reportPath}`);

  return report;
}

function main() {
  log.info('Vue3 Element Admin 代码质量检查');
  log.info(`开始时间: ${new Date().toISOString()}`);

  try {
    // 安装依赖
    runCommand('npm install', '安装项目依赖');

    // 运行检查
    const frontendPassed = runFrontendQualityChecks();
    const backendPassed = runBackendQualityChecks();
    const securityPassed = runSecurityChecks();

    // 生成报告
    const report = generateQualityReport(frontendPassed, backendPassed, securityPassed);

    log.divider();
    if (report.summary === 'ALL CHECKS PASSED') {
      log.success('所有检查通过！代码质量良好。');
      process.exit(0);
    } else {
      log.error('部分检查失败，请修复问题后重新运行。');
      report.recommendations.forEach(rec => {
        log.warning(`- ${rec}`);
      });
      process.exit(1);
    }
  } catch {
    log.error('质量检查过程中发生错误');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runFrontendQualityChecks, runBackendQualityChecks, runSecurityChecks };
