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

  const customCss = shopify.settings?.value?.custom_css || '';

  return (
    <s-box border="base" borderRadius="base" padding="base" class="custom-orders-summary-block">
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      <s-stack direction="block" gap="base" class="orders-summary-stack">
        <s-heading class="orders-summary-heading">Recent activity</s-heading>

        <SummaryGrid customer={customer} metrics={metrics} />

        <s-divider class="orders-summary-divider"></s-divider>

        <s-stack direction="block" gap="small" class="orders-summary-list-stack">
          {customer.orders?.nodes?.length ? (
            customer.orders.nodes.slice(0, 5).map((order) => (
              <s-box border="base" borderRadius="base" padding="base" key={order.id} class="orders-summary-card">
                <s-grid
                  gridTemplateColumns="minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr)"
                  gap="base"
                  class="orders-summary-card-grid"
                >
                  <LabelValue label="Order #" value={order.name || '—'} class="order-num-col" />
                  <LabelValue label="Date" value={shortDate(order.processedAt)} class="order-date-col" />
                  <LabelValue
                    label="Status"
                    value={order.fulfillmentStatus || order.financialStatus || 'Processing'}
                    tone={statusTone(order.fulfillmentStatus || order.financialStatus)}
                    class="order-status-col"
                  />
                  <LabelValue
                    label="Total"
                    value={money(order.totalPrice?.amount, order.totalPrice?.currencyCode || 'USD')}
                    class="order-total-col"
                  />
                </s-grid>
              </s-box>
            ))
          ) : (
            <s-text color="subdued" class="orders-summary-empty-text">No orders found for this customer yet.</s-text>
          )}
        </s-stack>

        <s-button
          variant="secondary"
          onClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}
          class="orders-summary-view-btn"
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
      class="orders-summary-metrics-grid"
    >
      <MetricCard label="Open orders" value={String(metrics.openOrdersCount)} class="open-orders-metric" />
      <MetricCard label="Backordered items" value={String(metrics.backorderedItemsCount)} class="backordered-items-metric" />
      <MetricCard label="Open returns" value={String(metrics.openReturnsCount)} class="open-returns-metric" />
      <MetricCard
        label="Available credit"
        value={money(metafieldValue(customer.availableCredit, 0))}
        class="available-credit-metric"
      />
    </s-grid>
  );
}

function MetricCard({label, value, class: className = ''}) {
  return (
    <s-box border="base" borderRadius="base" padding="base" class={`orders-summary-metric-card ${className}`.trim()}>
      <s-stack direction="block" gap="small-100" class="orders-summary-metric-stack">
        <s-text color="subdued" class="orders-summary-metric-label">{label}</s-text>
        <s-text type="strong" class="orders-summary-metric-value">{value}</s-text>
      </s-stack>
    </s-box>
  );
}

function LabelValue({label, value, tone, class: className = ''}) {
  return (
    <s-stack direction="block" gap="small-100" class={`orders-summary-item-stack ${className}`.trim()}>
      <s-text color="subdued" class="orders-summary-item-label">{label}</s-text>
      {tone ? (
        <s-badge tone={tone} class="orders-summary-item-badge">{value}</s-badge>
      ) : (
        <s-text type="strong" class="orders-summary-item-value">{value}</s-text>
      )}
    </s-stack>
  );
}
