import { Edit } from "@refinedev/chakra-ui";
import type { BaseRecord, IResourceComponentsProps } from "@refinedev/core";
import {
  useApiUrl,
  useCustomMutation,
  useOne,
  useResource,
} from "@refinedev/core";
import { Theme as ChakraUITheme } from "@rjsf/chakra-ui";
import type { IChangeEvent } from "@rjsf/core";
import { withTheme } from "@rjsf/core";
import type { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";

// @todo move to types
interface IActionData extends BaseRecord {
  jsonschema: RJSFSchema;
}

interface IFormValues {
  id: string;
}

// Make modifications to the theme with your own fields and widgets
const FormChakraUI = withTheme(ChakraUITheme);

export const ActionShow: React.FC<IResourceComponentsProps> = () => {
  // @todo maybe show current action state on show.
  // @todo use translate
  // const translate = useTranslate();
  // useForm();
  // const {formLoading, onFinish, queryResult} = useForm<IAction, HttpError, FormValues>({
  //     action: "clone", // @todo make custom request.
  //     redirect:false
  // });

  const {
    // resource,
    id: idFromRoute,
    // action: actionFromRoute,
    identifier,
  } = useResource();

  const queryResult = useOne<IActionData>({
    resource: identifier,
    id: idFromRoute,
  });
  const { isFetching } = queryResult;

  // const dataProvider = useDataProvider()();
  //
  // dataProvider.getOne<IAction>("actions", )
  const apiUrl = useApiUrl();
  const { mutate } = useCustomMutation();

  const onSubmit = (
    { formData }: IChangeEvent<IFormValues>,
    // e: FormEvent<IFormValues>,
  ) => {
    if (!formData) {
      return;
    }

    mutate({
      url: `${apiUrl}/actions/${idFromRoute}`,
      method: "post",
      values: formData,
    });
    // @todo redirect somewhere
    // @todo show notification
  };

  // eslint-disable-next-line unicorn/consistent-destructuring
  const actionData = queryResult?.data?.data;

  return (
    <Edit isLoading={isFetching}>
      {actionData && (
        <FormChakraUI
          schema={actionData.jsonschema}
          validator={validator}
          onSubmit={onSubmit}
        />
      )}
    </Edit>
  );
};
