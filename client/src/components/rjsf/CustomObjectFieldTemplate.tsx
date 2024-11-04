import {
  Divider,
  FormControlLabel,
  Paper,
  Switch,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import { Box, Stack } from '@mui/system'
import {
  canExpand,
  descriptionId,
  FormContextType,
  getTemplate,
  getUiOptions,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  titleId,
} from '@rjsf/utils'
import { ChangeEvent, useState } from 'react'

export default function CustomObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    title,
    properties,
    required,
    disabled,
    readonly,
    uiSchema,
    idSchema,
    schema,
    formData,
    onAddClick,
    registry,
  } = props

  const uiOptions = getUiOptions<T, S, F>(uiSchema)
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>(
    'TitleFieldTemplate',
    registry,
    uiOptions
  )
  const DescriptionFieldTemplate = getTemplate<
    'DescriptionFieldTemplate',
    T,
    S,
    F
  >('DescriptionFieldTemplate', registry, uiOptions)
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates

  // Move useState hook outside of conditional logic
  const [checked, setChecked] = useState(false)
  const handleSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
  }

  let output

  if (
    uiOptions.CustomObjectTemplate === 'domains' &&
    uiOptions.LayoutSettings
  ) {
    interface DomainSetting {
      label: string
      items: string[]
    }
    const settings = uiOptions.LayoutSettings as DomainSetting[]
    output = (
      <Grid item={true} xs={12}>
        <Stack spacing={3}>
          <Divider component="div" />
          {settings.map((setting) => (
            <Stack spacing={1} key={setting.label}>
              <Typography variant="h6">{setting.label}</Typography>
              <Stack spacing={2} direction="row">
                {setting.items.map((itemName) => {
                  const item = properties.find((obj) => obj.name === itemName)
                  return item ? item.content : 'Content not found'
                })}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Grid>
    )
  } else if (uiOptions.CustomObjectTemplate === 'packages') {
    output = (
      <Grid item={true} xs={12}>
        <FormControlLabel
          control={<Switch checked={checked} onChange={handleSwitchChange} />}
          label={checked ? 'Activated' : 'Disabled'}
        />
        {checked && (
          <Paper variant="outlined">
            <span>{checked}</span>
            {properties.map((element, index) =>
              element.hidden ? (
                element.content
              ) : (
                <div key={index}>
                  <Box sx={{ padding: 2 }}>{element.content}</Box>
                  <Divider />
                </div>
              )
            )}
          </Paper>
        )}
      </Grid>
    )
  } else {
    output = (
      <>
        {properties.map((element, index) =>
          element.hidden ? (
            element.content
          ) : (
            <Grid
              item={true}
              xs={12}
              key={index}
              style={{ marginBottom: '10px' }}
            >
              {element.content}
            </Grid>
          )
        )}
      </>
    )
  }

  return (
    <>
      {title && (
        <TitleFieldTemplate
          id={titleId<T>(idSchema)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(idSchema)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Grid container={true} spacing={2} style={{ marginTop: '10px' }}>
        {output}
        {canExpand<T, S, F>(schema, uiSchema, formData) && (
          <Grid container justifyContent="flex-end">
            <Grid item={true}>
              <AddButton
                className="object-property-expand"
                onClick={onAddClick(schema)}
                disabled={disabled || readonly}
                uiSchema={uiSchema}
                registry={registry}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </>
  )
}
