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