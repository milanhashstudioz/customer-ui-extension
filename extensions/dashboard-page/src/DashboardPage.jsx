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
        {/* <s-box padding="none">
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
        </s-box> */}

        {/* Account Summary Section */}
        <s-box border="base" borderRadius="base" padding="none">
          <s-stack direction="block" gap="none">
            {/* Header with padding */}
            <s-box padding="base">
              <s-stack direction="inline" gap="small" blockAlignment="center">
                <s-icon type="profile" />
                <s-heading>ACCOUNT SUMMARY</s-heading>
              </s-stack>
            </s-box>
            
            <s-divider></s-divider>

            {/* Top Section with scroll box for responsiveness */}
            <s-scroll-box border="none" padding="none">
              <s-box padding="base" minInlineSize="500px">
                <s-grid
                  gridTemplateColumns="1fr auto 1fr auto 1fr"
                  gap="base"
                  blockAlignment="center"
                >
                  {/* Column 1: Status & Available Credit */}
                  <s-stack direction="block" gap="base">
                    <s-stack direction="block" gap="small-100">
                      <s-text color="subdued" size="small" type="strong">ACCOUNT STATUS</s-text>
                      <s-stack direction="inline" gap="small-100" blockAlignment="center">
                        <s-text type="strong" color="success">●</s-text>
                        <s-text type="strong" color="success">{metafieldValue(customer.accountStatus)}</s-text>
                      </s-stack>
                    </s-stack>
                    <s-stack direction="block" gap="small-100">
                      <s-text color="subdued" size="small" type="strong">AVAILABLE CREDIT</s-text>
                      <s-text type="strong" size="large">{money(metafieldValue(customer.availableCredit))}</s-text>
                    </s-stack>
                  </s-stack>

                  {/* Vertical Divider */}
                  <s-divider direction="block" />

                  {/* Column 2: Credit Limit */}
                  <s-stack direction="block" gap="small-100">
                    <s-text color="subdued" size="small" type="strong">CREDIT LIMIT</s-text>
                    <s-text type="strong" size="large">{money(metafieldValue(customer.creditLimit))}</s-text>
                  </s-stack>

                  {/* Vertical Divider */}
                  <s-divider direction="block" />

                  {/* Column 3: Current Balance */}
                  <s-stack direction="block" gap="small-100">
                    <s-text color="subdued" size="small" type="strong">CURRENT BALANCE</s-text>
                    <s-text type="strong" size="large">{money(metafieldValue(customer.currentBalance))}</s-text>
                  </s-stack>
                </s-grid>
              </s-box>
            </s-scroll-box>

            <s-divider></s-divider>

            {/* Bottom Section with scroll box for responsiveness */}
            <s-scroll-box border="none" padding="none">
              <s-box padding="base" minInlineSize="500px">
                <s-grid
                  gridTemplateColumns="1fr auto 1fr auto 1fr"
                  gap="base"
                  blockAlignment="center"
                >
                  {/* Column 1: Open Orders */}
                  <s-stack direction="block" gap="small-100" inlineAlignment="start">
                    <s-text color="subdued" size="small" type="strong">OPEN ORDERS</s-text>
                    <s-text type="strong" size="large">{String(openOrdersCount)}</s-text>
                    {/* <s-link onClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}>
                      View orders →
                    </s-link> */}
                  </s-stack>

                  {/* Vertical Divider */}
                  <s-divider direction="block" />

                  {/* Column 2: Backordered Items */}
                  <s-stack direction="block" gap="small-100" inlineAlignment="start">
                    <s-text color="subdued" size="small" type="strong">BACKORDERED ITEMS</s-text>
                    <s-text type="strong" size="large">{String(backorderedItemsCount)}</s-text>
                    {/* <s-link onClick={() => shopify.navigation.navigate('extension://account-details-page')}>
                      View details →
                    </s-link> */}
                  </s-stack>

                  {/* Vertical Divider */}
                  <s-divider direction="block" />

                  {/* Column 3: Open Returns */}
                  <s-stack direction="block" gap="small-100" inlineAlignment="start">
                    <s-text color="subdued" size="small" type="strong">OPEN RETURNS (RMAs)</s-text>
                    <s-text type="strong" size="large">{String(openReturnsCount)}</s-text>
                    {/* <s-link onClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}>
                      View returns →
                    </s-link> */}
                  </s-stack>
                </s-grid>
              </s-box>
            </s-scroll-box>
          </s-stack>
        </s-box>

        {/* Recent Activity Section */}
        <s-box border="base" borderRadius="base" padding="none">
          <s-stack direction="block" gap="none">
            {/* Header with padding */}
            <s-box padding="base">
              <s-stack direction="inline" gap="small" blockAlignment="center">
                <s-icon type="calendar" />
                <s-heading>RECENT ACTIVITY</s-heading>
              </s-stack>
            </s-box>
            
            <s-divider></s-divider>

            {customer.orders?.nodes?.length ? (
              <s-scroll-box border="none" padding="none">
                <s-box padding="base" minInlineSize="650px">
                  <s-stack direction="block" gap="small-100">
                    {/* Table Header with shaded background */}
                    <s-box padding="small" border="none" borderRadius="none" background="subdued">
                      <s-grid
                        gridTemplateColumns="minmax(80px, 1fr) minmax(110px, 1.2fr) minmax(90px, 1fr) minmax(100px, 1fr) minmax(90px, 1fr) minmax(60px, 0.8fr)"
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
                        <s-box padding="small" key={order.id} border="none">
                          <s-grid
                            gridTemplateColumns="minmax(80px, 1fr) minmax(110px, 1.2fr) minmax(90px, 1fr) minmax(100px, 1fr) minmax(90px, 1fr) minmax(60px, 0.8fr)"
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
                </s-box>
              </s-scroll-box>
            ) : (
              <s-box padding="base">
                <s-text color="subdued">No orders found for this customer.</s-text>
              </s-box>
            )}

            <s-divider></s-divider>
            
            <s-box padding="base">
              <s-stack direction="inline" inlineAlignment="center">
                <s-link onClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}>
                  View all orders →
                </s-link>
              </s-stack>
            </s-box>
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
