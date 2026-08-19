# Shopify Customer Account App Starter

This starter gives you four customer-account extensions for Shopify's new customer accounts:

1. `profile-summary`
2. `account-details-page`
3. `orders-summary`
4. `order-details-block`

The code assumes the client stores account-specific values such as credit limit and balance in **customer metafields**.

## What this covers

- Profile page summary card
- New full page under customer account for "Account details"
- Orders page summary and recent orders table
- Order details page block with order/account context

## Metafields expected on the `Customer`

Namespace used in the sample: `b2b`

Keys used in the sample:

- `account_number`
- `account_status`
- `company_name`
- `customer_type`
- `payment_terms`
- `credit_limit`
- `current_balance`
- `available_credit`
- `open_orders_count`
- `backordered_items_count`
- `open_returns_count`
- `primary_contact_name`
- `primary_contact_email`
- `primary_contact_phone`
- `billing_contact_name`
- `billing_contact_email`
- `billing_contact_phone`
- `tax_exempt_status`
- `certificate_number`
- `tax_expiry_date`
- `preferred_warehouse`
- `preferred_shipping_method`
- `email_notifications`
- `marketing_emails`
- `statement_url`
- `tax_certificate_url`

If your real store uses a different namespace or different keys, update
`extensions/shared/customer-account-data.js`.

## Setup

1. Create a Shopify app with the Shopify CLI:

```bash
shopify app init
```

2. Copy the files from this folder into that app.
3. Replace values in `shopify.app.toml`.
4. Install the app on the target dev store.
5. In Shopify admin, enable **new customer accounts**.
6. Run:

```bash
shopify app dev
```

7. In `Settings > Checkout`, open the checkout and accounts editor.
8. Add these extensions:
   - `Profile account summary` on the Profile page
   - `Account details page` to the customer account menu
   - `Orders summary` on the Orders page
   - `Order details block` on the Order status/details page

## Required app access

- `customer_read_customers`
- Protected customer data approval before going live

If you later want customers to edit profile data directly from the UI, also add:

- `customer_write_customers`

## Notes

- This sample uses the Customer Account API through
  `fetch('shopify://customer-account/api/2026-07/graphql.json')`.
- No external backend is required for read-only metafield rendering.
- For links like "Upload certificate" or "View statement", the sample expects file
  or portal URLs in metafields.
