import type { BaseRecord } from '@refinedev/core'
import type { RJSFSchema, UiSchema } from '@rjsf/utils'

interface IActionData extends BaseRecord {
  jsonschema: RJSFSchema
  uischema: UiSchema
}

interface IFormValues {
  id: string
}

export type { IActionData, IFormValues }
