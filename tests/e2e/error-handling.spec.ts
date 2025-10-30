/**
 * 错误处理和边界情况E2E测试
 * @description: 测试各种错误场景和边界情况的处理
 */
import { test, expect, type Page } from '@playwright/test';

test.describe('错误处理和边界情况', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
  });

  test.describe('网络错误处理', () => {
    test('应该处理网络连接失败', async () => {
      // 模拟网络离线
      await page.context().setOffline(true);

      await page.goto('http://localhost:4173');

      // 尝试登录
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.click('[data-testid="login-button"]');

      // 验证网络错误提示
      await expect(page.locator('text=网络连接失败')).toBeVisible();
      await expect(page.locator('text=请检查网络连接后重试')).toBeVisible();

      // 恢复网络连接
      await page.context().setOffline(false);

      // 重新尝试登录
      await page.click('[data-testid="login-button"]');

      // 验证登录成功
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('应该处理API服务器错误', async () => {
      await page.goto('http://localhost:4173');

      // 拦截API请求并模拟服务器错误
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '服务器内部错误'
          })
        });
      });

      // 尝试登录
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.click('[data-testid="login-button"]');

      // 验证错误提示
      await expect(page.locator('text=服务器错误')).toBeVisible();
      await expect(page.locator('text=请稍后重试')).toBeVisible();

      // 移除拦截
      await page.unroute('**/api/auth/login');

      // 正常登录
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('应该处理API超时', async () => {
      await page.goto('http://localhost:4173');

      // 拦截API请求并延迟响应
      await page.route('**/api/auth/login', async route => {
        // 延迟30秒模拟超时
        await new Promise(resolve => setTimeout(resolve, 30000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true })
        });
      });

      // 尝试登录
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.click('[data-testid="login-button"]');

      // 验证超时提示
      await expect(page.locator('text=请求超时')).toBeVisible();

      // 移除拦截
      await page.unroute('**/api/auth/login');
    });
  });

  test.describe('表单验证错误', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:4173');
    });

    test('应该处理登录表单验证错误', async () => {
      // 点击登录按钮不填写任何信息
      await page.click('[data-testid="login-button"]');

      // 验证错误提示
      await expect(page.locator('text=请输入用户名')).toBeVisible();
      await expect(page.locator('text=请输入密码')).toBeVisible();

      // 填写用户名但不填写密码
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.click('[data-testid="login-button"]');

      await expect(page.locator('text=请输入密码')).toBeVisible();

      // 填写密码但不填写用户名
      await page.fill('[data-testid="username-input"]', '');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.click('[data-testid="login-button"]');

      await expect(page.locator('text=请输入用户名')).toBeVisible();
    });

    test('应该处理注册表单验证错误', async () => {
      await page.click('text=注册');

      // 测试各种验证错误
      const testCases = [
        {
          field: 'username',
          value: '',
          expectedError: '请输入用户名'
        },
        {
          field: 'username',
          value: 'ab',
          expectedError: '用户名至少需要3个字符'
        },
        {
          field: 'email',
          value: '',
          expectedError: '请输入邮箱'
        },
        {
          field: 'email',
          value: 'invalid-email',
          expectedError: '请输入有效的邮箱地址'
        },
        {
          field: 'password',
          value: '',
          expectedError: '请输入密码'
        },
        {
          field: 'password',
          value: '123',
          expectedError: '密码至少需要8个字符'
        },
        {
          field: 'confirm-password',
          value: 'different',
          expectedError: '两次输入的密码不一致'
        }
      ];

      for (const testCase of testCases) {
        await page.fill(`[data-testid="${testCase.field}-input"]`, testCase.value);
        await page.click('[data-testid="register-button"]');
        await expect(page.locator(`text=${testCase.expectedError}`)).toBeVisible();
      }
    });

    test('应该处理字符限制', async () => {
      await page.click('text=注册');

      // 测试用户名长度限制
      const longUsername = 'a'.repeat(100);
      await page.fill('[data-testid="username-input"]', longUsername);
      await page.click('[data-testid="register-button"]');

      await expect(page.locator('text=用户名不能超过50个字符')).toBeVisible();

      // 测试密码复杂度要求
      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'simplepassword');
      await page.click('[data-testid="register-button"]');

      await expect(page.locator('text=密码必须包含字母和数字')).toBeVisible();
    });
  });

  test.describe('页面状态错误', () => {
    test('应该处理404页面', async () => {
      await page.goto('http://localhost:4173/nonexistent-page');

      // 验证404页面内容
      await expect(page.locator('text=页面不存在')).toBeVisible();
      await expect(page.locator('text=您访问的页面不存在')).toBeVisible();
      await expect(page.locator('text=返回首页')).toBeVisible();

      // 测试返回首页按钮
      await page.click('text=返回首页');
      await expect(page).toHaveURL(/.*\/$/);
    });

    test('应该处理500页面', async () => {
      // 模拟访问一个会产生500错误的页面
      await page.goto('http://localhost:4173/error/500');

      // 验证500页面内容
      await expect(page.locator('text=服务器错误')).toBeVisible();
      await expect(page.locator('text=服务器遇到了问题')).toBeVisible();
      await expect(page.locator('text=刷新页面')).toBeVisible();

      // 测试刷新按钮
      await page.click('text=刷新页面');
      await expect(page).toHaveURL(/.*/); // 应该刷新并重定向
    });

    test('应该处理权限不足页面', async () => {
      // 尝试访问需要管理员权限的页面（未登录状态）
      await page.goto('http://localhost:4173/admin/settings');

      // 验证权限不足页面
      await expect(page.locator('text=权限不足')).toBeVisible();
      await expect(page.locator('text=您没有权限访问该页面')).toBeVisible();
      await expect(page.locator('text=返回登录')).toBeVisible();
    });
  });

  test.describe('数据加载错误', () => {
    test.beforeEach(async () => {
      // 先登录
      await page.goto('http://localhost:4173');
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('应该处理仪表板数据加载失败', async () => {
      // 拦截数据API并返回错误
      await page.route('**/api/dashboard/stats', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            success: false,
            message: '数据加载失败'
          })
        });
      });

      // 刷新页面
      await page.reload();

      // 验证错误提示
      await expect(page.locator('text=数据加载失败')).toBeVisible();
      await expect(page.locator('text=请刷新页面重试')).toBeVisible();

      // 测试重试按钮
      await page.unroute('**/api/dashboard/stats');
      await page.click('text=重试');
      await expect(page.locator('text=数据加载失败')).not.toBeVisible();
    });

    test('应该处理用户列表加载失败', async () => {
      await page.click('[data-testid="nav-users"]');

      // 拦截用户列表API
      await page.route('**/api/users', route => {
        route.fulfill({
          status: 404,
          body: JSON.stringify({
            success: false,
            message: '用户数据不存在'
          })
        });
      });

      // 验证错误提示
      await expect(page.locator('text=用户数据加载失败')).toBeVisible();
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();

      // 移除拦截并重试
      await page.unroute('**/api/users');
      await page.click('text=重试');
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    });
  });

  test.describe('文件上传错误', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:4173');
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.click('[data-testid="login-button"]');
    });

    test('应该处理文件类型错误', async () => {
      // 导航到有上传功能的页面
      await page.click('[data-testid="nav-profile"]');

      // 创建一个非图片文件
      const fileContent = 'This is not an image file';
      const fileName = 'test.txt';
      const file = new File([fileContent], fileName, { type: 'text/plain' });

      // 模拟文件选择
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles(file);

      // 验证错误提示
      await expect(page.locator('text=只能上传图片文件')).toBeVisible();
    });

    test('应该处理文件大小超限', async () => {
      await page.click('[data-testid="nav-profile"]');

      // 创建一个大文件（模拟超过5MB）
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
      const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });

      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles(largeFile);

      // 验证错误提示
      await expect(page.locator('text=文件大小不能超过5MB')).toBeVisible();
    });

    test('应该处理上传中断', async () => {
      await page.click('[data-testid="nav-profile"]');

      // 拦截上传请求并模拟中断
      await page.route('**/api/upload', route => {
        // 模拟网络中断
        route.abort();
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles(file);

      // 验证上传失败提示
      await expect(page.locator('text=上传失败')).toBeVisible();
      await expect(page.locator('text=网络中断，请重试')).toBeVisible();

      // 移除拦截并重试
      await page.unroute('**/api/upload');
      await page.click('text=重试上传');
    });
  });

  test.describe('会话管理错误', () => {
    test('应该处理会话过期', async () => {
      // 先正常登录
      await page.goto('http://localhost:4173');
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.click('[data-testid="login-button"]');
      await expect(page).toHaveURL(/.*dashboard/);

      // 模拟会话过期
      await page.evaluate(() => {
        // 清除localStorage中的token
        localStorage.removeItem('token');
      });

      // 尝试访问需要认证的API
      await page.click('[data-testid="nav-profile"]');

      // 验证会话过期提示
      await expect(page.locator('text=登录已过期')).toBeVisible();
      await expect(page.locator('text=请重新登录')).toBeVisible();

      // 自动跳转到登录页面
      await expect(page).toHaveURL(/.*login/);
    });

    test('应该处理并发登录冲突', async () => {
      // 在两个不同的上下文中模拟同一用户登录
      const context1 = await page.context().browser().newContext();
      const context2 = await page.context().browser().newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // 第一个页面登录
      await page1.goto('http://localhost:4173');
      await page1.fill('[data-testid="username-input"]', 'admin');
      await page1.fill('[data-testid="password-input"]', 'admin123');
      await page1.click('[data-testid="login-button"]');

      // 第二个页面也尝试登录
      await page2.goto('http://localhost:4173');
      await page2.fill('[data-testid="username-input"]', 'admin');
      await page2.fill('[data-testid="password-input"]', 'admin123');
      await page2.click('[data-testid="login-button"]');

      // 验证第二个页面登录成功（允许覆盖会话）
      await expect(page2).toHaveURL(/.*dashboard/);

      // 第一个页面应该提示会话被覆盖
      await expect(page1.locator('text=账号在其他设备登录')).toBeVisible();

      await context1.close();
      await context2.close();
    });
  });

  test.describe('浏览器兼容性错误', () => {
    test('应该处理旧版本浏览器', async () => {
      // 模拟旧版本浏览器User-Agent
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'userAgent', {
          get: () => 'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko'
        });
      });

      await page.goto('http://localhost:4173');

      // 验证浏览器兼容性提示
      await expect(page.locator('text=浏览器版本过低')).toBeVisible();
      await expect(page.locator('text=请升级到最新版本的浏览器')).toBeVisible();
    });

    test('应该处理JavaScript禁用', async () => {
      // 注意：Playwright默认启用JavaScript，这里主要测试noscript标签的处理
      await page.goto('http://localhost:4173');

      // 验证noscript提示是否存在
      const noscriptMessage = await page.locator('noscript');
      if (await noscriptMessage.isVisible()) {
        await expect(noscriptMessage).toContainText('JavaScript');
      }
    });

    test('应该处理Cookie禁用', async () => {
      // 禁用Cookie
      await page.context().clearCookies();

      await page.goto('http://localhost:4173');
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'admin123');
      await page.click('[data-testid="login-button"]');

      // 验证Cookie相关的错误提示
      await expect(page.locator('text=Cookie已被禁用')).toBeVisible();
      await expect(page.locator('text=请启用Cookie以正常使用网站')).toBeVisible();
    });
  });
});
