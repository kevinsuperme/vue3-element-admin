import type { FormValidateCallback, FormValidationResult } from 'element-plus';

export interface IForm {
  validate: (callback?: FormValidateCallback | undefined) => FormValidationResult;
}
