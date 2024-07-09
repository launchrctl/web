import { Box, Typography } from '@mui/material'
import Button from '@mui/material/Button'
import {
  useApiUrl,
  useCustomMutation,
  useOne,
  useResource,
} from '@refinedev/core'
import type { IChangeEvent } from '@rjsf/core'
import { withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'
import { DescriptionFieldProps, TitleFieldProps } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import merge from 'lodash/merge'
import type { FC } from 'react'
import { useState } from 'react'

import WizardBanner from '../../components/layout/WizardBanner'
import { useThemeContext } from '../../ThemeProvider'
import type { IActionData, IFormValues } from '../../types'
import { customizeUiSchema } from '../../utils/helpers'
import FormSteps from './FormSteps'

// Make modifications to the theme with your own fields and widgets
const Form = withTheme(Theme)

export const WizardShow: FC = () => {
  // @todo const translate = useTranslate();
  const {
    // resource,
    id: idFromRoute,
    // action: actionFromRoute,
  } = useResource()

  const { isDarkMode } = useThemeContext()

  const apiUrl = useApiUrl()

  const [actionRunning, setActionRunning] = useState(false)

  const queryResult = useOne<IActionData>({
    resource: `actions`,
    id: idFromRoute,
  })

  const { data } = queryResult

  const jsonschema = queryResult?.data?.data?.jsonschema
  let uischema = {
    ...queryResult?.data?.data?.uischema?.uiSchema,
  }

  const actionTitle = data?.data?.title

  if (jsonschema) {
    // @todo I actually don't know for the moment how to overcome error
    //  "no schema with key or ref" produced when schema is defined.
    // Maybe it's because the server returns "2020-12" and default is "draft-07"
    // @see https://ajv.js.org/json-schema.html
    delete jsonschema.$schema

    uischema = merge({}, uischema, customizeUiSchema(jsonschema))
  }

  const { mutateAsync } = useCustomMutation()

  const onSubmit = async (
    { formData }: IChangeEvent<IFormValues>
    // e: FormEvent<IFormValues>,
  ) => {
    if (!formData) {
      return
    }

    setActionRunning(true)

    await mutateAsync({
      url: `${apiUrl}/actions/${idFromRoute}`,
      method: 'post',
      values: formData,
      // @todo more informative messages.
      successNotification: () => ({
        message: 'Action successfully started.',
        description: 'Success with no errors',
        type: 'success',
      }),
      errorNotification() {
        return {
          message: 'Error.',
          description: 'Something goes wrong',
          type: 'error',
        }
      },
    })
    // @todo redirect somewhere
  }

  function TitleFieldTemplate(props: TitleFieldProps) {
    const { id, title } = props
    if (id === 'root__title') {
      return (
        <>
          <Typography id={id} variant="h4">
            {actionTitle || title}
          </Typography>
        </>
      )
    }
    return (
      <Box id={id}>
        <Typography className="visually-hidden">{title}</Typography>
      </Box>
    )
  }

  function DescriptionFieldTemplate(props: DescriptionFieldProps) {
    const { description, id } = props
    return (
      <Typography id={id} sx={{ display: 'block', mt: 1 }} variant="caption">
        {description}
      </Typography>
    )
  }

  return (
    <>
      <WizardBanner
        title={uischema?.wizard?.title}
        subtitle={uischema?.wizard?.description}
      />
      <Box
        sx={{
          padding: 6,
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: isDarkMode ? '#000' : '#F9FAFB',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 3fr',
            maxWidth: 1200,
            width: '100%',
            gap: 4,
          }}
        >
          <FormSteps steps={uischema?.wizard?.steps} current={idFromRoute} />

          {jsonschema && (
            <Form
              schema={jsonschema}
              uiSchema={uischema}
              validator={validator}
              onSubmit={onSubmit}
              templates={{ TitleFieldTemplate, DescriptionFieldTemplate }}
            >
              <div>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={actionRunning}
                >
                  Submit
                </Button>
              </div>
            </Form>
          )}
        </Box>
      </Box>
    </>
  )
}
