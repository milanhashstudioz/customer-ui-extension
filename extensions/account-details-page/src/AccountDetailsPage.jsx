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

const ACCOUNT_QUERY = `#graphql
  query AccountDetailsPageQuery {
    customer {
      firstName
      lastName
      emailAddress {
        emailAddress
      }
      ${buildCustomerMetafieldsSelection()}
    }
  }
`;

function Extension() {
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    customerAccountQuery(ACCOUNT_QUERY)
      .then(({customer}) => setCustomer(customer))
      .catch((queryError) => setError(queryError.message));
  }, []);

  if (error) {
    return <s-banner tone="critical">Unable to load account details: {error}</s-banner>;
  }

  if (!customer) {
    return <s-text>Loading account details…</s-text>;
  }

  return (
    <s-page
      heading="Account details"
      subheading={`${metafieldValue(customer.companyName)} • ${metafieldValue(customer.accountNumber)}`}
    >
      {/* <s-button
        slot="primary-action"
        onClick={() => shopify.navigation.navigate('extension://dashboard-page')}
      >
        Back to dashboard
      </s-button> */}

      <s-stack direction="block" gap="base">
        {/* Navigation Tabs */}
        {/* <s-box padding="none">
          <s-stack direction="inline" gap="base">
            <s-button onClick={() => shopify.navigation.navigate('extension://dashboard-page')}>
              Dashboard
            </s-button>
            <s-button variant="primary">Account Details</s-button>
            <s-button onClick={() => shopify.navigation.navigate('shopify:customer-account/orders')}>
              Order History
            </s-button>
            <s-button onClick={() => shopify.navigation.navigate('shopify:customer-account/profile')}>
              Address Book
            </s-button>
          </s-stack>
        </s-box> */}

        <DetailSection
          heading="Company information"
          rows={[
            ['Company name', metafieldValue(customer.companyName)],
            ['Account number', metafieldValue(customer.accountNumber)],
            ['Account status', metafieldValue(customer.accountStatus), statusTone(metafieldValue(customer.accountStatus))],
            ['Customer type', metafieldValue(customer.customerType)],
            ['Payment terms', metafieldValue(customer.paymentTerms)],
          ]}
        />

        <DetailSection
          heading="Primary contact"
          rows={[
            ['Name', metafieldValue(customer.primaryContactName, `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '—')],
            ['Email', metafieldValue(customer.primaryContactEmail, customer.emailAddress?.emailAddress || '—')],
            ['Phone', metafieldValue(customer.primaryContactPhone, `${customer.phone || ''}` || '—')],
          ]}
        />

        <DetailSection
          heading="Billing contact"
          rows={[
            ['Name', metafieldValue(customer.billingContactName)],
            ['Email', metafieldValue(customer.billingContactEmail)],
            ['Phone', metafieldValue(customer.billingContactPhone)],
          ]}
        />

        <DetailSection
          heading="Tax information"
          rows={[
            ['Tax exempt status', metafieldValue(customer.taxExemptStatus)],
            ['Certificate number', metafieldValue(customer.certificateNumber)],
            ['Expiration date', shortDate(metafieldValue(customer.taxExpiryDate, ''))],
          ]}
          actions={
            metafieldValue(customer.taxCertificateUrl, '') !== '' ? (
              <s-link href={customer.taxCertificateUrl.value}>Upload certificate</s-link>
            ) : null
          }
        />

        <DetailSection
          heading="Credit information"
          rows={[
            ['Credit limit', money(metafieldValue(customer.creditLimit, 0))],
            ['Current balance', money(metafieldValue(customer.currentBalance, 0))],
            ['Available credit', money(metafieldValue(customer.availableCredit, 0))],
          ]}
          actions={
            metafieldValue(customer.statementUrl, '') !== '' ? (
              <s-link href={customer.statementUrl.value}>View statement</s-link>
            ) : null
          }
        />

        <DetailSection
          heading="Preferences"
          rows={[
            ['Preferred warehouse', metafieldValue(customer.preferredWarehouse)],
            ['Preferred shipping method', metafieldValue(customer.preferredShippingMethod)],
            ['Email notifications', metafieldValue(customer.emailNotifications)],
            ['Marketing emails', metafieldValue(customer.marketingEmails)],
          ]}
        />
      </s-stack>
    </s-page>
  );
}

function DetailSection({heading, rows, actions = null}) {
  return (
    <s-box border="base" borderRadius="base" padding="base">
      <s-stack direction="block" gap="base">
        <s-heading>{heading}</s-heading>
        <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))"
          gap="base"
        >
          {rows.map(([label, value, tone]) => (
            <s-box border="base" borderRadius="base" padding="base" key={label}>
              <s-stack direction="block" gap="small-100">
                <s-text color="subdued">{label}</s-text>
                {tone ? (
                  <s-badge tone={tone}>{value}</s-badge>
                ) : (
                  <s-text type="strong">{value}</s-text>
                )}
              </s-stack>
            </s-box>
          ))}
        </s-grid>
        {actions}
      </s-stack>
    </s-box>
  );
}
