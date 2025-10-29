<template>
  <el-config-provider :size="size" :z-index="zIndex" :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<script>
import { defineComponent } from 'vue';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { useAppStore } from '@/store/modules/app';

export default defineComponent({
  data() {
    return {
      locale: zhCn,
      zIndex: 3000
    };
  },
  computed: {
    size() {
      return useAppStore().size;
    }
  }
});
</script>

<style lang="scss">
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
