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

const DASHBOARD_QUERY = `#graphql
  query DashboardPageQuery {
    customer {
      firstName
      lastName
      emailAddress {
        emailAddress
      }
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
  const [loading, setLoading] = useState(true);
  const [customerType, setCustomerType] = useState('Commercial');

  useEffect(() => {
    customerAccountQuery(DASHBOARD_QUERY)
      .then(({customer}) => {
        setCustomer(customer);
        const savedType = metafieldValue(customer.customerType, 'Commercial');
        setCustomerType(savedType);
        setLoading(false);
      })
      .catch((queryError) => {
        setError(queryError.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <s-text>Loading dashboard…</s-text>;
  }

  if (error) {
    return <s-banner tone="critical">Unable to load dashboard details: {error}</s-banner>;
  }

  if (!customer) {
    return <s-text>No customer data found.</s-text>;
  }

  const metrics = calculateOrderMetrics(customer.orders);
  const openOrdersCount = metrics.openOrdersCount;
  const backorderedItemsCount = metrics.backorderedItemsCount;
  const openReturnsCount = metrics.openReturnsCount;

  return (
    <s-page
      heading="MY ACCOUNT"
      subheading={`Welcome back, ${customer.firstName || 'customer'}! • Account #: ${metafieldValue(customer.accountNumber)}`}
    >
      {/* Account Type dropdown in top right action area */}
      <s-box slot="primary-action" padding="none">
        <s-stack direction="inline" gap="small" blockAlignment="center">
          <s-text size="small" type="strong" color="subdued">ACCOUNT TYPE</s-text>
          <s-select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
          >
            <s-option value="Retail">Retail</s-option>
            <s-option value="Commercial">Commercial</s-option>
          </s-select>
        </s-stack>
      </s-box>

      <s-stack direction="block" gap="large">
        {/* Navigation Tabs */}
        <s-box padding="none">
          <s-stack direction="inline" gap="base">
            <s-button variant="primary">Dashboard</s-button>
            <s-button onClick={() => shopify.navigation.navigate('extension://account-details-page')}>
              Account Details
            </s-button>
            <s-button onClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}>
              Order History
            </s-button>
            <s-button onClick={() => shopify.navigation.navigate('shopify:customer-account/profile')}>
              Address Book
            </s-button>
          </s-stack>
        </s-box>

        {/* Account Summary Section */}
        <s-box border="base" borderRadius="base" padding="base">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="small" blockAlignment="center">
              <s-icon type="profile" />
              <s-heading>ACCOUNT SUMMARY</s-heading>
            </s-stack>
            
            <s-grid
              gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))"
              gap="base"
            >
              <MetricCard
                label="ACCOUNT STATUS"
                value={metafieldValue(customer.accountStatus)}
                tone={statusTone(metafieldValue(customer.accountStatus))}
              />
              <MetricCard
                label="CREDIT LIMIT"
                value={money(metafieldValue(customer.creditLimit))}
              />
              <MetricCard
                label="CURRENT BALANCE"
                value={money(metafieldValue(customer.currentBalance))}
              />
              <MetricCard
                label="AVAILABLE CREDIT"
                value={money(metafieldValue(customer.availableCredit))}
              />
              <MetricCard
                label="OPEN ORDERS"
                value={String(openOrdersCount)}
                linkText="View orders"
                onLinkClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}
              />
              <MetricCard
                label="BACKORDERED ITEMS"
                value={String(backorderedItemsCount)}
                linkText="View details"
                onLinkClick={() => shopify.navigation.navigate('extension://account-details-page')}
              />
              <MetricCard
                label="OPEN RETURNS (RMAs)"
                value={String(openReturnsCount)}
                linkText="View returns"
                onLinkClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}
              />
            </s-grid>
          </s-stack>
        </s-box>

        {/* Recent Activity Section */}
        <s-box border="base" borderRadius="base" padding="base">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="small" blockAlignment="center">
              <s-icon type="calendar" />
              <s-heading>RECENT ACTIVITY</s-heading>
            </s-stack>
            
            {customer.orders?.nodes?.length ? (
              <s-stack direction="block" gap="small-100">
                {/* Table Header */}
                <s-box padding="small" border="none" borderRadius="none">
                  <s-grid
                    gridTemplateColumns="1fr 1fr 1fr 1fr 1fr 1fr"
                    gap="small"
                  >
                    <s-text type="strong" color="subdued">ORDER #</s-text>
                    <s-text type="strong" color="subdued">ORDER DATE</s-text>
                    <s-text type="strong" color="subdued">PO NUMBER</s-text>
                    <s-text type="strong" color="subdued">STATUS</s-text>
                    <s-text type="strong" color="subdued">TOTAL</s-text>
                    <s-text type="strong" color="subdued">ACTION</s-text>
                  </s-grid>
                </s-box>
                <s-divider></s-divider>

                {/* Table Rows */}
                {customer.orders.nodes.slice(0, 5).map((order) => {
                  const numericId = order.id.split('/').pop();
                  return (
                    <s-box padding="small" key={order.id}>
                      <s-grid
                        gridTemplateColumns="1fr 1fr 1fr 1fr 1fr 1fr"
                        gap="small"
                        blockAlignment="center"
                      >
                        <s-text type="strong">{order.name}</s-text>
                        <s-text>{shortDate(order.processedAt)}</s-text>
                        <s-text>{getPoNumber(order)}</s-text>
                        <s-badge tone={statusTone(order.fulfillmentStatus || order.financialStatus)}>
                          {order.fulfillmentStatus || order.financialStatus || 'Processing'}
                        </s-badge>
                        <s-text type="strong">
                          {money(order.totalPrice?.amount, order.totalPrice?.currencyCode)}
                        </s-text>
                        <s-link onClick={() => shopify.navigation.navigate(`shopify:customer-account/orders/${numericId}`)}>
                          View
                        </s-link>
                      </s-grid>
                    </s-box>
                  );
                })}
              </s-stack>
            ) : (
              <s-text color="subdued">No orders found for this customer.</s-text>
            )}

            <s-divider></s-divider>
            
            <s-stack direction="inline" inlineAlignment="center">
              <s-link onClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}>
                View all orders →
              </s-link>
            </s-stack>
          </s-stack>
        </s-box>
      </s-stack>
    </s-page>
  );
}

function getPoNumber(order) {
  if (!order.customAttributes) return '—';
  const poAttr = order.customAttributes.find(
    (attr) =>
      attr.key.toLowerCase() === 'po_number' ||
      attr.key.toLowerCase() === 'po-number' ||
      attr.key.toLowerCase() === 'purchase order' ||
      attr.key.toLowerCase() === 'po number'
  );
  return poAttr ? poAttr.value : '—';
}

function MetricCard({label, value, tone = null, linkText = null, onLinkClick = null}) {
  return (
    <s-box border="base" borderRadius="base" padding="base">
      <s-stack direction="block" gap="small-100">
        <s-text color="subdued" size="small" type="strong">{label}</s-text>
        {tone ? (
          <s-badge tone={tone}>{value}</s-badge>
        ) : (
          <s-text type="strong" size="large">{value}</s-text>
        )}
        {linkText && onLinkClick && (
          <s-link onClick={onLinkClick}>
            {linkText} →
          </s-link>
        )}
      </s-stack>
    </s-box>
  );
}
