# LLM Usage Billing Guide

## Overview

All LLM API usage is automatically tracked in the database for accurate billing. Every API call logs:
- User ID (who made the request)
- Model used (OpenAI, Anthropic, Google)
- Input/Output tokens
- Calculated cost (based on model pricing)
- Timestamp
- Conversation/Message IDs (for traceability)

---

## Database Schema

### `llm_usage_log` Table
```sql
CREATE TABLE llm_usage_log (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,           -- Foreign key to user table (indexed)
    model_id UUID NOT NULL,           -- Foreign key to llm_model table
    conversation_id UUID,             -- Optional conversation tracking
    message_id UUID,                  -- Optional message tracking
    input_tokens INTEGER DEFAULT 0,   -- Tokens sent to LLM
    output_tokens INTEGER DEFAULT 0,  -- Tokens received from LLM
    total_cost FLOAT DEFAULT 0.0,     -- Calculated cost in USD
    created_at TIMESTAMP,             -- When the request was made (indexed)

    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (model_id) REFERENCES llm_model(id),
    FOREIGN KEY (conversation_id) REFERENCES conversation(id),
    FOREIGN KEY (message_id) REFERENCES llm_message(id)
);

-- Indexes for fast billing queries
CREATE INDEX idx_usage_user ON llm_usage_log(user_id);
CREATE INDEX idx_usage_created ON llm_usage_log(created_at);
```

---

## Billing API Endpoints

### 1. Get User's Own Usage
**Endpoint**: `GET /v2/billing/usage/my-usage?days=30`

**Description**: Users can view their own usage and costs

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/v2/billing/usage/my-usage?days=30"
```

**Response**:
```json
{
  "user_id": "uuid",
  "user_email": "user@example.com",
  "total_requests": 150,
  "total_input_tokens": 25000,
  "total_output_tokens": 15000,
  "total_tokens": 40000,
  "total_cost": 0.12,
  "models_used": ["GPT-4o", "Claude Sonnet 4.5"]
}
```

### 2. Get Admin Usage Report
**Endpoint**: `GET /v2/billing/usage/report?days=30`

**Access**: Superuser only

**Description**: Comprehensive report of all users' usage for billing

**Example**:
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:8000/v2/billing/usage/report?start_date=2026-02-01T00:00:00&end_date=2026-02-28T23:59:59"
```

**Response**:
```json
{
  "period_start": "2026-02-01T00:00:00",
  "period_end": "2026-02-28T23:59:59",
  "total_users": 10,
  "total_requests": 1500,
  "total_tokens": 500000,
  "total_cost": 15.50,
  "by_user": [
    {
      "user_id": "uuid",
      "user_email": "user@example.com",
      "total_requests": 200,
      "total_input_tokens": 50000,
      "total_output_tokens": 30000,
      "total_tokens": 80000,
      "total_cost": 2.50,
      "models_used": ["GPT-4o", "GPT-4o Mini"]
    }
  ],
  "by_model": [
    {
      "model_id": "uuid",
      "model_name": "GPT-4o",
      "provider": "openai",
      "total_requests": 500,
      "total_input_tokens": 100000,
      "total_output_tokens": 50000,
      "total_cost": 5.00
    }
  ]
}
```

### 3. Export Usage as CSV
**Endpoint**: `GET /v2/billing/usage/export-csv?days=30`

**Access**: Superuser only

**Description**: Download detailed usage logs as CSV for accounting systems

**Example**:
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:8000/v2/billing/usage/export-csv?days=30" \
  -o usage_report.csv
```

**CSV Format**:
```csv
Date,User Email,User ID,Model Name,Provider,Input Tokens,Output Tokens,Total Tokens,Cost (USD),Conversation ID
2026-02-12T10:30:00,user@example.com,uuid,GPT-4o,openai,500,300,800,0.0080,uuid
2026-02-12T10:35:00,user@example.com,uuid,Claude Sonnet 4.5,anthropic,1000,500,1500,0.0225,uuid
```

---

## Direct Database Queries

### Get Total Usage by User (Last 30 Days)
```sql
SELECT
    u.email,
    COUNT(*) as total_requests,
    SUM(l.input_tokens) as total_input_tokens,
    SUM(l.output_tokens) as total_output_tokens,
    SUM(l.input_tokens + l.output_tokens) as total_tokens,
    SUM(l.total_cost) as total_cost_usd
FROM llm_usage_log l
JOIN "user" u ON l.user_id = u.id
WHERE l.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email
ORDER BY total_cost_usd DESC;
```

### Get Usage by Model (Last 30 Days)
```sql
SELECT
    m.display_name,
    p.name as provider,
    COUNT(*) as total_requests,
    SUM(l.input_tokens) as total_input_tokens,
    SUM(l.output_tokens) as total_output_tokens,
    SUM(l.total_cost) as total_cost_usd
FROM llm_usage_log l
JOIN llm_model m ON l.model_id = m.id
JOIN llm_provider p ON m.provider_id = p.id
WHERE l.created_at >= NOW() - INTERVAL '30 days'
GROUP BY m.id, m.display_name, p.name
ORDER BY total_cost_usd DESC;
```

### Get Daily Usage for a Specific User
```sql
SELECT
    DATE(l.created_at) as date,
    COUNT(*) as requests,
    SUM(l.input_tokens + l.output_tokens) as total_tokens,
    SUM(l.total_cost) as cost_usd
FROM llm_usage_log l
WHERE l.user_id = 'USER_UUID'
  AND l.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(l.created_at)
ORDER BY date DESC;
```

### Get Hourly Usage (for monitoring spikes)
```sql
SELECT
    DATE_TRUNC('hour', l.created_at) as hour,
    COUNT(*) as requests,
    SUM(l.input_tokens + l.output_tokens) as total_tokens,
    SUM(l.total_cost) as cost_usd
FROM llm_usage_log l
WHERE l.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', l.created_at)
ORDER BY hour DESC;
```

---

## Pricing Model

Costs are automatically calculated based on the model pricing in `llm_model` table:

```python
# Cost calculation (in code)
cost = (input_tokens / 1_000_000 * model.input_token_price) + \
       (output_tokens / 1_000_000 * model.output_token_price)
```

### Current Model Pricing (per 1M tokens)

**OpenAI**
- GPT-4o: $2.50 input / $10.00 output
- GPT-4o Mini: $0.15 input / $0.60 output
- GPT-4 Turbo: $10.00 input / $30.00 output
- O1 Preview: $15.00 input / $60.00 output
- O1 Mini: $3.00 input / $12.00 output

**Anthropic**
- Claude Sonnet 4.5: $3.00 input / $15.00 output
- Claude Opus 4.6: $15.00 input / $75.00 output
- Claude Haiku 4.5: $0.80 input / $4.00 output

**Google**
- Gemini 2.0 Flash: Free (preview)
- Gemini 1.5 Pro: $1.25 input / $5.00 output
- Gemini 1.5 Flash: $0.075 input / $0.30 output

---

## Integration with Stripe

The system is ready to integrate with Stripe metered billing:

### Option 1: Report Usage to Stripe
```python
import stripe

# Get monthly usage for a user
usage_data = get_usage_report(user_id, start_date, end_date)

# Report to Stripe
stripe.SubscriptionItem.create_usage_record(
    subscription_item_id,
    quantity=usage_data.total_tokens,
    timestamp=int(datetime.utcnow().timestamp())
)
```

### Option 2: Generate Monthly Invoices
1. Use `/v2/billing/usage/report` to get all users' usage
2. Calculate charges based on your markup/pricing
3. Create invoices via Stripe API or your billing system

---

## Testing the Billing System

### 1. Make a test API call:
```bash
curl -X POST http://localhost:8000/v2/llm/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "MODEL_UUID",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### 2. Check if usage was logged:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/v2/billing/usage/my-usage?days=1"
```

### 3. Verify in database:
```sql
SELECT * FROM llm_usage_log
ORDER BY created_at DESC
LIMIT 10;
```

---

## Best Practices

1. **Regular Exports**: Export CSV reports monthly for accounting
2. **Set Usage Limits**: Add rate limiting to prevent abuse
3. **Monitor Costs**: Set up alerts for unusual usage spikes
4. **Audit Trail**: Keep conversation_id and message_id for dispute resolution
5. **Data Retention**: Archive old usage logs (>1 year) to separate storage
6. **User Quotas**: Implement monthly spending limits per user

---

## Monitoring Queries

### Find high-cost users (potential abuse):
```sql
SELECT u.email, SUM(l.total_cost) as total_cost
FROM llm_usage_log l
JOIN "user" u ON l.user_id = u.id
WHERE l.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email
HAVING SUM(l.total_cost) > 10.0
ORDER BY total_cost DESC;
```

### Find users with unusual request patterns:
```sql
SELECT u.email, COUNT(*) as requests
FROM llm_usage_log l
JOIN "user" u ON l.user_id = u.id
WHERE l.created_at >= NOW() - INTERVAL '1 hour'
GROUP BY u.id, u.email
HAVING COUNT(*) > 100
ORDER BY requests DESC;
```

---

## Summary

✅ **Every LLM request is logged** with user, cost, and tokens
✅ **User-level tracking** for accurate billing per customer
✅ **Model-level tracking** to see which models are most expensive
✅ **API endpoints** for programmatic billing integration
✅ **CSV export** for accounting systems
✅ **Stripe-ready** for metered billing integration

Your billing system is **production-ready**! 🎉
