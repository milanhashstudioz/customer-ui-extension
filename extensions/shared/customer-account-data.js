export const API_VERSION = '2026-07';
export const CUSTOMER_METAFIELD_NAMESPACE = 'custom';

export const CUSTOMER_METAFIELDS = {
  accountNumber: 'account_number',
  accountStatus: 'account_status',
  companyName: 'company_name',
  customerType: 'customer_type',
  paymentTerms: 'payment_terms',
  creditLimit: 'credit_limit',
  currentBalance: 'current_balance',
  availableCredit: 'available_credit',
  primaryContactName: 'primary_contact_name',
  primaryContactEmail: 'primary_contact_email',
  primaryContactPhone: 'primary_contact_phone',
  billingContactName: 'billing_contact_name',
  billingContactEmail: 'billing_contact_email',
  billingContactPhone: 'billing_contact_phone',
  taxExemptStatus: 'tax_exempt_status',
  certificateNumber: 'certificate_number',
  taxExpiryDate: 'tax_expiry_date',
  preferredWarehouse: 'preferred_warehouse',
  preferredShippingMethod: 'preferred_shipping_method',
  emailNotifications: 'email_notifications',
  marketingEmails: 'marketing_emails',
  statementUrl: 'statement_url',
  taxCertificateUrl: 'tax_certificate_url'
};

export function buildCustomerMetafieldsSelection() {
  return Object.entries(CUSTOMER_METAFIELDS)
    .map(
      ([alias, key]) =>
        `${alias}: metafield(namespace: "${CUSTOMER_METAFIELD_NAMESPACE}", key: "${key}") { value }`,
    )
    .join('\n');
}

export async function customerAccountQuery(query, variables = {}) {
  const response = await fetch(
    `shopify://customer-account/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({query, variables}),
    },
  );

  const payload = await response.json();

  if (!response.ok || payload.errors?.length) {
    throw new Error(JSON.stringify(payload.errors || payload));
  }

  return payload.data;
}

export function metafieldValue(field, fallback = '—') {
  return field?.value ?? fallback;
}

export function money(value, currencyCode = 'USD') {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric)) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(numeric);
}

export function shortDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function statusTone(statusValue) {
  const value = String(statusValue || '').toLowerCase();

  if (value.includes('active') || value.includes('paid') || value.includes('shipped')) {
    return 'success';
  }

  if (value.includes('backorder') || value.includes('processing')) {
    return 'warning';
  }

  if (value.includes('cancel') || value.includes('overdue') || value.includes('failed')) {
    return 'critical';
  }

  return 'info';
}

export function calculateOrderMetrics(ordersNode) {
  const orders = ordersNode?.nodes || [];

  // 1. Calculate Open Orders Count
  const openOrders = orders.filter(
    (order) =>
      !order.cancelledAt &&
      order.fulfillmentStatus !== 'FULFILLED' &&
      order.fulfillmentStatus !== 'RESTOCKED'
  );
  const openOrdersCount = openOrders.length;

  // 2. Calculate Backordered Items Count (unfulfilled items on open orders)
  let backorderedItemsCount = 0;
  openOrders.forEach((order) => {
    const fulfilledQuantities = {};

    order.lineItems?.nodes?.forEach((item) => {
      fulfilledQuantities[item.id] = 0;
    });

    order.fulfillments?.nodes?.forEach((fulfillment) => {
      fulfillment.fulfillmentLineItems?.nodes?.forEach((fItem) => {
        const lineItemId = fItem.lineItem?.id;
        if (lineItemId && fulfilledQuantities[lineItemId] !== undefined) {
          fulfilledQuantities[lineItemId] += fItem.quantity;
        }
      });
    });

    order.lineItems?.nodes?.forEach((item) => {
      const ordered = item.quantity;
      const fulfilled = fulfilledQuantities[item.id] || 0;
      const unfulfilled = Math.max(0, ordered - fulfilled);
      backorderedItemsCount += unfulfilled;
    });
  });

  // 3. Calculate Open Returns Count
  let openReturnsCount = 0;
  orders.forEach((order) => {
    order.returns?.nodes?.forEach((ret) => {
      if (ret.status === 'OPEN' || ret.status === 'REQUESTED') {
        openReturnsCount++;
      }
    });
  });

  return {
    openOrdersCount,
    backorderedItemsCount,
    openReturnsCount,
  };
}
