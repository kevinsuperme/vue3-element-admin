/*
 * @Author: kevinsuperme iphone.com@live.cn
 * @Date: 2025-10-30 02:54:58
 * @LastEditors: kevinsuperme iphone.com@live.cn
 * @LastEditTime: 2025-11-28 01:27:03
 * @FilePath: \vue3-element-admin\backend\src\routes\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import authRoutes from './auth';
import logRoutes from './logs';
import systemRoutes from './system';
import fileRoutes from './files';
import mainRoutes from './main';
import { vueElementAdminRoutes } from './vue-element-admin';

export {
  authRoutes,
  logRoutes,
  systemRoutes,
  fileRoutes,
  mainRoutes,
  vueElementAdminRoutes
};
