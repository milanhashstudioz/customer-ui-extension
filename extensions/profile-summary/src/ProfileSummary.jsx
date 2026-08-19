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

  return (
    <s-box border="base" borderRadius="base" padding="base">
      <s-stack direction="block" gap="base">
        <s-stack direction="block" gap="small">
          <s-heading>Account summary</s-heading>
          <s-text color="subdued">
            Welcome back, {customer.firstName || 'customer'}.
          </s-text>
        </s-stack>
 
        <MetricGrid
          items={[
            {
              label: 'Account number',
              value: metafieldValue(customer.accountNumber),
            },
            {
              label: 'Account status',
              value: metafieldValue(customer.accountStatus),
              tone: statusTone(metafieldValue(customer.accountStatus)),
            },
            {
              label: 'Credit limit',
              value: money(metafieldValue(customer.creditLimit, 0)),
            },
            {
              label: 'Current balance',
              value: money(metafieldValue(customer.currentBalance, 0)),
            },
            {
              label: 'Available credit',
              value: money(metafieldValue(customer.availableCredit, 0)),
            },
            {
              label: 'Open orders',
              value: String(metrics.openOrdersCount),
            },
            {
              label: 'Backordered items',
              value: String(metrics.backorderedItemsCount),
            },
            {
              label: 'Open returns',
              value: String(metrics.openReturnsCount),
            },
          ]}
        />
 
        <s-stack direction="inline" gap="base">
          <s-button
            variant="primary"
            onClick={() => shopify.navigation.navigate('extension://account-details-page')}
          >
            View account details
          </s-button>
          <s-button
            onClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}
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
    >
      {items.map((item) => (
        <s-box border="base" borderRadius="base" padding="base" key={item.label}>
          <s-stack direction="block" gap="small-100">
            <s-text color="subdued">{item.label}</s-text>
            {item.tone ? (
              <s-badge tone={item.tone}>{item.value}</s-badge>
            ) : (
              <s-text type="strong">{item.value}</s-text>
            )}
          </s-stack>
        </s-box>
      ))}
    </s-grid>
  );
}
