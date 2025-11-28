/*
 * @Author: kevinsuperme iphone.com@live.cn
 * @Date: 2025-10-30 00:00:03
 * @LastEditors: kevinsuperme iphone.com@live.cn
 * @LastEditTime: 2025-10-30 02:24:36
 * @FilePath: \vue3-element-admin\src\utils\error-log.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { useErrorLogStore } from '@/store/modules/errorLog';
import { isString, isArray } from '@/utils/validate';
import settings from '@/settings';
import { nextTick } from 'vue';
import type { App } from 'vue';
import logger from '@/utils/logger';

// you can set in settings.js
// errorLog:'production' | ['production', 'development']
const { errorLog: needErrorLog } = settings;

function checkNeed() {
  const env = import.meta.env.VITE_ENV || '';
  if (isString(needErrorLog)) {
    return env === needErrorLog;
  }
  if (isArray(needErrorLog)) {
    return needErrorLog.includes(env);
  }
  return false;
}

// 存储错误处理定时器ID，用于清理
const errorTimers: Set<number> = new Set();

export function checkEnableLogs(app: App) {
  if (checkNeed()) {
    app.config.errorHandler = function(err, instance, info) {
      // 使用更可靠的方式处理错误
      nextTick(() => {
        try {
          // 使用requestAnimationFrame替代setTimeout，更高效
          const timerId = requestAnimationFrame(() => {
            try {
              const errorLogStore = useErrorLogStore();
              if (errorLogStore && typeof errorLogStore.addErrorLog === 'function') {
                errorLogStore.addErrorLog({
                  err,
                  instance,
                  info,
                  url: window.location.href,
                  timestamp: new Date().toISOString()
                });
              }
            } catch (storeError) {
              logger.error('Error logging failed:', storeError);
            } finally {
              errorTimers.delete(timerId);
            }
          });
          errorTimers.add(timerId);
        } catch (error) {
          logger.error('Error in error handler setup:', error);
        }
        logger.error(err, info);
      });
    };

    // 在应用卸载时清理定时器
    app.unmount = (() => {
      const originalUnmount = app.unmount.bind(app);
      return () => {
        // 清理所有待处理的错误定时器
        errorTimers.forEach(timerId => {
          cancelAnimationFrame(timerId);
        });
        errorTimers.clear();
        originalUnmount();
      };
    })();
  }
}

// 导出清理函数，供测试或特殊情况使用
export function clearErrorTimers() {
  errorTimers.forEach(timerId => {
    cancelAnimationFrame(timerId);
  });
  errorTimers.clear();
}
