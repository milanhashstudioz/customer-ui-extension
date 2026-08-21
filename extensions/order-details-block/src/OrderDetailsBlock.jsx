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
} from '../../shared/customer-account-data';

export default function extension() {
  render(<Extension />, document.body);
}

const ORDER_CONTEXT_QUERY = `#graphql
  query OrderContext {
    customer {
      ${buildCustomerMetafieldsSelection()}
    }
  }
`;

function Extension() {
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState('');
  const order = shopify.order?.value;

  useEffect(() => {
    customerAccountQuery(ORDER_CONTEXT_QUERY)
      .then(({customer}) => setCustomer(customer))
      .catch((queryError) => setError(queryError.message));
  }, []);

  if (!order) {
    return null;
  }

  if (error) {
    return <s-banner tone="critical">Unable to load order details block.</s-banner>;
  }

  if (!customer) {
    return <s-text>Loading order details…</s-text>;
  }

  const orderStatus = order.cancelledAt ? 'Cancelled' : 'Processing';

  const customCss = shopify.settings?.value?.custom_css || '';

  return (
    <s-box border="base" borderRadius="base" padding="base" class="custom-order-details-block">
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      <s-stack direction="block" gap="base" class="order-details-stack">
        <s-heading class="order-details-heading">Order details</s-heading>

        <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))"
          gap="base"
          class="order-details-grid order-details-grid-primary"
        >
          <InfoCard label="Order number" value={order.name} class="order-number-card" />
          <InfoCard label="Confirmation number" value={order.confirmationNumber || '—'} class="confirmation-number-card" />
          <InfoCard label="Processed date" value={shortDate(order.processedAt)} class="processed-date-card" />
          <InfoCard label="Order status" value={orderStatus} tone={statusTone(orderStatus)} class="order-status-card" />
        </s-grid>

        <s-divider class="order-details-divider"></s-divider>

        <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))"
          gap="base"
          class="order-details-grid order-details-grid-account"
        >
          <InfoCard
            label="Account number"
            value={metafieldValue(customer.accountNumber)}
            class="account-number-card"
          />
          <InfoCard
            label="Payment terms"
            value={metafieldValue(customer.paymentTerms)}
            class="payment-terms-card"
          />
          <InfoCard
            label="Current balance"
            value={money(metafieldValue(customer.currentBalance, 0))}
            class="current-balance-card"
          />
          <InfoCard
            label="Available credit"
            value={money(metafieldValue(customer.availableCredit, 0))}
            class="available-credit-card"
          />
        </s-grid>

        <s-stack direction="inline" gap="base" class="order-details-actions-stack">
          <s-button
            variant="primary"
            onClick={() => shopify.navigation.navigate('extension://account-details-page')}
            class="order-details-btn view-account-btn"
          >
            View account details
          </s-button>
          <s-button
            onClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}
            class="order-details-btn back-orders-btn"
          >
            Back to orders
          </s-button>
        </s-stack>
      </s-stack>
    </s-box>
  );
}

function InfoCard({label, value, tone, class: className = ''}) {
  return (
    <s-box border="base" borderRadius="base" padding="base" class={`custom-info-card ${className}`.trim()}>
      <s-stack direction="block" gap="small-100" class="custom-info-card-stack">
        <s-text color="subdued" class="custom-info-card-label">{label}</s-text>
        {tone ? (
          <s-badge tone={tone} class="custom-info-card-badge">{value}</s-badge>
        ) : (
          <s-text type="strong" class="custom-info-card-value">{value}</s-text>
        )}
      </s-stack>
    </s-box>
  );
}
