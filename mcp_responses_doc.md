# Kapruka MCP Server Response Documentation

The Kapruka MCP (Model Context Protocol) server returns responses in two distinct formats depending on how they are queried: standard JSON responses or markdown-formatted text streams (SSE event-streams). 

Below are the exact shapes and examples of the raw data returned by the primary Kapruka MCP tools.

---

## 1. `kapruka_search_products`

### Raw JSON Format (Structured)
```json
{
  "products": [
    {
      "id": "CAKE00KA001685",
      "name": "Springtime Birthday Ribbon Cake",
      "price": 5770,
      "category": "cakes",
      "image_url": "https://www.kapruka.com/shops/cakes/productImages/zoom/1721645817680_untitled1.jpg",
      "url": "https://www.kapruka.com/buyonline/springtime-birthday-ribbon-cake/kid/cake00ka001685",
      "in_stock": true
    }
  ],
  "total": 1,
  "cursor": "next_page_cursor_token"
}
```

### Markdown/SSE Text Stream Format
```markdown
## Springtime Birthday Ribbon Cake
**ID**: `cake00KA001685`
**Price**: LKR 5,770
**Stock**: In stock (low)
**Category**: cakes
**Vendor**: Kapruka Cakes Cake
**Weight**: 2.77 lbs
**International shipping**: Yes

The Springtime Birthday Ribbon Cake is a pastel ribbon cake...

**Image**: https://www.kapruka.com/shops/cakes/productImages/zoom/1721645817680_untitled1.jpg

[View on Kapruka](https://www.kapruka.com/buyonline/springtime-birthday-ribbon-cake/kid/cake00ka001685)
```

---

## 2. `kapruka_get_product`

### Raw JSON Format
```json
{
  "id": "CAKE00KA001685",
  "name": "Springtime Birthday Ribbon Cake",
  "price": 5770,
  "category": "cakes",
  "image": "https://www.kapruka.com/shops/cakes/productImages/zoom/1721645817680_untitled1.jpg",
  "url": "https://www.kapruka.com/buyonline/springtime-birthday-ribbon-cake/kid/cake00ka001685",
  "in_stock": true,
  "description": "The Springtime Birthday Ribbon Cake is a pastel ribbon cake made for birthday celebrations and special occasions...",
  "variants": [
    { "name": "Size", "value": "1.25 KG" },
    { "name": "Greeting", "value": "Happy Birthday!" }
  ]
}
```

### Markdown/SSE Text Stream Format
*(Matches the single product markdown block shown above, appending descriptions and shipping notes)*

---

## 3. `kapruka_list_categories`

### Raw JSON Format
```json
[
  {
    "name": "Cakes & Bakery",
    "url": "https://www.kapruka.com/cakes"
  },
  {
    "name": "Flowers & Hampers",
    "url": "https://www.kapruka.com/flowers"
  }
]
```

### Markdown Format
```markdown
- [Cakes & Bakery](https://www.kapruka.com/cakes)
- [Flowers & Hampers](https://www.kapruka.com/flowers)
```

---

## 4. `kapruka_list_delivery_cities`

### Raw JSON Format
```json
[
  { "name": "Colombo 01" },
  { "name": "Colombo 02" },
  { "name": "Kandy" }
]
```

### Markdown Format
```markdown
- Colombo 01
- Colombo 02
- Kandy
```

---

## 5. `kapruka_check_delivery`

### Raw JSON Format
```json
{
  "available": true,
  "fee": 350.00,
  "perishable_warning": false,
  "message": "Delivery is available for Colombo 01 on 2026-07-02"
}
```

---

## 6. `kapruka_create_order`

### Raw JSON Format
```json
{
  "order_id": "KAP-2026-98725",
  "pay_url": "https://www.kapruka.com/payment/checkout?id=KAP-2026-98725",
  "expires_at": "2026-07-02T12:00:00Z"
}
```

---

## 7. `kapruka_track_order`

### Raw JSON Format
```json
{
  "order_number": "KAP-2026-98725",
  "status": "processing",
  "recipient": "Sunil Perera",
  "items": ["CAKE00KA001685"],
  "steps": [
    {
      "status": "Order Placed",
      "timestamp": "2026-07-01T21:00:00Z",
      "description": "Order successfully received."
    },
    {
      "status": "Processing",
      "timestamp": "2026-07-01T22:00:00Z",
      "description": "Preparing cake at Kapruka bakery."
    }
  ]
}
```
