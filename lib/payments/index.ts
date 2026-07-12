/**
 * @file index.ts
 * @purpose Öffentliche Exporte des Zahlungsmoduls.
 */

export {
  createCheckoutIntent,
  completeCheckoutIntent,
  linkAccountingPositionToCheckout,
  handleAccountingPositionPaid,
} from "./checkout-intent-service";
export {
  createPaymentIntentForCheckout,
  updatePaymentIntentStatus,
} from "./payment-intent-service";
export { fulfillSuccessfulPayment } from "./payment-fulfillment-service";
export {
  listActiveProducts,
  getProductBySlug,
  getActiveProductPrice,
  listProductsByKind,
} from "./product-catalog-service";
export {
  paymentIntentStatusToAccountingStatus,
  checkoutIntentStatusToAccountingStatus,
} from "./payment-status-mapper";
export type {
  ProductWithPrices,
  CheckoutIntentEntry,
  PaymentIntentEntry,
  CreateCheckoutIntentInput,
  FulfillmentResult,
} from "./payment-types";
export {
  PRODUCT_KIND_LABELS,
  PAYMENT_PROVIDER_LABELS,
  CHECKOUT_INTENT_STATUS_LABELS,
  PAYMENT_INTENT_STATUS_LABELS,
} from "./payment-labels";
