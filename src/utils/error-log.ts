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

export function checkEnableLogs(app: App) {
  if (checkNeed()) {
    app.config.errorHandler = function(err, instance, info) {
      // Don't ask me why I use Vue.nextTick, it just a hack.
      // detail see https://forum.vuejs.org/t/dispatch-in-vue-config-errorhandler-has-some-problem/23500
      nextTick(() => {
        try {
          // Add delay to ensure Pinia is fully initialized
          setTimeout(() => {
            try {
              const errorLogStore = useErrorLogStore();
              if (errorLogStore && errorLogStore.addErrorLog) {
                errorLogStore.addErrorLog({
                  err,
                  instance,
                  info,
                  url: window.location.href
                });
              }
            } catch (storeError) {
              console.error('Error logging failed:', storeError);
            }
          }, 0);
        } catch (error) {
          console.error('Error in error handler setup:', error);
        }
        console.error(err, info);
      });
    };
  }
}
