# OryginEval API Documentation

**Base URL**: `https://4psd65hvi6.execute-api.ap-south-1.amazonaws.com/eval`

---

## Table of Contents
1. [Authentication](#authentication)
2. [Common Response Format](#common-response-format)
3. [Health & Welcome](#health--welcome)
4. [Account](#account)
5. [Datasets](#datasets)
6. [Projects](#projects)
7. [Parameters](#parameters)
8. [Experiments](#experiments)
9. [Error Handling](#error-handling)
10. [Tables Schema](#tables-schema)

---

## Authentication

- **Header**: `Authorization: Bearer <API_TOKEN>`
- **Or** via API Gateway authorizer (`requestContext.authorizer.principalId`)
- **Excluded**: `GET /` & `GET /health`

---

## Common Response Format

```json
{
  "statusCode": 200,
  "headers": { /* CORS & JSON headers */ },
  "body": { /* JSON payload or error */ }
}
```

- **Success**: 200–299
- **Error**:
  ```json
  { "status": "error", "message": "..." }
  ```

---

## Health & Welcome

### GET `/`
**Response**: `{ "message": "Welcome to OryginEval API" }`

### GET `/health`
**Response**: `{ "status": "healthy", "service": "OryginEval API" }`

---

## Account

### POST `/accounts-add`
Add a new user account.

- **Body**:
  ```json
  { "account_id": "string" }
  ```
- **Success**: `{ "status": "success", "message": "User <id> added successfully." }`
- **Errors**: `400` missing/duplicate

---

## Datasets

### GET `/datasets-list`
List datasets under a project.

- **Query**: `project_id=string`
- **Success**: `{ "status": "success", "datasets": [ datasetsTable ] }`
- **Errors**: `400`, `404`

---

### POST `/datasets-create`
Add a raw dataset to a project.

- **Query**: `dataset_id=string`
- **Body**:
  ```json
  { "dataset": [ ... ], "project_id": "string" }
  ```
- **Success**: `{ "status": "success", "message": "Dataset <id> added successfully." }`
- **Errors**: `400` missing/invalid

---

### POST `/datasets-generate`
Request automated dataset generation (async via SQS).

- **Query**: `dataset_id=string&project_id=string`
- **Body**:
  ```json
  {
    "sample_data": [ ... ],
    "num_samples": 42,
    "extra_info": "string"
  }
  ```
- **Enqueues** to SQS: `datasetQueue`
- **Success**: `{ "status": "success", "message": "Request sent.", "dataset_id": "...", "project_id": "..." }`

---

### GET `/datasets-details`
Get one dataset’s JSON.

- **Query**: `dataset_id=string`
- **Success**: `{ "status": "success", "dataset": { ... } }`
- **Errors**: `400`, `404`

---

### POST `/datasets-delete`
Delete a dataset and remove its reference.

- **Query**: `dataset_id=string`
- **Success**: `{ "status": "success", "message": "Dataset <id> deleted." }`

---

### POST `/datasets-update`
Overwrite a dataset’s JSON.

- **Query**: `dataset_id=string`
- **Body**: `{ "dataset": [ ... ] }`
- **Success**: `{ "status": "success", "message": "Dataset <id> updated." }`

---

## Projects

### GET `/projects-list`
List projects for an account.

- **Query**: `account_id=string`
- **Success**: `{ "status": "success", "projects": [ ... ] }`

---

### POST `/projects-create`
Create a new project.

- **Query**: `project_id=string&account_id=string`
- **Body**:
  ```json
  { "project_name": "Alpha", "labrat": { ... } }
  ```
- **Success**: `{ "status": "success", "message": "Project Alpha added." }`

---

### GET `/projects-details`
Get project metadata.

- **Query**: `project_id=string`

---

### POST `/projects-delete`
Remove a project.

- **Query**: `project_id=string`

---

### POST `/projects-update`
Update project info.

- **Query**: `project_id=string`
- **Body**:
  ```json
  {
    "project_name": "...",
    "labrat": { ... },
    "dataset_ids": [ ... ],
    "parameter_ids": [ ... ],
    "experiment_ids": [ ... ]
  }
  ```

---

## Parameters

### GET `/parameters-list`
List parameters by project.

- **Query**: `project_id=string`

---

### POST `/parameters-create`
Add a parameter to a project.

- **Query**: `project_id=string&parameter_id=string`
- **Body**:
  ```json
  { "parameter_name": "speed", "parameter_description": "km/h" }
  ```

---

### GET `/parameters-details`
Fetch a single parameter.

- **Query**: `parameter_id=string`

---

### POST `/parameters-delete`
Delete a parameter.

- **Query**: `parameter_id=string`

---

### POST `/parameters-update`
Update a parameter’s metadata.

- **Query**: `parameter_id=string`
- **Body**: same as create

---

## Experiments

### GET `/experiments-list`
List experiments under a project.

- **Query**: `project_id=string`

---

### POST `/experiments-create`
Create an experiment (async via SQS).

- **Query**: `project_id=string&experiment_id=string`
- **Body**:
  ```json
  {
    "experiment_name": "Exp1",
    "dataset_id": "d1",
    "parameter_ids": [ ... ],
    "labrat_json": { ... }
  }
  ```
- **Enqueues** to SQS: `experimentsQueue`
- **Success**: `{ "status": "success", "message": "Experiment Exp1 added.", "experiment_id": "..." }`

---

### GET `/experiments-details`
Get experiment record.

- **Query**: `experiment_id=string`

---

### POST `/experiments-calculate-cost`
Calculate cost based on token usage.

- **Body**:
  ```json
  { "dataset_id": "d1", "parameter_ids": [ ... ] }
  ```
- **Response**: `{ "status": "success", "cost": <float> }`

---

## Error Handling

- **401**: Unauthorized
- **400**: Bad Request
- **404**: Not Found
- **500**: Internal Error


## Tables Schema

### Accounts Table
| Field | Type | Description |
|-------|------|-------------|
| `account_id` | `uuid` | Unique identifier for the account |
| `created_at` | `timestamptz` | Account creation timestamp |
| `project_ids` | `list[uuid]` | List of associated project IDs |

### Parameters Table
| Field | Type | Description |
|-------|------|-------------|
| `parameter_id` | `uuid` | Unique identifier for the parameter |
| `name` | `string` | Parameter name |
| `created_at` | `timestamptz` | Parameter creation timestamp |
| `description` | `string` | Parameter description |

### Projects Table
| Field | Type | Description |
|-------|------|-------------|
| `project_id` | `uuid` | Unique identifier for the project |
| `project_name` | `string` | Project display name |
| `created_at` | `timestamptz` | Project creation timestamp |
| `dataset_ids` | `list[uuid]` | List of associated dataset IDs |
| `parameter_ids` | `list[uuid]` | List of associated parameter IDs |
| `experiment_ids` | `list[uuid]` | List of associated experiment IDs |
| `labrat_json` | `json` | Configuration object with `endpoint` (string) and `headers` (object) |
**Sample `labrat`:**
```json
{
  endpoint: string,
  headers: {
    "Authorization": "Bearer token",
    "Content-Type": "application/json"
  }
}
```

### Datasets Table
| Field | Type | Description |
|-------|------|-------------|
| `dataset_id` | `uuid` | Unique identifier for the dataset |
| `created_at` | `timestamptz` | Dataset creation timestamp |
| `dataset_json` | `list[json]` | Array of conversation objects |

**Sample `dataset_json`:**
```json
[
  {
    "id": "001",
    "conversation": [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi"}
    ]
  }
]
```

### Experiments Table
| Field | Type | Description |
|-------|------|-------------|
| `experiment_id` | `uuid` | Unique identifier for the experiment |
| `name` | `string` | Experiment name |
| `created_at` | `timestamptz` | Experiment creation timestamp |
| `dataset_id` | `uuid` | Associated dataset ID |
| `parameter_ids` | `list[uuid]` | List of parameter IDs used in evaluation |
| `cost` | `float` | Experiment execution cost |
| `result` | `list[json]` | Array of evaluation results |

**Sample `result`:**
```json
[
  {
    "convoid": "10001",
    "conversation": "ASSISTANT: <message>\nUSER: <message>",
    "response_time": 1.08,
    "evaluations": [
      {
        "name": "<parameter_name>",
        "score": 0.93,
        "comment": "<comment>"
      }
    ]
  }
]
```