<template>
  <div style="margin-top: 15px;">
    <el-button type="danger" @click="handleError">Click to trigger Error B</el-button>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  methods: {
    handleError() {
      this.b = b // eslint-disable-line
    }
  }
});
</script>
