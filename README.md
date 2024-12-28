# VJAPI

This API allows you to interact with VJudge to retrieve contest details, group contest details, and user performance metrics.

## Installation

To install dependencies:
```sh
bun install
```

## Running the Server

To run the server:
```sh
bun run dev
```

Open http://localhost:3000

## Endpoints

### 1. Get Group Contest Details

**Endpoint:** `/grp_details`

**Method:** `POST`

**Description:** Retrieves contest details for a list of group URLs.

**Request Body:**
```json
{
  "grp_list": ["<group_url_1>", "<group_url_2>"],
  "jid": "<JSESSIONID>"
}
```

**Example `curl` Command:**
```sh
curl -X POST http://localhost:3000/grp_details -H "Content-Type: application/json" -d '{"grp_list": ["<group_url_1>", "<group_url_2>"], "jid": "<JSESSIONID>"}'
```

### 2. Get Group Contest Details with Contest Data

**Endpoint:** `/grp_c_details`

**Method:** `POST`

**Description:** Retrieves detailed contest data for a list of group URLs.

**Request Body:**
```json
{
  "grp_list": ["<group_url_1>", "<group_url_2>"],
  "jid": "<JSESSIONID>"
}
```

**Example `curl` Command:**
```sh
curl -X POST http://localhost:3000/grp_c_details -H "Content-Type: application/json" -d '{"grp_list": ["<group_url_1>", "<group_url_2>"], "jid": "<JSESSIONID>"}'
```

### 3. Get Contest Details

**Endpoint:** `/get_c_details`

**Method:** `POST`

**Description:** Retrieves detailed information for a specific contest.

**Request Body:**
```json
{
  "link": "<contest_link>",
  "jid": "<JSESSIONID>"
}
```

**Example `curl` Command:**
```sh
curl -X POST http://localhost:3000/get_c_details -H "Content-Type: application/json" -d '{"link": "<contest_link>", "jid": "<JSESSIONID>"}'
```

### 4. Get Group Performance

**Endpoint:** `/get_g_performance`

**Method:** `POST`

**Description:** Retrieves performance metrics for users in a list of group URLs.

**Request Body:**
```json
{
  "grp_list": ["<group_url_1>", "<group_url_2>"],
  "jid": "<JSESSIONID>"
}
```

**Example `curl` Command:**
```sh
curl -X POST http://localhost:3000/get_g_performance -H "Content-Type: application/json" -d '{"grp_list": ["<group_url_1>", "<group_url_2>"], "jid": "<JSESSIONID>"}'
```

### 5. Get Contest Performance

**Endpoint:** `/get_c_performance`

**Method:** `POST`

**Description:** Retrieves performance metrics for users in a specific contest.

**Request Body:**
```json
{
  "link": "<contest_link>",
  "jid": "<JSESSIONID>"
}
```

**Example `curl` Command:**
```sh
curl -X POST http://localhost:3000/get_c_performance -H "Content-Type: application/json" -d '{"link": "<contest_link>", "jid": "<JSESSIONID>"}'
```
