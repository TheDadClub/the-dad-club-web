export const websitePurchaseSections = [
  {
    title: "Purchases and payment processing",
    paragraphs: [
      "When you start a purchase, we collect your name, email address and chosen product or package, including whether a program is for yourself or a gift. We create an order reference and record the expected amount, currency, creation time and processing status.",
      "Stripe hosts checkout and processes payment details. We provide Stripe with your email address, selected product, price and technical order reference. Stripe may collect payment, billing, delivery, device and security information under its own privacy practices.",
      "Our website records Stripe checkout and payment references, payment amounts, payment confirmation times and processing outcomes. We do not store full payment-card numbers or card security codes in our website database.",
      "Starting checkout can create an order record even if you do not complete payment. We use order and payment records to provide purchases, reconcile transactions, investigate problems and prevent repeated payment notifications from granting duplicate access.",
      "Purchasing or redeeming a gift does not subscribe you to unrelated marketing. Purchase and account messages are operational communications.",
    ],
  },
  {
    title: "Program access after purchase",
    paragraphs: [
      "After a verified program payment, we use the purchaser's name and email address to create the corresponding member record and session entitlements. Before Baby includes five session types; After Baby includes the three post-birth session types.",
      "Paying does not by itself verify ownership of an email address. Access to an own-program membership requires email verification through member sign-in. We link purchase and member records so authorised administrators can investigate access and payment enquiries.",
      "An existing membership is not automatically overwritten or given a fresh set of entitlements by another purchase. Conflicting or uncertain cases may be held for administrator review.",
      "Program purchases provide access to included session types, rather than automatically reserving particular dates. Session bookings, attendance and operational booking emails are managed separately.",
    ],
  },
  {
    title: "Gift certificates and redemption",
    paragraphs: [
      "For a gift purchase, we collect the buyer's details rather than asking for the recipient's personal information. We send the certificate to the buyer, who chooses when and how to give it to the recipient.",
      "The certificate includes the purchaser's greeting name, package, amount paid, order reference and redemption code. Someone receiving the full certificate can see those details. Keep redemption codes private until you intend to give the gift.",
      "We store a gift identifier, the linked order and package, a protected code fingerprint, creation time and redemption status. The order database does not store the redeemable gift code as plain text.",
      "When a recipient redeems a gift, we collect their name, email address and Australian hat-delivery address. We verify their email before creating and linking their membership. We record the redemption time and identifiers linking the gift, order, verified account and member.",
      "During email verification, an encrypted, short-lived browser cookie holds the pending redemption details, including the name, email, delivery address and gift-code fingerprint. It normally expires after 15 minutes and is cleared when redemption completes or the recipient restarts the process.",
      "A gift buyer does not automatically receive access to the recipient's account, bookings, attendance or personal member details. Buying a gift does not cause us to contact the recipient before they begin redemption.",
      "A used gift cannot create another membership. Refunded, held or conflicting gifts may be blocked or require administrator assistance. An existing member's account is not automatically replaced when they try to redeem a gift.",
    ],
  },
  {
    title: "Hat delivery and dispatch records",
    paragraphs: [
      "For a standalone hat or own-program purchase, Stripe checkout collects delivery details for the included hat. For gifts, the recipient provides these details when redeeming.",
      "We store the delivery recipient's name and postal address with the order. We use these details to arrange delivery and provide the information needed by the delivery provider handling the parcel.",
      "Authorised administrators can view delivery details, place a hat on hold and record dispatch. Dispatch records include the order, administrator identifier, time and any tracking reference or delivery note entered.",
      "Dispatch records are separate from payment and membership status. Recording dispatch does not currently send an automated dispatch email. Please avoid including sensitive personal or health information in delivery instructions or correspondence.",
    ],
  },
  {
    title: "Refund records and administrator reviews",
    paragraphs: [
      "Refunds are initiated manually in Stripe. Our server receives verified refund notifications and records the Stripe refund, charge and payment references, amount, currency, refund status and relevant times.",
      "Pending, successful, failed and cancelled refunds are distinguished. Only successful refunds contribute to the website's recorded refunded total. Technical notification records help prevent duplicate processing and manage updates.",
      "A refund can place an order and undelivered hat on hold for review. A fully refunded unused gift is blocked from redemption. Existing memberships and bookings are not automatically cancelled by refund processing.",
      "Authorised administrators can record a review outcome, membership decision, hat decision and explanatory notes. We retain the responsible administrator's identifier, time, refund snapshot and relevant before-and-after information in an action history.",
      "A review can record that access is retained by agreement or has been removed manually, and whether an eligible remaining order may continue. A later refund update can require another review. These records help us administer the agreement and investigate enquiries; they do not contain app check-ins.",
    ],
  },
  {
    title: "Purchase confirmations and gift-certificate emails",
    paragraphs: [
      "After preparing a paid purchase, we attempt to send a confirmation to the buyer's recorded email address. Own-program messages explain sign-in and session booking; hat messages confirm the order; gift messages include the certificate and redemption code.",
      "These emails include the buyer's name, package or product, amount and order reference. Gift emails contain the redeemable code. Purchase confirmation templates do not include delivery addresses, due or birth dates, app check-ins or other members' details.",
      "We record the sending status and, where confirmed, the provider's message identifier and acceptance time. A technical order reference helps prevent repeated notifications from sending duplicate confirmation emails.",
      "An uncertain or interrupted send is not automatically resent by this workflow. A confirmed order remains recorded if its email cannot be confirmed. Contact us for assistance rather than making another purchase.",
      "Provider acceptance does not guarantee inbox delivery. An email already being processed cannot be recalled by a later refund or account change. Recording a refund review does not currently send a separate review email.",
    ],
  },
  {
    title: "Sandbox purchases and test records",
    paragraphs: [
      "Sandbox transactions do not move real money, but names, email addresses, delivery details, authentication records and operational emails used during testing may still be processed by our website and its providers.",
      "Sandbox orders are labelled separately from live transactions. A test transaction may create a corresponding test membership or gift record and send an actual email; a sandbox label does not make personal information anonymous.",
    ],
  },
];