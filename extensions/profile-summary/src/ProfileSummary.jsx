/** @jsxImportSource preact */
import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';

import {
  buildCustomerMetafieldsSelection,
  customerAccountQuery,
  metafieldValue,
  money,
  statusTone,
  calculateOrderMetrics,
} from '../../shared/customer-account-data';

export default function extension() {
  render(<Extension />, document.body);
}

const PROFILE_QUERY = `#graphql
  query ProfileSummary {
    customer {
      firstName
      ${buildCustomerMetafieldsSelection()}
      orders(first: 100, reverse: true) {
        nodes {
          id
          cancelledAt
          fulfillmentStatus
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
    customerAccountQuery(PROFILE_QUERY)
      .then(({customer}) => setCustomer(customer))
      .catch((queryError) => setError(queryError.message));
  }, []);

  if (error) {
    return <s-banner tone="critical">Unable to load account summary: {error}</s-banner>;
  }

  if (!customer) {
    return <s-text>Loading account summary…</s-text>;
  }

  const metrics = calculateOrderMetrics(customer.orders);

  const customCss = shopify.settings?.value?.custom_css || '';

  return (
    <s-box border="base" borderRadius="base" padding="base" class="custom-profile-summary-block">
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      <s-stack direction="block" gap="base" class="profile-summary-stack">
        <s-stack direction="block" gap="small" class="profile-summary-header-stack">
          <s-heading class="profile-summary-heading">Account summary</s-heading>
          <s-text color="subdued" class="profile-summary-subtitle">
            Welcome back, {customer.firstName || 'customer'}.
          </s-text>
        </s-stack>
 
        <MetricGrid
          items={[
            {
              label: 'Account number',
              value: metafieldValue(customer.accountNumber),
              key: 'account_number'
            },
            {
              label: 'Account status',
              value: metafieldValue(customer.accountStatus),
              tone: statusTone(metafieldValue(customer.accountStatus)),
              key: 'account_status'
            },
            {
              label: 'Credit limit',
              value: money(metafieldValue(customer.creditLimit, 0)),
              key: 'credit_limit'
            },
            {
              label: 'Current balance',
              value: money(metafieldValue(customer.currentBalance, 0)),
              key: 'current_balance'
            },
            {
              label: 'Available credit',
              value: money(metafieldValue(customer.availableCredit, 0)),
              key: 'available_credit'
            },
            {
              label: 'Open orders',
              value: String(metrics.openOrdersCount),
              key: 'open_orders'
            },
            {
              label: 'Backordered items',
              value: String(metrics.backorderedItemsCount),
              key: 'backordered_items'
            },
            {
              label: 'Open returns',
              value: String(metrics.openReturnsCount),
              key: 'open_returns'
            },
          ]}
        />
 
        <s-stack direction="inline" gap="base" class="profile-summary-actions-stack">
          <s-button
            variant="primary"
            onClick={() => shopify.navigation.navigate('extension://account-details-page')}
            class="profile-summary-btn view-details-btn"
          >
            View account details
          </s-button>
          <s-button
            onClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}
            class="profile-summary-btn view-orders-btn"
          >
            View all orders
          </s-button>
        </s-stack>
      </s-stack>
    </s-box>
  );
}

function MetricGrid({items}) {
  return (
    <s-grid
      gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))"
      gap="base"
      class="profile-summary-grid"
    >
      {items.map((item) => (
        <s-box border="base" borderRadius="base" padding="base" key={item.label} class={`profile-summary-card profile-summary-card-${item.key || 'item'}`}>
          <s-stack direction="block" gap="small-100" class="profile-summary-card-stack">
            <s-text color="subdued" class="profile-summary-card-label">{item.label}</s-text>
            {item.tone ? (
              <s-badge tone={item.tone} class="profile-summary-card-badge">{item.value}</s-badge>
            ) : (
              <s-text type="strong" class="profile-summary-card-value">{item.value}</s-text>
            )}
          </s-stack>
        </s-box>
      ))}
    </s-grid>
  );
}
