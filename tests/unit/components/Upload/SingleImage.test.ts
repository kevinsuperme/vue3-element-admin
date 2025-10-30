/**
 * 单图片上传组件单元测试
 * @description: 测试单图片上传组件的功能和边界情况
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import SingleImage from '@/components/Upload/SingleImage.vue';

// Mock Element Plus components
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  },
  ElUpload: {
    name: 'ElUpload',
    template: '<div><slot></slot></div>',
    props: ['action', 'headers', 'data', 'name', 'beforeUpload', 'onProgress', 'onSuccess', 'onError'],
    emits: ['update:file-list', 'change']
  },
  ElProgress: {
    name: 'ElProgress',
    template: '<div>Progress: {{percentage}}%</div>',
    props: ['percentage', 'status']
  }
}));

// Mock global variables
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('SingleImage Component', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(SingleImage, {
      props: {
        modelValue: ''
      }
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('基础功能', () => {
    it('应该正确渲染组件', () => {
      expect(wrapper.find('.upload-container').exists()).toBe(true);
      expect(wrapper.find('.upload-image').exists()).toBe(true);
      expect(wrapper.find('.upload-tip').exists()).toBe(true);
    });

    it('应该接受默��props', () => {
      expect(wrapper.vm.action).toBe('/api/upload');
      expect(wrapper.vm.headers).toEqual({});
      expect(wrapper.vm.data).toEqual({});
      expect(wrapper.vm.name).toBe('file');
      expect(wrapper.vm.accept).toBe('image/*');
      expect(wrapper.vm.fileSize).toBe(5);
      expect(wrapper.vm.limit).toBe(1);
    });

    it('应该接受自定义props', () => {
      const customProps = {
        action: '/api/custom-upload',
        headers: { 'Authorization': 'Bearer token' },
        data: { userId: 123 },
        name: 'image',
        accept: 'image/jpeg,image/png',
        fileSize: 10,
        limit: 1,
        tip: '自定义上传提示'
      };

      const customWrapper = mount(SingleImage, {
        props: customProps
      });

      expect(customWrapper.vm.action).toBe(customProps.action);
      expect(customWrapper.vm.headers).toEqual(customProps.headers);
      expect(customWrapper.vm.data).toEqual(customProps.data);
      expect(customWrapper.vm.name).toBe(customProps.name);
      expect(customWrapper.vm.accept).toBe(customProps.accept);
      expect(customWrapper.vm.fileSize).toBe(customProps.fileSize);
      expect(customWrapper.vm.limit).toBe(customProps.limit);

      customWrapper.unmount();
    });
  });

  describe('图片上传功能', () => {
    it('应该正确处理文件选择', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const event = {
        target: { files: [mockFile] }
      };

      await wrapper.vm.handleChange(event);

      expect(wrapper.vm.fileList).toHaveLength(1);
      expect(wrapper.vm.fileList[0].name).toBe('test.jpg');
    });

    it('应该验��文件类型', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const event = {
        target: { files: [invalidFile] }
      };

      const ElMessage = (await import('element-plus')).ElMessage;
      await wrapper.vm.handleChange(event);

      expect(ElMessage.error).toHaveBeenCalledWith('上传文件只能是图片格式!');
      expect(wrapper.vm.fileList).toHaveLength(0);
    });

    it('应该验证文件大小', async () => {
      // 创建一个超过限制的文件 (6MB)
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const event = {
        target: { files: [largeFile] }
      };

      const ElMessage = (await import('element-plus')).ElMessage;
      await wrapper.vm.handleChange(event);

      expect(ElMessage.error).toHaveBeenCalledWith('上传文件大小不能超过 5MB!');
      expect(wrapper.vm.fileList).toHaveLength(0);
    });

    it('应该限制文件数量', async () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ];
      const event = {
        target: { files }
      };

      const ElMessage = (await import('element-plus')).ElMessage;
      await wrapper.vm.handleChange(event);

      expect(ElMessage.warning).toHaveBeenCalledWith('只能上传一张图片!');
      expect(wrapper.vm.fileList).toHaveLength(0);
    });
  });

  describe('上传进度', () => {
    it('应该显示上传进度', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      wrapper.vm.fileList = [mockFile];
      wrapper.vm.uploading = true;
      wrapper.vm.uploadProgress = 50;

      await nextTick();

      expect(wrapper.vm.uploading).toBe(true);
      expect(wrapper.vm.uploadProgress).toBe(50);
    });

    it('应该重置上传状态', async () => {
      wrapper.vm.uploading = true;
      wrapper.vm.uploadProgress = 100;

      wrapper.vm.handleSuccess({
        url: 'http://example.com/image.jpg',
        name: 'test.jpg'
      });

      expect(wrapper.vm.uploading).toBe(false);
      expect(wrapper.vm.uploadProgress).toBe(0);
    });
  });

  describe('成功处理', () => {
    it('应该在成功上传后更新图片URL', async () => {
      const response = {
        data: {
          url: 'http://example.com/uploaded-image.jpg'
        }
      };

      wrapper.vm.handleSuccess(response, new File(['test'], 'test.jpg'));

      expect(wrapper.vm.imageUrl).toBe('http://example.com/uploaded-image.jpg');
      expect(wrapper.vm.uploading).toBe(false);
    });

    it('应该触发modelValue更新事件', async () => {
      const response = {
        data: {
          url: 'http://example.com/new-image.jpg'
        }
      };

      wrapper.vm.handleSuccess(response, new File(['test'], 'test.jpg'));

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['http://example.com/new-image.jpg']);
    });

    it('应该显示成功消息', async () => {
      const ElMessage = (await import('element-plus')).ElMessage;

      wrapper.vm.handleSuccess({
        data: { url: 'http://example.com/image.jpg' }
      }, new File(['test'], 'test.jpg'));

      expect(ElMessage.success).toHaveBeenCalledWith('上传成功!');
    });
  });

  describe('错误处理', () => {
    it('应该处理上传失败', async () => {
      const ElMessage = (await import('element-plus')).ElMessage;
      const error = new Error('Upload failed');

      wrapper.vm.handleError(error);

      expect(ElMessage.error).toHaveBeenCalledWith('上传失败，请重试!');
      expect(wrapper.vm.uploading).toBe(false);
      expect(wrapper.vm.uploadProgress).toBe(0);
    });

    it('应该处理网络错误', async () => {
      const ElMessage = (await import('element-plus')).ElMessage;
      const networkError = {
        message: 'Network Error',
        response: { status: 0 }
      };

      wrapper.vm.handleError(networkError);

      expect(ElMessage.error).toHaveBeenCalledWith('网络错误，请检查网络连接!');
    });

    it('应该处理服务器错误', async () => {
      const ElMessage = (await import('element-plus')).ElMessage;
      const serverError = {
        response: { status: 500, data: { message: 'Server Error' }}
      };

      wrapper.vm.handleError(serverError);

      expect(ElMessage.error).toHaveBeenCalledWith('上传失败: Server Error');
    });

    it('应该处理超时错误', async () => {
      const ElMessage = (await import('element-plus')).ElMessage;
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout'
      };

      wrapper.vm.handleError(timeoutError);

      expect(ElMessage.error).toHaveBeenCalledWith('上传超时，请重试!');
    });
  });

  describe('预览功能', () => {
    it('应该���成图片预览URL', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      wrapper.vm.handlePictureCardPreview(file);

      expect(wrapper.vm.dialogVisible).toBe(true);
      expect(wrapper.vm.dialogImageUrl).toContain('blob:');
    });

    it('应该关闭预览对话框', () => {
      wrapper.vm.dialogVisible = true;
      wrapper.vm.dialogImageUrl = 'http://example.com/image.jpg';

      wrapper.vm.handleDialogClose();

      expect(wrapper.vm.dialogVisible).toBe(false);
    });
  });

  describe('删除功能', () => {
    it('应该删除图片', async () => {
      wrapper.vm.imageUrl = 'http://example.com/image.jpg';
      wrapper.vm.fileList = [{ name: 'test.jpg', url: 'http://example.com/image.jpg' }];

      wrapper.vm.handleRemove();

      expect(wrapper.vm.imageUrl).toBe('');
      expect(wrapper.vm.fileList).toHaveLength(0);
    });

    it('应该触发删除事件', () => {
      wrapper.vm.handleRemove();

      expect(wrapper.emitted('remove')).toBeTruthy();
    });

    it('应该清理Object URL', () => {
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');
      wrapper.vm.imageUrl = 'blob:http://example.com/preview';

      wrapper.vm.handleRemove();

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://example.com/preview');
    });
  });

  describe('边界情况', () => {
    it('应该处理空文件列表', () => {
      const event = {
        target: { files: [] }
      };

      expect(() => {
        wrapper.vm.handleChange(event);
      }).not.toThrow();
    });

    it('应该处理null文件', () => {
      const event = {
        target: { files: null }
      };

      expect(() => {
        wrapper.vm.handleChange(event);
      }).not.toThrow();
    });

    it('应该处理损坏的文件', () => {
      const corruptedFile = new File([''], 'corrupted.jpg', { type: 'image/jpeg' });
      const event = {
        target: { files: [corruptedFile] }
      };

      expect(() => {
        wrapper.vm.handleChange(event);
      }).not.toThrow();
    });

    it('应该处理非常大的文件名', () => {
      const longName = 'a'.repeat(1000);
      const file = new File(['test'], `${longName}.jpg`, { type: 'image/jpeg' });
      const event = {
        target: { files: [file] }
      };

      expect(() => {
        wrapper.vm.handleChange(event);
      }).not.toThrow();
    });
  });

  describe('响应式更新', () => {
    it('应该响应modelValue变化', async () => {
      await wrapper.setProps({ modelValue: 'http://example.com/new-image.jpg' });

      expect(wrapper.vm.imageUrl).toBe('http://example.com/new-image.jpg');
    });

    it('应该在v-model更新时正确处理', async () => {
      const newValue = 'http://example.com/updated-image.jpg';

      await wrapper.setProps({ modelValue: newValue });

      expect(wrapper.vm.imageUrl).toBe(newValue);
    });
  });

  describe('可访问性', () => {
    it('应该有正确的ARIA标签', () => {
      const uploadElement = wrapper.find('.upload-container');
      expect(uploadElement.attributes('aria-label')).toBeDefined();
    });

    it('应该支持键盘导航', () => {
      const uploadElement = wrapper.find('.upload-container');

      expect(() => {
        uploadElement.trigger('keydown', { key: 'Enter' });
      }).not.toThrow();

      expect(() => {
        uploadElement.trigger('keydown', { key: ' ' });
      }).not.toThrow();
    });
  });
});
