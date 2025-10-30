/*
 * @Author: Kevinsuperme iphone.com@live.cn
 * @Date: 2025-10-30 00:00:03
 * @LastEditors: Kevinsuperme iphone.com@live.cn
 * @LastEditTime: 2025-10-30 01:21:53
 * @FilePath: \vue3-element-admin\src\store\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @QQ: 1583812938
 * @WX: Superme8169
 */
import { createPinia } from 'pinia';
import type { App } from 'vue';
// https://webpack.js.org/guides/dependency-management/#requirecontext
const modulesFiles = import.meta.glob('./modules/*.ts', { eager: true });
// console.log('modulesFiles=', modulesFiles);

// you do not need `import app from './modules/app'`
// it will auto require all vuex module from modules file
// 定义通过import.meta.glob导入的模块结构
interface ImportedModule {
  default?: StoreFunction;
}

// 定义store函数类型（defineStore返回的函数）

type StoreFunction = () => any; // Pinia的defineStore返回的store函数

const modules:Record<string, StoreFunction> = {};
Object.keys(modulesFiles).forEach((modulePath) => {
  // console.log('modulePath=', modulePath);
  // set './modules/app.js' => 'app'
  const moduleName = modulePath.replace(/^\.\/modules\/(.*)\.\w+$/, '$1');
  const value = modulesFiles[modulePath] as ImportedModule;
  // 提取默认导出的store函数
  modules[moduleName] = value.default || (value as unknown as StoreFunction);
});

export const setupStore = (app: App) => {
  const pinia = createPinia();
  app.use(pinia);
};

// console.log('modules=', modules);

export default modules;
