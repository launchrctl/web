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



### RECEIVE `/actions/actionId/running/runId` Operation

* Operation ID: `getRunningActions`

Receive **one of** the following messages:

#### Message Request runinning actions list `getRunningActions`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | string | - | - | - | - |

> Examples of payload _(generated)_

```json
"string"
```


#### Message Stream data `sendRunningActions`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | array<allOf> | - | - | - | - |
| (single item) | allOf | - | - | - | **additional properties are allowed** |
| 0 (allOf item) | object | - | - | - | **additional properties are allowed** |
| id | string | - | - | - | **required** |
| id.x-go-name | - | - | `"ID"` | - | - |
| status | string | - | - | - | **required** |

> Examples of payload _(generated)_

```json
[
  {
    "id": "string",
    "status": "string"
  }
]
```



### SEND `/actions/actionId/running/runId` Operation

* Operation ID: `sendRunningAction`

Sending **one of** the following messages:

#### Message Request runinning actions list `getRunningActions`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | string | - | - | - | - |

> Examples of payload _(generated)_

```json
"string"
```


#### Message Stream data `sendRunningActions`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | array<allOf> | - | - | - | - |
| (single item) | allOf | - | - | - | **additional properties are allowed** |
| 0 (allOf item) | object | - | - | - | **additional properties are allowed** |
| id | string | - | - | - | **required** |
| id.x-go-name | - | - | `"ID"` | - | - |
| status | string | - | - | - | **required** |

> Examples of payload _(generated)_

```json
[
  {
    "id": "string",
    "status": "string"
  }
]
```



### RECEIVE `/actions-stream` Operation

* Operation ID: `getActionsRunStream`

Receive **one of** the following messages:

#### Message Request runinning actions stream `getActionsRunStream`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | string | - | - | - | - |

> Examples of payload _(generated)_

```json
"string"
```


#### Message Stream data `sendActionsRunStream`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | array<allOf> | - | - | - | - |
| (single item) | allOf | - | - | - | **additional properties are allowed** |
| 0 (allOf item) | object | - | - | - | **additional properties are allowed** |
| type | string | - | allowed (`"stdOut"`, `"stdIn"`, `"stdErr"`) | - | **required** |
| content | string | - | - | - | **required** |
| offset | integer | - | - | - | **required** |
| count | integer | - | - | - | **required** |

> Examples of payload _(generated)_

```json
[
  {
    "type": "stdOut",
    "content": "string",
    "offset": 0,
    "count": 0
  }
]
```



### SEND `/actions-stream` Operation

* Operation ID: `sendActionsRunStream`

Sending **one of** the following messages:

#### Message Request runinning actions stream `getActionsRunStream`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | string | - | - | - | - |

> Examples of payload _(generated)_

```json
"string"
```


#### Message Stream data `sendActionsRunStream`

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | array<allOf> | - | - | - | - |
| (single item) | allOf | - | - | - | **additional properties are allowed** |
| 0 (allOf item) | object | - | - | - | **additional properties are allowed** |
| type | string | - | allowed (`"stdOut"`, `"stdIn"`, `"stdErr"`) | - | **required** |
| content | string | - | - | - | **required** |
| offset | integer | - | - | - | **required** |
| count | integer | - | - | - | **required** |

> Examples of payload _(generated)_

```json
[
  {
    "type": "stdOut",
    "content": "string",
    "offset": 0,
    "count": 0
  }
]
```



