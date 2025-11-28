#!/usr/bin/env node

/**
 * 代码覆盖率报告生成脚本
 * @description: 生成前后端项目的合并覆盖率报告
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出函数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// 日志函数
const log = {
  info: (msg) => console.log(colors.blue('[INFO]'), msg),
  success: (msg) => console.log(colors.green('[SUCCESS]'), msg),
  warning: (msg) => console.log(colors.yellow('[WARNING]'), msg),
  error: (msg) => console.log(colors.red('[ERROR]'), msg)
};

// 执行命令的辅助函数
function runCommand(command, cwd = process.cwd(), options = {}) {
  try {
    log.info(`Running: ${command}`);
    const result = execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return result;
  } catch (error) {
    log.error(`Command failed: ${command}`);
    if (!options.silent) {
      console.error(error.stdout || error.message);
    }
    throw error;
  }
}

// 检查是否安装了依赖
function checkDependencies(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const nodeModulesPath = path.join(projectPath, 'node_modules');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found in ${projectPath}`);
  }

  if (!fs.existsSync(nodeModulesPath)) {
    log.warning('Dependencies not found, installing...');
    runCommand('npm install', projectPath);
  }
}

// 生成前端覆盖率报告
function generateFrontendCoverage() {
  log.info('Generating frontend coverage report...');

  const frontendPath = path.resolve(process.cwd(), '.');
  checkDependencies(frontendPath);

  try {
    // 运行测试并生成覆盖率
    runCommand('npm run test:unit -- --run --coverage', frontendPath);

    const coveragePath = path.join(frontendPath, 'coverage');
    if (fs.existsSync(coveragePath)) {
      log.success('Frontend coverage report generated');
      return coveragePath;
    } else {
      throw new Error('Frontend coverage report not found');
    }
  } catch (error) {
    log.error('Failed to generate frontend coverage');
    throw error;
  }
}

// 生成后端覆盖率报告
function generateBackendCoverage() {
  log.info('Generating backend coverage report...');

  const backendPath = path.resolve(process.cwd(), 'backend');
  checkDependencies(backendPath);

  try {
    // 运行测试并生成覆盖率
    runCommand('npm test -- --coverage', backendPath);

    const coveragePath = path.join(backendPath, 'coverage');
    if (fs.existsSync(coveragePath)) {
      log.success('Backend coverage report generated');
      return coveragePath;
    } else {
      throw new Error('Backend coverage report not found');
    }
  } catch (error) {
    log.error('Failed to generate backend coverage');
    throw error;
  }
}

// 读取覆盖率数据
function readCoverageData(coveragePath) {
  const summaryFile = path.join(coveragePath, 'coverage-summary.json');

  if (!fs.existsSync(summaryFile)) {
    throw new Error(`Coverage summary not found: ${summaryFile}`);
  }

  try {
    const summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    return summaryData;
  } catch (error) {
    throw new Error(`Failed to read coverage summary: ${error.message}`);
  }
}

// 格式化覆盖率百分比
function formatPercentage(value) {
  return `${parseFloat(value).toFixed(2)}%`;
}

// 打印覆盖率报告
function printCoverageReport(frontendData, backendData) {
  console.log('\n' + colors.cyan('='.repeat(80)));
  console.log(colors.cyan('                    代码覆盖率报告'));
  console.log(colors.cyan('='.repeat(80)));

  // 打印前端覆盖率
  if (frontendData && frontendData.total) {
    console.log('\n' + colors.yellow('前端覆盖率:'));
    console.log(`  代码行: ${formatPercentage(frontendData.total.lines.pct)}`);
    console.log(`  函数: ${formatPercentage(frontendData.total.functions.pct)}`);
    console.log(`  分支: ${formatPercentage(frontendData.total.branches.pct)}`);
    console.log(`  语句: ${formatPercentage(frontendData.total.statements.pct)}`);
  }

  // 打印后端覆盖率
  if (backendData && backendData.total) {
    console.log('\n' + colors.yellow('后端覆盖率:'));
    console.log(`  代码行: ${formatPercentage(backendData.total.lines.pct)}`);
    console.log(`  函数: ${formatPercentage(backendData.total.functions.pct)}`);
    console.log(`  分支: ${formatPercentage(backendData.total.branches.pct)}`);
    console.log(`  语句: ${formatPercentage(backendData.total.statements.pct)}`);
  }

  // 计算总体覆盖率
  if (frontendData && backendData) {
    console.log('\n' + colors.green('总体覆盖率:'));

    const totalLines = {
      covered: frontendData.total.lines.covered + backendData.total.lines.covered,
      total: frontendData.total.lines.total + backendData.total.lines.total
    };

    const totalFunctions = {
      covered: frontendData.total.functions.covered + backendData.total.functions.covered,
      total: frontendData.total.functions.total + backendData.total.functions.total
    };

    const totalBranches = {
      covered: frontendData.total.branches.covered + backendData.total.branches.covered,
      total: frontendData.total.branches.total + backendData.total.branches.total
    };

    const totalStatements = {
      covered: frontendData.total.statements.covered + backendData.total.statements.covered,
      total: frontendData.total.statements.total + backendData.total.statements.total
    };

    console.log(`  代码行: ${formatPercentage((totalLines.covered / totalLines.total) * 100)}`);
    console.log(`  函数: ${formatPercentage((totalFunctions.covered / totalFunctions.total) * 100)}`);
    console.log(`  分支: ${formatPercentage((totalBranches.covered / totalBranches.total) * 100)}`);
    console.log(`  语句: ${formatPercentage((totalStatements.covered / totalStatements.total) * 100)}`);
  }

  console.log(colors.cyan('='.repeat(80)));
}

// 检查覆盖率阈值
function checkCoverageThresholds(frontendData, backendData, thresholds = { lines: 80, functions: 80, branches: 80, statements: 80 }) {
  let allPassed = true;

  const checkThreshold = (name, value, threshold) => {
    const percentage = parseFloat(value);
    if (percentage < threshold) {
      log.error(`${name} 覆盖率 ${formatPercentage(value)} 低于阈值 ${threshold}%`);
      allPassed = false;
    } else {
      log.success(`${name} 覆盖率 ${formatPercentage(value)} 达到阈值`);
    }
  };

  if (frontendData && frontendData.total) {
    console.log('\n' + colors.yellow('前端覆盖率检查:'));
    checkThreshold('代码行', frontendData.total.lines.pct, thresholds.lines);
    checkThreshold('函数', frontendData.total.functions.pct, thresholds.functions);
    checkThreshold('分支', frontendData.total.branches.pct, thresholds.branches);
    checkThreshold('语句', frontendData.total.statements.pct, thresholds.statements);
  }

  if (backendData && backendData.total) {
    console.log('\n' + colors.yellow('后端覆盖率检查:'));
    checkThreshold('代码行', backendData.total.lines.pct, thresholds.lines);
    checkThreshold('函数', backendData.total.functions.pct, thresholds.functions);
    checkThreshold('分支', backendData.total.branches.pct, thresholds.branches);
    checkThreshold('语句', backendData.total.statements.pct, thresholds.statements);
  }

  return allPassed;
}

// 主函数
async function main() {
  try {
    log.info('Starting coverage report generation...');

    let frontendCoverage, backendCoverage;
    let frontendData, backendData;

    // 生成前端覆盖率报告
    try {
      frontendCoverage = generateFrontendCoverage();
      frontendData = readCoverageData(frontendCoverage);
    } catch (error) {
      log.warning('Frontend coverage generation failed:', error.message);
    }

    // 生成后端覆盖率报告
    try {
      backendCoverage = generateBackendCoverage();
      backendData = readCoverageData(backendCoverage);
    } catch (error) {
      log.warning('Backend coverage generation failed:', error.message);
    }

    // 打印覆盖率报告
    if (frontendData || backendData) {
      printCoverageReport(frontendData, backendData);

      // 检查覆盖率阈值
      const thresholdsPassed = checkCoverageThresholds(frontendData, backendData);

      if (!thresholdsPassed) {
        log.error('Coverage thresholds not met!');
        process.exit(1);
      } else {
        log.success('All coverage thresholds met!');
      }

      // 生成合并报告目录
      const mergedReportsPath = path.resolve(process.cwd(), 'coverage-reports');
      if (!fs.existsSync(mergedReportsPath)) {
        fs.mkdirSync(mergedReportsPath, { recursive: true });
      }

      // 复制覆盖率报告到合并目录
      if (frontendCoverage) {
        const frontendTarget = path.join(mergedReportsPath, 'frontend');
        if (fs.existsSync(frontendTarget)) {
          fs.rmSync(frontendTarget, { recursive: true });
        }
        fs.cpSync(frontendCoverage, frontendTarget, { recursive: true });
      }

      if (backendCoverage) {
        const backendTarget = path.join(mergedReportsPath, 'backend');
        if (fs.existsSync(backendTarget)) {
          fs.rmSync(backendTarget, { recursive: true });
        }
        fs.cpSync(backendCoverage, backendTarget, { recursive: true });
      }

      log.success(`Merged coverage reports saved to: ${mergedReportsPath}`);
      log.info('View HTML reports:');
      if (frontendCoverage) {
        console.log(`  Frontend: ${path.join(mergedReportsPath, 'frontend', 'lcov-report', 'index.html')}`);
      }
      if (backendCoverage) {
        console.log(`  Backend: ${path.join(mergedReportsPath, 'backend', 'lcov-report', 'index.html')}`);
      }
    } else {
      log.error('No coverage reports generated!');
      process.exit(1);
    }
  } catch (error) {
    log.error('Coverage report generation failed:', error.message);
    process.exit(1);
  }
}

// 处理命令行参数
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node coverage-report.js [options]

Options:
  --help, -h     Show this help message
  --thresholds   Set custom coverage thresholds (default: 80%)
  --frontend-only Generate only frontend coverage
  --backend-only  Generate only backend coverage

Examples:
  node coverage-report.js
  node coverage-report.js --frontend-only
  node coverage-report.js --thresholds=90
  `);
  process.exit(0);
}

// 运行主函数
main();
