import ComputerIcon from '@mui/icons-material/Computer'
import HomeIcon from '@mui/icons-material/Home'
import HubIcon from '@mui/icons-material/Hub'
import SettingsIcon from '@mui/icons-material/Settings'
import { Switch, Typography } from '@mui/material'
import FormControlLabel from '@mui/material/FormControlLabel'
import { Stack } from '@mui/system'
import {
  ariaDescribedByIds,
  FormContextType,
  getUiOptions,
  labelValue,
  RJSFSchema,
  schemaRequiresTrueValue,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils'
import { FocusEvent } from 'react'

// TODO: Dynamical load.
const iconMap: { [key: string]: React.ComponentType<any> } = {
  HubIcon: HubIcon,
  HomeIcon: HomeIcon,
  SettingsIcon: SettingsIcon,
}

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function SwitchPackage<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    schema,
    id,
    value,
    disabled,
    readonly,
    label = '',
    autofocus,
    onChange,
    onBlur,
    onFocus,
    uiSchema,
  } = props
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const required = schemaRequiresTrueValue<S>(schema)

  const _onChange = (
    _: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => onChange(checked)
  const _onBlur = ({ target }: FocusEvent<HTMLButtonElement>) =>
    onBlur(id, target && target.value)
  const _onFocus = ({ target }: FocusEvent<HTMLButtonElement>) =>
    onFocus(id, target && target.value)

  const uiOptions = getUiOptions<T, S, F>(uiSchema)
  const IconComponent =
    typeof uiOptions?.icon === 'string' && iconMap[uiOptions.icon]
      ? iconMap[uiOptions.icon]
      : null

  return (
    <Stack spacing={4} direction="row">
      {IconComponent ? <IconComponent /> : <ComputerIcon />}

      <Stack spacing="2">
        <Typography variant="h6">{label}</Typography>
      </Stack>
      <FormControlLabel
        control={
          <Switch
            id={id}
            name={id}
            checked={value === undefined ? false : Boolean(value)}
            required={required}
            disabled={disabled || readonly}
            autoFocus={autofocus}
            onChange={_onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
            aria-describedby={ariaDescribedByIds<T>(id)}
          />
        }
        label={labelValue(label, true, false)}
      />
    </Stack>
  )
}
