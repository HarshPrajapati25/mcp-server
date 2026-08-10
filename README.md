# Shoppingate MCP Server (TypeScript)

Model Context Protocol (MCP) Server for the **Shoppingate AI Platform** — powering both **Merchant** & **Customer Super-App capabilities** across Claude Desktop, ChatGPT, Claude.ai, and the Shoppingate AI Gateway.

---

## 🛠️ Complete Feature & Tool Coverage

### 1. Merchant Tools (`src/tools/merchantTools.ts`)
- **`search_products`**: Search catalog with keyword, category, price range, and stock status filters.
- **`get_product_details`**: Fetch product specs, images, pricing, and stock levels by ID.
- **`update_product_stock`**: Update inventory quantity and stock availability.
- **`list_merchant_orders`**: Filter customer orders by status (`pending`, `processing`, `shipped`, `delivered`, `cancelled`).
- **`get_order_details`**: Retrieve full order line items, customer details, and shipping address.
- **`update_order_status`**: Change order fulfillment status with tracking notes.
- **`list_promotions`**: View active store deals and promotional offers.
- **`create_coupon`**: Create percentage or fixed SAR discount coupon codes.

### 2. Customer Super-App Tools (`src/tools/customerTools.ts`)
- **`customer_search_products`**: Natural language product search for end-customers by budget, category, or brand.
- **`get_recommendations`**: Fetch personalized recommendation rails (*Recommended for You*, *Trending*, *New Arrivals*).
- **`get_similar_products`**: Semantic similarity search for Product Detail Pages (PDP).
- **`track_customer_order`**: Live order tracking and delivery status.
- **`check_visa_guidance`**: Query visa requirements and packages for travel destinations.
- **`search_travel_insurance`**: Query travel insurance plans by destination & trip duration.

### 3. MCP Resources & Prompts
- **Resources**: `shoppingate://catalog/summary` & `shoppingate://orders/summary`.
- **Prompts**: `merchant_daily_briefing` & `product_copywriter` (Bilingual English/Arabic PDP copywriting).

---

## ⚙️ Transport Modes

- **Stdio Mode** (`npm run start:stdio`): Native integration with Claude Desktop.
- **HTTP / SSE Mode** (`npm run start:sse`): Express server listening on `http://localhost:3005` for ChatGPT, Claude.ai, & AI Gateway.

---

## 🚀 Quick Start

```bash
cd Backend/MCP-SERVER

# Install dependencies
npm install

# Compile TypeScript
npm run build

# Start in SSE / Browser Playground Mode (Port 3005)
npm run start:sse

# Start in Stdio Mode (For Claude Desktop CLI)
npm run start:stdio
```

---

## 🌐 Browser Playground

Open `http://localhost:3005` in Chrome to test both Merchant and Customer tools visually.

- **Playground UI**: `http://localhost:3005`
- **Health Check**: `http://localhost:3005/health-check`
- **OpenAPI Schema**: `http://localhost:3005/openapi.json`
- **SSE Stream**: `http://localhost:3005/sse`

---

## 💡 Claude Desktop Setup

Config file location: `%APPDATA%\Claude\claude_desktop_config.json` (or Microsoft Store AppData path):

```json
{
  "mcpServers": {
    "shoppingate-merchant": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "C:\\Repository\\Shoppingate\\Backend\\MCP-SERVER\\dist\\index.js"
      ],
      "env": {
        "TRANSPORT_MODE": "stdio",
        "ECOM_SERVICE_URL": "https://microservices.shoppinggate.app/ecom",
        "SERVICE_API_KEY": "O5Xpb9Lho$NooI@7@Q>ztCpGVCQ"
      }
    }
  }
}
```
