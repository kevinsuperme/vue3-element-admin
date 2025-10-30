<template>
  <div class="component-name">
    <el-card v-loading="isLoading">
      <template #header>
        <div class="card-header">
          <span>{{ title }}</span>
          <el-button type="primary" size="small" @click="handleAction">
            操作
          </el-button>
        </div>
      </template>

      <div class="content">
        <!-- 组件内容 -->
        <p>{{ message }}</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';

// ==================== Props ====================
interface Props {
  title?: string
  data?: any
}

const props = withDefaults(defineProps<Props>(), {
  title: '默认标题',
  data: null
});

// ==================== Emits ====================
interface Emits {
  (e: 'update', value: any): void
  (e: 'delete', id: string): void
}

const emit = defineEmits<Emits>();

// ==================== State ====================
const isLoading = ref(false);
const message = ref('Hello World');

// ==================== Computed ====================
const displayTitle = computed(() => {
  return props.title || '未设置标题';
});

// ==================== Watch ====================
watch(() => props.data, (newVal) => {
  console.log('Data changed:', newVal);
}, { deep: true });

// ==================== Methods ====================
async function fetchData() {
  isLoading.value = true;
  try {
    // API 调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    ElMessage.success('数据加载成功');
  } catch (error) {
    ElMessage.error('数据加载失败');
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

function handleAction() {
  emit('update', { message: 'Updated' });
}

// ==================== Lifecycle ====================
onMounted(() => {
  fetchData();
});

// ==================== Expose ====================
defineExpose({
  refresh: fetchData
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.component-name {
  padding: $spacing-lg;

  .card-header {
    @include flex-between;
  }

  .content {
    padding: $spacing-md;
    color: $text-regular;
  }
}
</style>
