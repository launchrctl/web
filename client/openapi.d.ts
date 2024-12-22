/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
    "/customisation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Customisation config */
        get: operations["getCustomisationConfig"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/actions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lists all actions
         * @description Returns all launchr actions
         *
         */
        get: operations["getActions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/actions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Returns action by id
         * @description returns action by id
         */
        get: operations["getActionByID"];
        put?: never;
        /**
         * runs action
         * @description executes action
         */
        post: operations["runAction"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/actions/{id}/schema.json": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Returns action json schema
         * @description returns action json schema
         */
        get: operations["getActionJSONSchema"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/actions/{id}/running": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Returns running actions
         * @description returns running actions
         */
        get: operations["getRunningActionsByID"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/actions/{id}/running/{runId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Returns action run info
         * @description returns action run info
         */
        get: operations["getOneRunningActionByID"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/actions/{id}/running/{runId}/streams": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Returns running action streams
         * @description returns running action streams
         */
        get: operations["getRunningActionStreams"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Customisation: Record<string, never>;
        ActionShort: {
            id: string;
            title: string;
            description: string;
        };
        ActionFull: components["schemas"]["ActionShort"] & {
            jsonschema: Record<string, never>;
            uischema?: Record<string, never>;
        };
        ActionRunParams: {
            arguments: Record<string, never>;
            options: Record<string, never>;
            changed?: string[];
        };
        ActionRunInfo: {
            id: string;
            status: components["schemas"]["ActionRunStatus"];
        };
        /** @enum {string} */
        ActionRunStatus: "created" | "running" | "finished" | "error";
        ActionRunStreamData: {
            /** @enum {string} */
            type: "stdOut" | "stdIn" | "stdErr";
            content: string;
            offset: number;
            count: number;
        };
        JSONSchema: Record<string, never>;
        Error: {
            /** Format: int */
            code: number;
            message: string;
        };
    };
    responses: {
        /** @description unexpected error */
        DefaultError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
    };
    parameters: {
        /** @description ID of action to fetch */
        ActionId: string;
        /** @description ID of the running action */
        ActionRunInfoId: string;
        /** @description number of elements to skip */
        Offset: number;
        /** @description number of elements to return */
        Limit: number;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getCustomisationConfig: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description config response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Customisation"][];
                };
            };
            default: components["responses"]["DefaultError"];
        };
    };
    getActions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description actions response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActionShort"][];
                };
            };
            default: components["responses"]["DefaultError"];
        };
    };
    getActionByID: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of action to fetch */
                id: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description action response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActionFull"];
                };
            };
            default: components["responses"]["DefaultError"];
        };
    };
    runAction: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of action to fetch */
                id: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        /** @description Action arguments and options */
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActionRunParams"];
            };
        };
        responses: {
            /** @description action response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActionRunInfo"];
                };
            };
            default: components["responses"]["DefaultError"];
        };
    };
    getActionJSONSchema: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of action to fetch */
                id: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description action json schema */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JSONSchema"];
                };
            };
            default: components["responses"]["DefaultError"];
        };
    };
    getRunningActionsByID: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of action to fetch */
                id: components["parameters"]["ActionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description action run info */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActionRunInfo"][];
                };
            };
            default: components["responses"]["DefaultError"];
        };
    };
    getOneRunningActionByID: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description ID of action to fetch */
                id: components["parameters"]["ActionId"];
                /** @description ID of the running action */
                runId: components["parameters"]["ActionRunInfoId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description action run info */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActionRunInfo"];
                };
            };
            default: components["responses"]["DefaultError"];
        };
    };
    getRunningActionStreams: {
        parameters: {
            query?: {
                /** @description number of elements to skip */
                offset?: components["parameters"]["Offset"];
                /** @description number of elements to return */
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path: {
                /** @description ID of action to fetch */
                id: components["parameters"]["ActionId"];
                /** @description ID of the running action */
                runId: components["parameters"]["ActionRunInfoId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description action run info streams */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActionRunStreamData"][];
                };
            };
            default: components["responses"]["DefaultError"];
        };
    };
}
