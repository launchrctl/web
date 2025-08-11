# Launchr Web Plugin - Token Management & Authentication

## Overview

The Launchr Web Plugin provides a secure web interface for managing Launchr actions through UI or API. It includes comprehensive token-based authentication and management capabilities.

## Token Management

### Available Operations

The plugin provides five main token operations through the `web-token` command:

- **create** - Generate new authentication tokens
- **list** - View all existing tokens
- **revoke** - Deactivate tokens without deletion
- **delete** - Permanently remove tokens
- **purge** - Clean up expired and revoked tokens

### Creating Tokens

Generate new authentication tokens for API access:

#### Basic Usage

```bash
# Create a token with default 30-day expiration
launchr web-token create my-api-token
```

#### Advanced Options

```bash
# Create a token with custom expiration
launchr web-token create my-token --expires-in="7d"

# Create a token that never expires
launchr web-token create my-token --expires-in=0

# Create a token with custom size (affects entropy)
launchr web-token create my-token 64
```

#### Arguments and Parameters

| Parameter | Type | Required | Description                                                                          |
| --- | --- | --- |--------------------------------------------------------------------------------------|
| `name` | string | Yes | Unique identifier for the token                                                      |
| `size` | int | No | Token size in bytes (default 32)                                                     |
| `--expires-in` | duration | No | Expiration time (e.g., `24h`, `7d`, `30d`, `1w`, `1m`, `1y`) or `0` for no expiration |

#### Output
Upon successful creation, the command displays:
- Token name
- The actual token string (save this securely!)
- Expiration date (if applicable)

### Listing Tokens
View all tokens and their current status:

``` bash
launchr web-token list
```

#### Output Information
For each token, the following details are displayed:
- **Name**: Token identifier 
- **Status**: Active or Revoked 
- **Created**: Creation timestamp
- **Expires**: Expiration date (or "Never" if no expiration)

#### Example Output
``` 
Found 3 token(s):
  • production-api (Active)
    Created: 2024-01-15 10:30:45
    Expires: 2024-02-14 10:30:45

  • development-token (Active)
    Created: 2024-01-20 14:15:22
    Expires: Never

  • old-token (Revoked)
    Created: 2024-01-10 09:20:15
    Expires: 2024-02-09 09:20:15
```

### Revoking Tokens

Temporarily deactivate tokens without permanent deletion:

``` bash
launchr web-token revoke my-token
```

#### Behavior
- Token becomes immediately invalid for authentication
- Token metadata remains in storage
- Revoked tokens can be permanently removed with `purge`

### Deleting Tokens

Permanently remove tokens from storage:
``` bash
launchr web-token delete my-api-token
```
#### Behavior
- Token is immediately invalid for authentication
- All token metadata is permanently removed
- Cannot be recovered after deletion
- Use with caution in production environments

### Purging Inactive Tokens

Clean up expired and revoked tokens:
``` bash
launchr web-token purge
```

#### Behavior
The purge operation performs two cleanup actions:
1. **Expire Active Tokens**: Marks expired but still active tokens as inactive
2. **Remove Inactive Tokens**: Permanently deletes all revoked and expired tokens

#### Output
``` 
Expired tokens: 2
Revoked tokens purged: 3
```

## Authentication System
### Authentication Method
The Launchr web server uses **HTTP Basic Authentication** with the following specifications:

| Property | Value |
| --- | --- |
| **Type** | HTTP Basic Authentication |
| **Realm** | "Launchr Web UI" |
| **Username** | Any value (ignored during validation) |
| **Password** | Valid, active authentication token |
### Authentication Flow
1. **Request Made**: Client sends request to protected endpoint
2. **Header Check**: Server examines `Authorization: Basic` header
3. **Credential Extraction**: Server extracts username and password from Base64-encoded credentials
4. **Token Validation**: Server validates the password portion as a token (username is ignored)
5. **Access Decision**: Server grants or denies access based on token validity

### Token Validation Criteria
A token is considered valid if it meets all the following conditions:
- ✅ **Exists**: Token is found in the token store
- ✅ **Active**: Token status is not revoked 
- ✅ **Not Expired**: Current time is before expiration date (if set)

### Authentication Header Format
``` http
Authorization: Basic <base64-encoded-credentials>
```
Where `<base64-encoded-credentials>` is the Base64 encoding of `username:token`.
#### Example
``` http
Authorization: Basic YW55dXNlcjp5b3VyLXRva2VuLWhlcmU=
```
This represents `anyuser:your-token-here` encoded in Base64.
