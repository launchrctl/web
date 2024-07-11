import type { BaseRecord } from '@refinedev/core'
import type { RJSFSchema, UiSchema } from '@rjsf/utils'

type ActionState = 'created' | 'running' | 'finished' | 'error'

type IFlowNodeType = 'node-start' | 'node-wrapper' | 'node-action'
interface IAction {
  id: string
  title?: string
  description?: string
}

interface IActionProcess {
  id: string
  status: ActionState
}

interface IActionWithRunInfo extends IAction {
  processes: IActionProcess[]
}

interface IActionData extends BaseRecord {
  jsonschema: RJSFSchema
  uischema: UiSchema
}

interface IFormValues {
  id: string
}

export type {
  ActionState,
  IAction,
  IActionData,
  IActionProcess,
  IActionWithRunInfo,
  IFlowNodeType,
  IFormValues,
}
