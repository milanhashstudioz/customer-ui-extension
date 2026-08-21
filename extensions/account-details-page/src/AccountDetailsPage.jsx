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
    return <s-banner tone="critical" class="account-details-error">Unable to load account details: {error}</s-banner>;
  }

  if (!customer) {
    return <s-text class="account-details-loading">Loading account details…</s-text>;
  }

  const customCss = shopify.settings?.value?.custom_css || '';

  return (
    <s-page
      heading="Account details"
      subheading={`${metafieldValue(customer.companyName)} • ${metafieldValue(customer.accountNumber)}`}
      class="custom-account-details-page"
    >
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}

      <s-stack direction="block" gap="base" class="account-details-stack">
        <DetailSection
          heading="Company information"
          class="company-info-section"
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
          class="primary-contact-section"
          rows={[
            ['Name', metafieldValue(customer.primaryContactName, `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '—')],
            ['Email', metafieldValue(customer.primaryContactEmail, customer.emailAddress?.emailAddress || '—')],
            ['Phone', metafieldValue(customer.primaryContactPhone, `${customer.phone || ''}` || '—')],
          ]}
        />

        <DetailSection
          heading="Billing contact"
          class="billing-contact-section"
          rows={[
            ['Name', metafieldValue(customer.billingContactName)],
            ['Email', metafieldValue(customer.billingContactEmail)],
            ['Phone', metafieldValue(customer.billingContactPhone)],
          ]}
        />

        <DetailSection
          heading="Tax information"
          class="tax-info-section"
          rows={[
            ['Tax exempt status', metafieldValue(customer.taxExemptStatus)],
            ['Certificate number', metafieldValue(customer.certificateNumber)],
            ['Expiration date', shortDate(metafieldValue(customer.taxExpiryDate, ''))],
          ]}
          actions={
            metafieldValue(customer.taxCertificateUrl, '') !== '' ? (
              <s-link href={customer.taxCertificateUrl.value} class="detail-action-link tax-cert-link">Upload certificate</s-link>
            ) : null
          }
        />

        <DetailSection
          heading="Credit information"
          class="credit-info-section"
          rows={[
            ['Credit limit', money(metafieldValue(customer.creditLimit, 0))],
            ['Current balance', money(metafieldValue(customer.currentBalance, 0))],
            ['Available credit', money(metafieldValue(customer.availableCredit, 0))],
          ]}
          actions={
            metafieldValue(customer.statementUrl, '') !== '' ? (
              <s-link href={customer.statementUrl.value} class="detail-action-link statement-link">View statement</s-link>
            ) : null
          }
        />

        <DetailSection
          heading="Preferences"
          class="preferences-section"
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

function DetailSection({heading, rows, actions = null, class: className = ''}) {
  return (
    <s-box border="base" borderRadius="base" padding="base" class={`detail-section ${className}`.trim()}>
      <s-stack direction="block" gap="base" class="detail-section-stack">
        <s-heading class="detail-section-heading">{heading}</s-heading>
        <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))"
          gap="base"
          class="detail-section-grid"
        >
          {rows.map(([label, value, tone]) => (
            <s-box border="base" borderRadius="base" padding="base" key={label} class="detail-card">
              <s-stack direction="block" gap="small-100" class="detail-card-stack">
                <s-text color="subdued" class="detail-card-label">{label}</s-text>
                {tone ? (
                  <s-badge tone={tone} class="detail-card-badge">{value}</s-badge>
                ) : (
                  <s-text type="strong" class="detail-card-value">{value}</s-text>
                )}
              </s-stack>
            </s-box>
          ))}
        </s-grid>
        {actions && <s-box class="detail-section-actions">{actions}</s-box>}
      </s-stack>
    </s-box>
  );
}
