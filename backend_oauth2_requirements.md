# 🔐 USERS Microservice Team — Production OAuth2 Integration Requirements

This document outlines the **2 standard OAuth2 endpoints** required on the **USERS Microservice** (`https://microservices.shoppinggate.app/users`) to support **100% automated native authentication** for ChatGPT Actions, Claude.ai, and Enterprise AI Connectors.

---

## 🏛️ Production Architecture Overview

When a merchant or customer opens ChatGPT or Claude and asks to execute protected actions (e.g. view store orders, update stock, or manage promotions), the AI platform opens a native login browser window pointing to your official domain.

Upon successful login, your backend issues an `authorization_code` that ChatGPT/Claude exchanges for a live `Bearer JWT Token` automatically.

```
┌─────────────────┐       1. User prompts: "Show store orders"   ┌────────────────────────┐
│                 │ ──────────────────────────────────────────>│                        │
│   CHATGPT /     │                                            │ Shoppingate MCP Server │
│   CLAUDE.AI     │       2. MCP Gateway returns 401           │                        │
│                 │ <──────────────────────────────────────────│                        │
└─────────────────┘                                            └────────────────────────┘
        │
        │ 3. ChatGPT / Claude opens native browser popup:
        │    https://microservices.shoppinggate.app/users/oauth/authorize?client_id=mcp&redirect_uri=https://chatgpt.com/aip/plugin-callback
        ▼
 🔑 Merchant logs in with email & password on official website
        │
        │ 4. Your website redirects back to ChatGPT/Claude with: ?code=AUTH_CODE_12389
        │ 5. ChatGPT calls POST /users/oauth/token to get live Bearer Token
        ▼
   ✅ ChatGPT / Claude automatically attaches Authorization: Bearer <TOKEN> to all future tool calls!
```

---

## 🛠️ Required Microservice Endpoints to Implement

### 1. Endpoint 1: Authorization Page & Code Issuer (`GET /users/oauth/authorize`)

* **HTTP Method**: `GET`
* **Route**: `/users/oauth/authorize`
* **Query Parameters**:
  - `client_id` (string): Identifies the AI Client (e.g., `chatgpt-action` or `claude-desktop`).
  - `redirect_uri` (string): The callback URL provided by ChatGPT or Claude (e.g., `https://chatgpt.com/aip/g-12345/oauth/callback`).
  - `response_type` (string): Always `"code"`.
  - `scope` (string, optional): Access scope (e.g., `merchant_admin` or `read_write`).
  - `state` (string): Opaque CSRF verification token provided by the AI platform.

* **Behavior**:
  1. Displays the official Shoppingate Merchant Login Page (`https://microservices.shoppinggate.app/sg-merchant/auth/login`).
  2. Merchant enters their email and password (`test@yopmail.com` / `Password@123`).
  3. Upon successful validation, the backend generates an `authorization_code` valid for 5 minutes.
  4. The backend redirects the user's browser back to `redirect_uri`:
     ```http
     HTTP/1.1 302 Found
     Location: {redirect_uri}?code={authorization_code}&state={state}
     ```

---

### 2. Endpoint 2: Token Exchange Handler (`POST /users/oauth/token`)

* **HTTP Method**: `POST`
* **Route**: `/users/oauth/token`
* **Content-Type**: `application/x-www-form-urlencoded` or `application/json`
* **Request Body**:
  - `grant_type` (string): Always `"authorization_code"`.
  - `code` (string): The `authorization_code` received from Endpoint 1.
  - `redirect_uri` (string): Must match the original `redirect_uri`.
  - `client_id` (string): Client ID.
  - `client_secret` (string): Client Secret.

* **Response Format (`HTTP 200 OK`)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "scope": "merchant_admin"
  }
  ```

---

## ✅ Integration Benefit
Once these 2 endpoints are active on the **USERS Microservice**:
- Real merchants log in **100% natively and securely** on your official website.
- **Zero passwords** typed in chat text.
- **Zero manual config editing** required for end users.
- ChatGPT, Claude.ai, and Enterprise AI Connectors automatically maintain authenticated merchant sessions across all 11 merchant tools!
