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

  const customCss = shopify.settings?.value?.custom_css || '';

  return (
    <s-page
      heading="MY ACCOUNT"
      subheading={`Welcome back, ${customer.firstName || 'customer'}! • Account #: ${metafieldValue(customer.accountNumber)}`}
      class="custom-dashboard-page"
    >
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      {/* Account Type dropdown in top right action area */}
      <s-box slot="primary-action" padding="none" class="dashboard-action-box">
        <s-stack direction="inline" gap="small" blockAlignment="center" class="dashboard-action-stack">
          <s-text size="small" type="strong" color="subdued" class="dashboard-action-label">ACCOUNT TYPE</s-text>
          <s-select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
            class="dashboard-action-select"
          >
            <s-option value="Retail" class="dashboard-action-option">Retail</s-option>
            <s-option value="Commercial" class="dashboard-action-option">Commercial</s-option>
          </s-select>
        </s-stack>
      </s-box>

      <s-stack direction="block" gap="large" class="dashboard-main-stack">
        {/* Account Summary Section */}
        <s-box border="base" borderRadius="base" padding="none" class="dashboard-summary-section">
          <s-stack direction="block" gap="none" class="dashboard-summary-stack">
            {/* Header with padding */}
            <s-box padding="base" class="dashboard-summary-header">
              <s-stack direction="inline" gap="small" blockAlignment="center" class="dashboard-summary-header-stack">
                <s-icon type="profile" />
                <s-heading class="dashboard-summary-heading">ACCOUNT SUMMARY</s-heading>
              </s-stack>
            </s-box>
            
            <s-divider></s-divider>

            {/* Top Section with scroll box for responsiveness */}
            <s-scroll-box border="none" padding="none" class="dashboard-summary-scroll-top">
              <s-box padding="base" minInlineSize="500px" class="dashboard-summary-box-top">
                <s-grid
                  gridTemplateColumns="1fr auto 1fr auto 1fr"
                  gap="base"
                  blockAlignment="center"
                  class="dashboard-summary-grid-top"
                >
                  {/* Column 1: Status & Available Credit */}
                  <s-stack direction="block" gap="base" class="dashboard-summary-col-1">
                    <s-stack direction="block" gap="small-100" class="dashboard-status-stack">
                      <s-text color="subdued" size="small" type="strong" class="dashboard-status-label">ACCOUNT STATUS</s-text>
                      <s-stack direction="inline" gap="small-100" blockAlignment="center" class="dashboard-status-val-stack">
                        <s-text type="strong" color="success" class="dashboard-status-dot">●</s-text>
                        <s-text type="strong" color="success" class="dashboard-status-text">{metafieldValue(customer.accountStatus)}</s-text>
                      </s-stack>
                    </s-stack>
                    <s-stack direction="block" gap="small-100" class="dashboard-credit-card available-credit-card">
                      <s-text color="subdued" size="small" type="strong" class="dashboard-credit-label">AVAILABLE CREDIT</s-text>
                      <s-text type="strong" size="large" class="dashboard-credit-value">{money(metafieldValue(customer.availableCredit))}</s-text>
                    </s-stack>
                  </s-stack>

                  {/* Vertical Divider */}
                  <s-divider direction="block" />

                  {/* Column 2: Credit Limit */}
                  <s-stack direction="block" gap="small-100" class="dashboard-summary-col-2 dashboard-credit-card credit-limit-card">
                    <s-text color="subdued" size="small" type="strong" class="dashboard-credit-label">CREDIT LIMIT</s-text>
                    <s-text type="strong" size="large" class="dashboard-credit-value">{money(metafieldValue(customer.creditLimit))}</s-text>
                  </s-stack>

                  {/* Vertical Divider */}
                  <s-divider direction="block" />

                  {/* Column 3: Current Balance */}
                  <s-stack direction="block" gap="small-100" class="dashboard-summary-col-3 dashboard-credit-card current-balance-card">
                    <s-text color="subdued" size="small" type="strong" class="dashboard-credit-label">CURRENT BALANCE</s-text>
                    <s-text type="strong" size="large" class="dashboard-credit-value">{money(metafieldValue(customer.currentBalance))}</s-text>
                  </s-stack>
                </s-grid>
              </s-box>
            </s-scroll-box>

            <s-divider></s-divider>

            {/* Bottom Section with scroll box for responsiveness */}
            <s-scroll-box border="none" padding="none" class="dashboard-summary-scroll-bottom">
              <s-box padding="base" minInlineSize="500px" class="dashboard-summary-box-bottom">
                <s-grid
                  gridTemplateColumns="1fr auto 1fr auto 1fr"
                  gap="base"
                  blockAlignment="center"
                  class="dashboard-summary-grid-bottom"
                >
                  {/* Column 1: Open Orders */}
                  <s-stack direction="block" gap="small-100" inlineAlignment="start" class="dashboard-metric-stack open-orders-stack">
                    <s-text color="subdued" size="small" type="strong" class="dashboard-metric-label">OPEN ORDERS</s-text>
                    <s-text type="strong" size="large" class="dashboard-metric-value">{String(openOrdersCount)}</s-text>
                  </s-stack>

                  {/* Vertical Divider */}
                  <s-divider direction="block" />

                  {/* Column 2: Backordered Items */}
                  <s-stack direction="block" gap="small-100" inlineAlignment="start" class="dashboard-metric-stack backorder-items-stack">
                    <s-text color="subdued" size="small" type="strong" class="dashboard-metric-label">BACKORDERED ITEMS</s-text>
                    <s-text type="strong" size="large" class="dashboard-metric-value">{String(backorderedItemsCount)}</s-text>
                  </s-stack>

                  {/* Vertical Divider */}
                  <s-divider direction="block" />

                  {/* Column 3: Open Returns */}
                  <s-stack direction="block" gap="small-100" inlineAlignment="start" class="dashboard-metric-stack open-returns-stack">
                    <s-text color="subdued" size="small" type="strong" class="dashboard-metric-label">OPEN RETURNS (RMAs)</s-text>
                    <s-text type="strong" size="large" class="dashboard-metric-value">{String(openReturnsCount)}</s-text>
                  </s-stack>
                </s-grid>
              </s-box>
            </s-scroll-box>
          </s-stack>
        </s-box>

        {/* Recent Activity Section */}
        <s-box border="base" borderRadius="base" padding="none" class="dashboard-activity-section">
          <s-stack direction="block" gap="none" class="dashboard-activity-stack">
            {/* Header with padding */}
            <s-box padding="base" class="dashboard-activity-header">
              <s-stack direction="inline" gap="small" blockAlignment="center" class="dashboard-activity-header-stack">
                <s-icon type="calendar" />
                <s-heading class="dashboard-activity-heading">RECENT ACTIVITY</s-heading>
              </s-stack>
            </s-box>
            
            <s-divider></s-divider>

            {customer.orders?.nodes?.length ? (
              <s-scroll-box border="none" padding="none" class="dashboard-activity-scroll">
                <s-box padding="base" minInlineSize="650px" class="dashboard-activity-box">
                  <s-stack direction="block" gap="small-100" class="dashboard-activity-rows-stack">
                    {/* Table Header with shaded background */}
                    <s-box padding="small" border="none" borderRadius="none" background="subdued" class="dashboard-table-header">
                      <s-grid
                        gridTemplateColumns="minmax(80px, 1fr) minmax(110px, 1.2fr) minmax(90px, 1fr) minmax(100px, 1fr) minmax(90px, 1fr) minmax(60px, 0.8fr)"
                        gap="small"
                        class="dashboard-table-header-grid"
                      >
                        <s-text type="strong" color="subdued" class="dashboard-table-th">ORDER #</s-text>
                        <s-text type="strong" color="subdued" class="dashboard-table-th">ORDER DATE</s-text>
                        <s-text type="strong" color="subdued" class="dashboard-table-th">PO NUMBER</s-text>
                        <s-text type="strong" color="subdued" class="dashboard-table-th">STATUS</s-text>
                        <s-text type="strong" color="subdued" class="dashboard-table-th">TOTAL</s-text>
                        <s-text type="strong" color="subdued" class="dashboard-table-th">ACTION</s-text>
                      </s-grid>
                    </s-box>
                    
                    <s-divider></s-divider>

                    {/* Table Rows */}
                    {customer.orders.nodes.slice(0, 5).map((order) => {
                      const numericId = order.id.split('/').pop();
                      return (
                        <s-box padding="small" key={order.id} border="none" class="dashboard-table-row">
                          <s-grid
                            gridTemplateColumns="minmax(80px, 1fr) minmax(110px, 1.2fr) minmax(90px, 1fr) minmax(100px, 1fr) minmax(90px, 1fr) minmax(60px, 0.8fr)"
                            gap="small"
                            blockAlignment="center"
                            class="dashboard-table-row-grid"
                          >
                            <s-text type="strong" class="dashboard-table-cell order-name-cell">{order.name}</s-text>
                            <s-text class="dashboard-table-cell order-date-cell">{shortDate(order.processedAt)}</s-text>
                            <s-text class="dashboard-table-cell order-po-cell">{getPoNumber(order)}</s-text>
                            <s-badge tone={statusTone(order.fulfillmentStatus || order.financialStatus)} class="dashboard-table-badge">
                              {order.fulfillmentStatus || order.financialStatus || 'Processing'}
                            </s-badge>
                            <s-text type="strong" class="dashboard-table-cell order-total-cell">
                              {money(order.totalPrice?.amount, order.totalPrice?.currencyCode)}
                            </s-text>
                            <s-link onClick={() => shopify.navigation.navigate(`shopify:customer-account/orders/${numericId}`)} class="dashboard-table-link">
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
              <s-box padding="base" class="dashboard-empty-activity">
                <s-text color="subdued" class="dashboard-empty-text">No orders found for this customer.</s-text>
              </s-box>
            )}

            <s-divider></s-divider>
            
            <s-box padding="base" class="dashboard-footer-box">
              <s-stack direction="inline" inlineAlignment="center" class="dashboard-footer-stack">
                <s-link onClick={() => shopify.navigation.navigate('shopify:customer-account/orders')} class="dashboard-footer-link">
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
    <s-box border="base" borderRadius="base" padding="base" class="custom-metric-card">
      <s-stack direction="block" gap="small-100" class="custom-metric-card-stack">
        <s-text color="subdued" size="small" type="strong" class="custom-metric-card-label">{label}</s-text>
        {tone ? (
          <s-badge tone={tone} class="custom-metric-card-badge">{value}</s-badge>
        ) : (
          <s-text type="strong" size="large" class="custom-metric-card-value">{value}</s-text>
        )}
        {linkText && onLinkClick && (
          <s-link onClick={onLinkClick} class="custom-metric-card-link">
            {linkText} →
          </s-link>
        )}
      </s-stack>
    </s-box>
  );
}
