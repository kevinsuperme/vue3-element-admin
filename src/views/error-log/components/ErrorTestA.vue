<template>
  <div>
    <el-button type="danger" @click="handleError">Click to trigger Error A</el-button>
    <!--error code-->
    <div v-if="showError">
      {{ a.a }}
    </div>
    <!--error code-->
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ErrorTestA',
  data() {
    return {
      showError: false
    };
  },
  methods: {
    handleError() {
      this.showError = true;
    }
  }
});
</script>
