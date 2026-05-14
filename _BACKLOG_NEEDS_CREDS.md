# Backlog: Needs Credentials — AIHotelRevenueManager

Apply pass 5 stubs.

## Expedia distribution
- **Endpoint:** `POST /api/integrations/expedia/sync`
- **Env:** `EXPEDIA_API_KEY`, `EXPEDIA_PARTNER_ID`
- **Wire-up TODO:** OTA_HotelRateAmountNotifRQ + OTA_HotelAvailNotifRQ; map
  rate plans + inventory.

## Booking.com Connectivity API
- **Endpoint:** `POST /api/integrations/bookingcom/sync`
- **Env:** `BOOKINGCOM_USERNAME`, `BOOKINGCOM_PASSWORD`, `BOOKINGCOM_HOTEL_ID`
- **Wire-up TODO:** XML push of rates + availability; reservation pull.

## Stripe — payment processing
- **Endpoint:** `POST /api/integrations/stripe/charge`
- **Env:** `STRIPE_SECRET_KEY`
- **Wire-up TODO:** PaymentIntent for deposit + capture on check-in.

## Loyalty (Hilton/Marriott/IHG/independent)
- **Endpoint:** `POST /api/integrations/loyalty/lookup`
- **Env:** `LOYALTY_PROVIDER`, `LOYALTY_API_KEY`
- **Wire-up TODO:** Member tier + points lookup; promotions matching.

## Backlog NOT mechanical (deferred)

- **Agentic revenue manager** — autonomy bounds NEEDS-PRODUCT-DECISION.
- **Dynamic packaging** — needs partner contract data
  (NEEDS-PRODUCT-DECISION).
- **Loyalty program rules** — NEEDS-PRODUCT-DECISION on tier/redemption math.
- **Direct booking management** — front-end booking engine + payment + tax
  rules (NEEDS-PRODUCT-DECISION).
- **Employee scheduling** — union/contract data ingestion
  (NEEDS-CREDS for HR system).
