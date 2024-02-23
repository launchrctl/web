import React, { useEffect, useState } from 'react';
import { Edit } from "@refinedev/chakra-ui";
import type { BaseRecord, IResourceComponentsProps } from "@refinedev/core";
import {
  useApiUrl,
  useCustom,
  useCustomMutation,
  useOne,
  useResource,
} from "@refinedev/core";
import { Theme as ChakraUITheme } from "@rjsf/chakra-ui";
import {
  Heading,
} from "@chakra-ui/react";
import type { IChangeEvent } from "@rjsf/core";
import Form, { withTheme } from "@rjsf/core";
import type { RJSFSchema } from "@rjsf/utils";
import { UiSchema, WidgetProps, RegistryWidgetsType } from '@rjsf/utils';
import validator from "@rjsf/validator-ajv8";

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
const FormChakraUI = withTheme(ChakraUITheme);

interface IActionRunningProps {
  isLoading: boolean;
  list?: IRunInfo[];
}

const ActionRunningState: React.FC<IActionRunningProps> = ({
  isLoading,
  list,
}) => {
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

export const ActionShow: React.FC<IResourceComponentsProps> = () => {
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
    method: "get",
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
      method: "post",
      values: formData,
      // successNotification,
      // errorNotification,
    });
    await refetch();
    // @todo redirect somewhere
    // @todo show notification
  };

  const schema: RJSFSchema = {
    type: 'boolean',
    default: true,
  };

  const uiSchema: UiSchema = {
    'ui:widget': 'checkbox',
  };

  const CustomCheckbox = function (props: WidgetProps) {
    return (
      <button
        style={{backgroundColor: 'green', fontSize: '50px'}}
        id='custom' className={props.value ? 'checked' : 'unchecked'}
        onClick={() => props.onChange(!props.value)}
      >
        {String(props.value)}
      </button>
    );
  };

  const widgets: RegistryWidgetsType = {
    CheckboxWidget: CustomCheckbox,
  };

  const [loadedScript, setLoadedScript] = useState(false);
  useEffect(() => {
    const script = document.createElement('script');
    // @todo find good way to load and execute custom webcomponents scripts.
    // https://lit.dev/docs/frameworks/react/
    script.src = "https://www.unpkg.com/@zachleat/table-saw@1.0.2/table-saw.js";
    script.async = true;
    script.type = 'module';

    script.onload = () => {
      setLoadedScript(true);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <Edit isLoading={isFetching}>
      <ActionRunningState isLoading={isFetchingRunning} list={running} />
      {jsonschema && (
        <div>
          <Heading>Chakra UI Form</Heading>
          <FormChakraUI
            schema={jsonschema}
            validator={validator}
            onSubmit={onSubmit}
          />
          <Heading>Form without styles. Naked RJSF</Heading>
          <Form
            schema={jsonschema}
            validator={validator}
          />
          <Heading>Form with custom UI Widget and UI Schema</Heading>
          <Form
            schema={schema}
            validator={validator}
            uiSchema={uiSchema}
            widgets={widgets}
          />
          <Heading>Custom Webcomponent loaded</Heading>
          <p>this is external table-saw webcomponent with responsive tables</p>
          {loadedScript &&
            <table-saw>
            <table>
              <thead>
                <tr>
                  <th scope="col">Movie Title</th>
                  <th scope="col">Rank</th>
                  <th scope="col">Year</th>
                  <th scope="col"><abbr title="Rotten Tomato Rating">Rating</abbr></th>
                  <th scope="col">Gross</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td data-tablesaw-label="Movie Title"><a href="http://en.wikipedia.org/wiki/Avatar_(2009_film)">Avatar</a></td>
                  <td data-tablesaw-label="Rank">1</td>
                  <td data-tablesaw-label="Year">2009</td>
                  <td data-tablesaw-label="Rating">83%</td>
                  <td data-tablesaw-label="Gross">$2.7B</td>
                </tr>
              </tbody>
            </table>
          </table-saw>
          }
        </div>
      )}
    </Edit>
  );
};
