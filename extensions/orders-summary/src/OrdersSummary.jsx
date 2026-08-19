/** @jsxImportSource preact */
import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';

import {
  buildCustomerMetafieldsSelection,
  customerAccountQuery,
  metafieldValue,
  money,
  shortDate,
  statusTone,
  calculateOrderMetrics,
} from '../../shared/customer-account-data';

export default function extension() {
  render(<Extension />, document.body);
}

const ORDERS_QUERY = `#graphql
  query OrdersSummary {
    customer {
      ${buildCustomerMetafieldsSelection()}
      orders(first: 100, reverse: true) {
        nodes {
          id
          name
          processedAt
          financialStatus
          fulfillmentStatus
          cancelledAt
          totalPrice {
            amount
            currencyCode
          }
          lineItems(first: 100) {
            nodes {
              id
              quantity
            }
          }
          fulfillments(first: 50) {
            nodes {
              fulfillmentLineItems(first: 100) {
                nodes {
                  quantity
                  lineItem {
                    id
                  }
                }
              }
            }
          }
          returns(first: 50) {
            nodes {
              status
            }
          }
        }
      }
    }
  }
`;

function Extension() {
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    customerAccountQuery(ORDERS_QUERY)
      .then(({customer}) => setCustomer(customer))
      .catch((queryError) => setError(queryError.message));
  }, []);

  if (error) {
    return <s-banner tone="critical">Unable to load orders summary: {error}</s-banner>;
  }

  if (!customer) {
    return <s-text>Loading orders…</s-text>;
  }

  const metrics = calculateOrderMetrics(customer.orders);

  return (
    <s-box border="base" borderRadius="base" padding="base">
      <s-stack direction="block" gap="base">
        <s-heading>Recent activity</s-heading>

        <SummaryGrid customer={customer} metrics={metrics} />

        <s-divider></s-divider>

        <s-stack direction="block" gap="small">
          {customer.orders?.nodes?.length ? (
            customer.orders.nodes.slice(0, 5).map((order) => (
              <s-box border="base" borderRadius="base" padding="base" key={order.id}>
                <s-grid
                  gridTemplateColumns="minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr)"
                  gap="base"
                >
                  <LabelValue label="Order #" value={order.name || '—'} />
                  <LabelValue label="Date" value={shortDate(order.processedAt)} />
                  <LabelValue
                    label="Status"
                    value={order.fulfillmentStatus || order.financialStatus || 'Processing'}
                    tone={statusTone(order.fulfillmentStatus || order.financialStatus)}
                  />
                  <LabelValue
                    label="Total"
                    value={money(order.totalPrice?.amount, order.totalPrice?.currencyCode || 'USD')}
                  />
                </s-grid>
              </s-box>
            ))
          ) : (
            <s-text color="subdued">No orders found for this customer yet.</s-text>
          )}
        </s-stack>

        <s-button
          variant="secondary"
          onClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}
        >
          View all orders
        </s-button>
      </s-stack>
    </s-box>
  );
}

function SummaryGrid({customer, metrics}) {
  return (
    <s-grid
      gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))"
      gap="base"
    >
      <MetricCard label="Open orders" value={String(metrics.openOrdersCount)} />
      <MetricCard label="Backordered items" value={String(metrics.backorderedItemsCount)} />
      <MetricCard label="Open returns" value={String(metrics.openReturnsCount)} />
      <MetricCard
        label="Available credit"
        value={money(metafieldValue(customer.availableCredit, 0))}
      />
    </s-grid>
  );
}

function MetricCard({label, value}) {
  return (
    <s-box border="base" borderRadius="base" padding="base">
      <s-stack direction="block" gap="small-100">
        <s-text color="subdued">{label}</s-text>
        <s-text type="strong">{value}</s-text>
      </s-stack>
    </s-box>
  );
}

function LabelValue({label, value, tone}) {
  return (
    <s-stack direction="block" gap="small-100">
      <s-text color="subdued">{label}</s-text>
      {tone ? <s-badge tone={tone}>{value}</s-badge> : <s-text type="strong">{value}</s-text>}
    </s-stack>
  );
}
