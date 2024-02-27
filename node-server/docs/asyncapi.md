# Launchr 1.0.0 documentation

* License: [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0.html)

An API of Launchr actions

## Table of Contents

* [Servers](#servers)
  * [websocket](#websocket-server)

## Servers

### `websocket` Server

* URL: `ws://localhost:3000/`
* Protocol: `ws`



## Operations

### SEND `/actions-list` Operation

* Operation ID: `actionsList`

Sending **one of** the following messages:

#### Message Send actions list `actionsList`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | array<allOf> | - | - | - | - |
| (single item) | allOf | - | - | - | **additional properties are allowed** |
| 0 (allOf item) | object | - | - | - | **additional properties are allowed** |
| id | string | - | - | - | **required** |
| id.x-go-name | - | - | `"ID"` | - | - |
| title | string | - | - | - | **required** |
| description | string | - | - | - | **required** |

> Examples of payload _(generated)_

```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string"
  }
]
```


#### Message Request actions list `getActionsList`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | string | - | - | - | - |

> Examples of payload _(generated)_

```json
"string"
```



### RECEIVE `/actions-list` Operation

* Operation ID: `getActionsList`

Receive **one of** the following messages:

#### Message Send actions list `actionsList`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | array<allOf> | - | - | - | - |
| (single item) | allOf | - | - | - | **additional properties are allowed** |
| 0 (allOf item) | object | - | - | - | **additional properties are allowed** |
| id | string | - | - | - | **required** |
| id.x-go-name | - | - | `"ID"` | - | - |
| title | string | - | - | - | **required** |
| description | string | - | - | - | **required** |

> Examples of payload _(generated)_

```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string"
  }
]
```


#### Message Request actions list `getActionsList`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | string | - | - | - | - |

> Examples of payload _(generated)_

```json
"string"
```



### SEND `/action-running` Operation

* Operation ID: `getRunningAction`

#### Parameters

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| id | string | Id of the action | default (`"default-action-id"`) | - | **required** |
| runId | string | Id of the process | default (`"default-process-id"`) | - | **required** |


#### Message Send actions list `actionsList`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | array<allOf> | - | - | - | - |
| (single item) | allOf | - | - | - | **additional properties are allowed** |
| 0 (allOf item) | object | - | - | - | **additional properties are allowed** |
| id | string | - | - | - | **required** |
| id.x-go-name | - | - | `"ID"` | - | - |
| title | string | - | - | - | **required** |
| description | string | - | - | - | **required** |

> Examples of payload _(generated)_

```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string"
  }
]
```



