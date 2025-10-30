/**
 * 用户完整流程E2E测试
 * @description: 测试用户从注册到使用的完整业务流程
 */
import { test, expect, type Page, BrowserContext } from '@playwright/test';

test.describe('用户完整业务流程', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    await page.goto('http://localhost:4173');
  });

  test.describe('用户注册流程', () => {
    test('应该能够完成用户注册流程', async () => {
      // 1. 导航到注册页面
      await page.click('text=注册');
      await expect(page).toHaveURL(/.*register/);

      // 2. 填写注册表单
      await page.fill('[data-testid="username-input"]', 'newuser_' + Date.now());
      await page.fill('[data-testid="email-input"]', `test${Date.now()}@example.com`);
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Password123!');

      // 3. 同意条款
      await page.check('[data-testid="agree-terms"]');

      // 4. 提交注册
      await page.click('[data-testid="register-button"]');

      // 5. 验证注册成功
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('text=注册成功')).toBeVisible();

      // 6. 自动跳转到登录页面或仪表板
      await expect(page).toHaveURL(/.*(login|dashboard)/);
    });

    test('应该验证注册表单字段', async () => {
      await page.click('text=注册');

      // 测试空表单提交
      await page.click('[data-testid="register-button"]');
      await expect(page.locator('text=用户名是必填项')).toBeVisible();
      await expect(page.locator('text=邮箱是必填项')).toBeVisible();
      await expect(page.locator('text=密码是必填项')).toBeVisible();

      // 测试无效邮箱格式
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.click('[data-testid="register-button"]');
      await expect(page.locator('text=请输入有效的邮箱地址')).toBeVisible();

      // 测试密码强度验证
      await page.fill('[data-testid="password-input"]', '123');
      await page.click('[data-testid="register-button"]');
      await expect(page.locator('text=密码至少需要8个字符')).toBeVisible();

      // 测试密码确认不匹配
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');
      await page.click('[data-testid="register-button"]');
      await expect(page.locator('text=两次输入的密码不一致')).toBeVisible();
    });

    test('应该处理重复注册', async () => {
      await page.click('text=注册');

      // 使用已存在的用户名或邮箱
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="email-input"]', 'admin@example.com');
      await page.fill('[data-testid="password-input"]', 'Password123!');
      await page.fill('[data-testid="confirm-password-input"]', 'Password123!');
      await page.check('[data-testid="agree-terms"]');
      await page.click('[data-testid="register-button"]');

      // 验证错误提示
      await expect(page.locator('text=用户名或邮箱已存在')).toBeVisible();
    });
  });

  test.describe('用户登录流程', () => {
    test('应该能够成功登录', async () => {
      // 1. 填写登录表单
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');

      // 2. 提交登录
      await page.click('[data-testid="login-button"]');

      // 3. 验证登录成功
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
      await expect(page.locator('text=欢迎回来')).toBeVisible();
    });

    test('应该处理登录失败', async () => {
      // 使用错误的凭据
      await page.fill('[data-testid="username-input"]', 'wronguser');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');

      // 验证错误提示
      await expect(page.locator('text=用户名或密码错误')).toBeVisible();
      await expect(page).toHaveURL(/.*login/);
    });

    test('应该支持记住登录状态', async () => {
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.check('[data-testid="remember-me"]');
      await page.click('[data-testid="login-button"]');

      // 验证登录成功
      await expect(page).toHaveURL(/.*dashboard/);

      // 重新打开页面验证记住状态
      await page.reload();
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('应该支持回车键登录', async () => {
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');

      // 按回车键
      await page.press('[data-testid="password-input"]', 'Enter');

      // 验证登录成功
      await expect(page).toHaveURL(/.*dashboard/);
    });
  });

  test.describe('仪表板功能', () => {
    test.beforeEach(async () => {
      // 先登录
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('应该显示用户信息和统计数据', async () => {
      // 验证用户信息显示
      await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-name"]')).toContainText('Admin');

      // 验证统计卡片
      await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    });

    test('应该支持图表交互', async () => {
      // 等待图表加载
      await page.waitForSelector('[data-testid="revenue-chart"]', { timeout: 10000 });

      // 验证图表存在
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();

      // 测试图表时间范围切换
      await page.click('[data-testid="chart-period-7d"]');
      await page.waitForTimeout(1000);

      await page.click('[data-testid="chart-period-30d"]');
      await page.waitForTimeout(1000);

      await page.click('[data-testid="chart-period-90d"]');
      await page.waitForTimeout(1000);
    });

    test('应该支持快速操作', async () => {
      // 测试快速操作按钮
      await page.click('[data-testid="quick-action-add-user"]');
      await expect(page.locator('[data-testid="add-user-modal"]')).toBeVisible();

      // 关闭模态框
      await page.click('[data-testid="modal-close"]');
      await expect(page.locator('[data-testid="add-user-modal"]')).not.toBeVisible();

      // 测试其他快速操作
      await page.click('[data-testid="quick-action-view-orders"]');
      await expect(page).toHaveURL(/.*orders/);

      await page.goBack();
    });
  });

  test.describe('用户管理功能', () => {
    test.beforeEach(async () => {
      // 先登录
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.click('[data-testid="login-button"]');

      // 导航到用户管理
      await page.click('[data-testid="nav-users"]');
      await expect(page).toHaveURL(/.*users/);
    });

    test('应该显示用户列表', async () => {
      // 验证用户列表
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-row"]')).toHaveCount.gte(1);

      // 验证表格列
      await expect(page.locator('text=用户名')).toBeVisible();
      await expect(page.locator('text=邮箱')).toBeVisible();
      await expect(page.locator('text=角色')).toBeVisible();
      await expect(page.locator 'text=状态')).toBeVisible();
      await expect(page.locator('text=操作')).toBeVisible();
    });

    test('应该支持用户搜索', async () => {
      // 输入搜索关键词
      await page.fill('[data-testid="user-search"]', 'admin');
      await page.click('[data-testid="search-button"]');

      // 验证搜索结果
      await expect(page.locator('[data-testid="user-row"]')).toHaveCount.gte(1);
      await expect(page.locator('text=admin')).toBeVisible();
    });

    test('应该支持用户筛选', async () => {
      // 按角色筛选
      await page.selectOption('[data-testid="role-filter"]', 'admin');
      await page.click('[data-testid="filter-button"]');

      // 验证筛选结果
      const rows = page.locator('[data-testid="user-row"]');
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i).locator('text=admin')).toBeVisible();
      }

      // 按状态筛选
      await page.selectOption('[data-testid="status-filter"]', 'active');
      await page.click('[data-testid="filter-button"]');

      // 验证筛选结果
      const statusRows = page.locator('[data-testid="user-row"]');
      const statusCount = await statusRows.count();

      for (let i = 0; i < statusCount; i++) {
        await expect(statusRows.nth(i).locator('[data-testid="user-status"]')).toHaveText(/活跃|已激活/);
      }
    });

    test('应该支持用户分页', async () => {
      // 检查分页组件
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();

      // 测试页码导航
      const nextPage = page.locator('[data-testid="next-page"]');
      if (await nextPage.isVisible()) {
        await nextPage.click();
        await page.waitForTimeout(1000);

        // 验证页面变化
        const currentPage = page.locator('[data-testid="current-page"]');
        expect(await currentPage.textContent()).not.toBe('1');
      }

      // 测试页面大小选择
      await page.selectOption('[data-testid="page-size"]', '20');
      await page.waitForTimeout(1000);
    });

    test('应该支持用户编辑', async () => {
      // 点击编辑按钮
      await page.click('[data-testid="edit-user"]:first-child');

      // 验证编辑模态框
      await expect(page.locator('[data-testid="edit-user-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="edit-username"]')).toBeVisible();
      await expect(page.locator('[data-testid="edit-email"]')).toBeVisible();

      // 修改用户信息
      await page.fill('[data-testid="edit-username"]', 'updated_username');
      await page.fill('[data-testid="edit-email"]', 'updated@example.com');

      // 保存修改
      await page.click('[data-testid="save-user"]');

      // 验证成功提示
      await expect(page.locator('text=更新成功')).toBeVisible();
    });

    test('应该支持用户删除', async () => {
      // 点击删除按钮
      await page.click('[data-testid="delete-user"]:first-child');

      // 验证确认对话框
      await expect(page.locator('[data-testid="delete-confirm-dialog"]')).toBeVisible();
      await expect(page.locator('text=确定要删除该用户吗？')).toBeVisible();

      // 确认删除
      await page.click('[data-testid="confirm-delete"]');

      // 验证成功提示
      await expect(page.locator('text=删除成功')).toBeVisible();

      // 验证用户已从列表中移除
      // 注意：这里可能需要根据实际情况调整
    });
  });

  test.describe('权限控制', () => {
    test('普通用户应该无法访问管理员功能', async () => {
      // 使用普通用户登录
      await page.fill('[data-testid="username-input"]', 'user');
      await page.fill('[data-testid="password-input"]', 'user123');
      await page.click('[data-testid="login-button"]');

      // 尝试访问管理员页面
      await page.goto('http://localhost:4173/admin/users');

      // 验证被重定向或显示权限不足
      await expect(page.locator('text=权限不足')).toBeVisible();
      // 或者被重定向到首页
      // await expect(page).toHaveURL(/.*dashboard/);
    });

    test('管理员应该能够访问所有功能', async () => {
      // 使用管理员登录
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.click('[data-testid="login-button"]');

      // 验证能够访问管理页面
      await page.click('[data-testid="nav-admin"]');
      await expect(page).toHaveURL(/.*admin/);

      // 验证管理功能可用
      await expect(page.locator('[data-testid="admin-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-roles"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-settings"]')).toBeVisible();
    });
  });

  test.describe('响应式设计', () => {
    ['iPhone 12', 'iPad', 'Desktop'].forEach(device => {
      test(`应该在${device}上正常显示`, async ({ playwright }) => {
        const deviceObj = playwright.devices[device as keyof typeof playwright.devices];
        if (deviceObj) {
          await context.addInitScript(deviceObj.useUserAgent, deviceObj.userAgent);
          await page.setViewportSize(deviceObj.viewport);
        }

        await page.goto('http://localhost:4173');

        // 验证登录页面
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

        // 移动端可能有不同的导航
        if (device === 'iPhone 12') {
          await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
        } else {
          await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
        }

        // 验证响应式布局
        await page.fill('[data-testid="username-input"]', 'admin');
        await page.fill('[data-testid="password-input"]', 'admin123');
        await page.click('[data-testid="login-button"]');

        await expect(page).toHaveURL(/.*dashboard/);

        // 验证仪表板在不同设备上的显示
        await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      });
    });
  });

  test.describe('性能测试', () => {
    test('页面加载时间应该在合理范围内', async () => {
      const startTime = Date.now();

      await page.goto('http://localhost:4173');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // 页面加载时间应该小于3秒
      expect(loadTime).toBeLessThan(3000);
    });

    test('API响应时间应该合理', async () => {
      // 监听API请求
      const apiCalls: { url: string; duration: number }[] = [];

      page.on('response', response => {
        if (response.url().includes('/api/')) {
          const timing = response.request().timing();
          const duration = timing.responseEnd - timing.requestStart;
          apiCalls.push({
            url: response.url(),
            duration
          });
        }
      });

      await page.goto('http://localhost:4173');
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.click('[data-testid="login-button"]');

      // 等待所有API调用完成
      await page.waitForLoadState('networkidle');

      // 验证API响应时间
      apiCalls.forEach(call => {
        // API响应时间应该小于2秒
        expect(call.duration).toBeLessThan(2000);
      });
    });
  });
});