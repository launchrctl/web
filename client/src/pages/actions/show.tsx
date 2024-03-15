import type { BaseRecord, IResourceComponentsProps } from '@refinedev/core';
import {
  useApiUrl,
  useCustom,
  useCustomMutation,
  useOne,
  useResource,
} from '@refinedev/core';
import { Edit } from '@refinedev/mui';
import type { IChangeEvent } from '@rjsf/core';
import { withTheme } from '@rjsf/core';
import { Theme } from '@rjsf/mui';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import type { FC } from 'react';

// @todo move to types
interface IActionData extends BaseRecord {
  jsonschema: RJSFSchema;
}

interface IRunInfo extends BaseRecord {
  status: string;
}

interface IFormValues {
  id: string;
}

// Make modifications to the theme with your own fields and widgets
const Form = withTheme(Theme);

interface IActionRunningProps {
  isLoading: boolean;
  list?: IRunInfo[];
}

const ActionRunningState: FC<IActionRunningProps> = ({ isLoading, list }) => {
  if (isLoading) {
    return <></>;
  }

  return (
    <ul>
      {list?.map((info) => (
        <li key={info.id}>
          {info.id}: {info.status}
        </li>
      ))}
    </ul>
  );
};

export const ActionShow: FC<IResourceComponentsProps> = () => {
  // @todo const translate = useTranslate();
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

  // eslint-disable-next-line unicorn/consistent-destructuring
  const jsonschema = queryResult?.data?.data?.jsonschema;

  if (jsonschema) {
    // @todo I actually don't know for the moment how to overcome error
    //  "no schema with key or ref" produced when schema is defined.
    // Maybe it's because the server returns "2020-12" and default is "draft-07"
    // @see https://ajv.js.org/json-schema.html
    delete jsonschema.$schema;
  }

  const apiUrl = useApiUrl();
  const queryRunning = useCustom<IRunInfo[]>({
    url: `${apiUrl}/actions/${idFromRoute}/running`,
    method: 'get',
  });
  const { isFetching: isFetchingRunning, refetch } = queryRunning;
  // eslint-disable-next-line unicorn/consistent-destructuring
  const running = queryRunning?.data?.data;

  const { mutateAsync } = useCustomMutation();

  const onSubmit = async (
    { formData }: IChangeEvent<IFormValues>,
    // e: FormEvent<IFormValues>,
  ) => {
    if (!formData) {
      return;
    }

    await mutateAsync({
      url: `${apiUrl}/actions/${idFromRoute}`,
      method: 'post',
      values: formData,
      // successNotification,
      // errorNotification,
    });
    await refetch();
    // @todo redirect somewhere
    // @todo show notification
  };

  return (
    <Edit isLoading={isFetching}>
      <ActionRunningState isLoading={isFetchingRunning} list={running} />
      {jsonschema && (
        <Form schema={jsonschema} validator={validator} onSubmit={onSubmit} />
      )}
    </Edit>
  );
};
