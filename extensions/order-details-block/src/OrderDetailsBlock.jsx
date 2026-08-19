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

  return (
    <s-box border="base" borderRadius="base" padding="base">
      <s-stack direction="block" gap="base">
        <s-heading>Order details</s-heading>

        <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))"
          gap="base"
        >
          <InfoCard label="Order number" value={order.name} />
          <InfoCard label="Confirmation number" value={order.confirmationNumber || '—'} />
          <InfoCard label="Processed date" value={shortDate(order.processedAt)} />
          <InfoCard label="Order status" value={orderStatus} tone={statusTone(orderStatus)} />
        </s-grid>

        <s-divider></s-divider>

        <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))"
          gap="base"
        >
          <InfoCard
            label="Account number"
            value={metafieldValue(customer.accountNumber)}
          />
          <InfoCard
            label="Payment terms"
            value={metafieldValue(customer.paymentTerms)}
          />
          <InfoCard
            label="Current balance"
            value={money(metafieldValue(customer.currentBalance, 0))}
          />
          <InfoCard
            label="Available credit"
            value={money(metafieldValue(customer.availableCredit, 0))}
          />
        </s-grid>

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
            Back to orders
          </s-button>
        </s-stack>
      </s-stack>
    </s-box>
  );
}

function InfoCard({label, value, tone}) {
  return (
    <s-box border="base" borderRadius="base" padding="base">
      <s-stack direction="block" gap="small-100">
        <s-text color="subdued">{label}</s-text>
        {tone ? <s-badge tone={tone}>{value}</s-badge> : <s-text type="strong">{value}</s-text>}
      </s-stack>
    </s-box>
  );
}
