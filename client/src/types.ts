import type { BaseRecord } from '@refinedev/core'
import type { RJSFSchema, UiSchema } from '@rjsf/utils'

type IFlowNodeType = 'node-start' | 'node-wrapper' | 'node-action'

interface IAction {
  id: string
  title?: string
  description?: string
}
interface IActionData extends BaseRecord {
  jsonschema: RJSFSchema
  uischema: UiSchema
}

interface IFormValues {
  id: string
}

export type { IAction, IActionData, IFlowNodeType, IFormValues }
