import { existingWebsiteSections } from "./websiteExistingSections";
import { websitePurchaseSections } from "./websitePurchaseSections";
import { websiteProviders } from "./websiteProviders";

type PrivacySection = {
  title: string;
  paragraphs: string[];
};

const replacementParagraphs: Record<string, string[]> = {
  "Who we are and what this covers": [
    "The Dad Club is currently operated by Peter Mann, trading as The Dad Club, in South Australia. In this notice, 'we', 'us' and 'our' refer to that operator.",
    "This notice covers the website, registrations of interest, facilitator applications, venue partnership enquiries, purchases, gift certificates and redemption, hat delivery, member sign-in, session bookings, cancellations and rescheduling, waitlists, operational emails, enquiries and private administration. The Dad Club mobile app has a separate privacy notice.",
    "Active members can sign in, view their session entitlements and manage eligible bookings. Where purchasing is enabled, Stripe processes checkout payments. Authorised administrators manage participation, orders, delivery records and refund reviews. Sandbox purchases do not involve real payments, but can still involve real personal information and emails.",
  ],

  "Our service providers": [
    "Vercel hosts the website and runs server code for forms, checkout requests, gift redemption, payment notifications, member requests, private administration and scheduled operational emails. Requests pass through Vercel before reaching the relevant database, authentication, payment or email service.",
    "Supabase stores registration, application, venue partnership, member, entitlement, booking, booking change, attendance, waitlist, order, gift, delivery, refund, administrator-action and email-processing records in a database configured in Sydney. Supabase Authentication manages administrator and member sign-in, gift-recipient email verification, authentication accounts and sessions.",
    "Stripe provides hosted checkout and payment processing. It processes information needed for payments, fraud prevention, refunds and related financial operations, including information supplied at checkout and associated technical information. Stripe's own privacy policy explains its handling of that information. Our website receives payment references, outcomes and relevant checkout details; we do not store full card numbers or card security codes in our database.",
    "Cloudflare Turnstile provides automated-submission checks for public forms, member login-code requests, purchases and gift redemption. Your browser connects to Cloudflare, which processes technical signals used for verification. Our server sends the verification token to Cloudflare without adding the personal details entered in the form.",
    "Resend sends operational emails, including registration confirmations, application and venue acknowledgements, booking messages, reminders, availability alerts, purchase confirmations and gift certificates. Supabase Authentication also uses our Resend connection to deliver email verification codes. Resend processes recipient addresses, message content and technical delivery information.",
    "Interest-registration, facilitator acknowledgement and venue enquiry acknowledgement email requests exclude names, phone numbers, locations, stages of fatherhood, optional messages and application answers. Venue acknowledgements also exclude venue names and room details. These exclusions apply to those acknowledgement workflows; purchase confirmations and gift certificates can include purchaser names and purchase details.",
    "Booking messages include relevant session details and references. Purchase confirmations include the applicable purchase information, and gift-certificate emails include the redemption code. These operational messages do not include app check-ins or information about other members. Verification emails contain the one-time code and verification instructions.",
    "Microsoft 365 handles messages sent to and from hello@thedadclub.com.au, including operational replies, recruitment and venue correspondence, purchase enquiries and requests for assistance.",
    "Postal and delivery providers receive the recipient and address information needed to deliver hats. Relevant delivery references may be retained with the order.",
  ],

  "Changes to this notice": [
    "This version was updated on 13 November 2026 to explain Stripe checkout, purchases, gift certificates and redemption, hat delivery, purchase emails, refund records and administrator reviews, alongside the existing website and member services.",
    "We will update this notice when our services, operator or information-handling practices change.",
  ],
};

const additionalParagraphs: Record<string, string[]> = {
  "Member records and sign-in": [
    "A completed program purchase or verified gift redemption can also create a member record and the included session entitlements. We record the program package and its connection to the relevant order or gift. Existing memberships are not automatically overwritten by a new purchase or redemption.",
    "Payment alone does not verify ownership of an email address. Member access still requires email verification and an active member record.",
  ],

  "Enquiries and technical information": [
    "Purchases require the purchaser and payment information needed for checkout. Hat delivery requires an appropriate delivery address. Gift redemption requires the gift details, recipient information and email verification. Without the required information, we cannot complete the relevant purchase, redemption or delivery.",
  ],

  "Access and disclosure": [
    "Authorised administrators can view order, gift, delivery, refund and related email records, together with recorded dispatch and refund-review actions. Member sign-in does not grant access to these private administration tools.",
    "Buying a gift does not give the purchaser access to the recipient's member account, bookings or attendance. Gift recipients are not given access to the purchaser's payment credentials. A certificate forwarded by its purchaser may contain purchaser and purchase details, as described in the gift section.",
    "Order, gift, address, refund and administrator-action records are not published on the public website.",
  ],

  "Overseas processing": [
    "Stripe and its financial and service partners also operate internationally. Payment processing and related security, support and financial operations may involve overseas processing. Stripe's privacy policy provides further information.",
  ],

  "Cookies, referrals and email tracking": [
    "Gift redemption uses a short-lived encrypted cookie to carry the pending redemption details between requesting and entering an email verification code. The gift section explains its contents and expiry. Authentication cookies separately maintain signed-in access.",
    "Stripe's hosted checkout has its own privacy and cookie practices, including payment security and fraud prevention. Our statement about website advertising trackers does not describe every technical mechanism used by Stripe on its checkout.",
    "Purchase-email records distinguish pending, accepted, not-confirmed and skipped outcomes. An uncertain sending attempt is not automatically treated as proof of failure or resent. Email status is separate from payment, fulfilment, gift redemption, delivery and refund-review status.",
  ],

  Security: [
    "Payment notifications are checked using Stripe's webhook signature and relevant payment information retrieved from Stripe before fulfilment. Database controls help prevent repeated notifications from granting the same purchase again.",
    "Gift redemption checks the gift, order eligibility and verified recipient account. Pending redemption details are encrypted, and gift-code fingerprints are used for matching. Keep certificates and verification codes private.",
    "Dispatch and refund-review actions require administrator authorisation. Recorded actions include the responsible administrator and time. Refund reviews check the recorded refund state to help prevent a decision based on outdated information.",
  ],

  "Retention and deletion": [
    "Order, payment-reference, gift, redemption, delivery, refund and administrator-action records are retained while needed to provide purchased services, manage remaining access, handle delivery and enquiries, prevent duplicate processing and meet relevant legal, accounting and dispute-handling requirements. We review information when it is no longer needed; these workflows do not currently provide automatic order-record deletion.",
    "Refunding an order, redeeming a gift or recording dispatch does not automatically delete the associated information. Historical review and dispatch records may be needed to explain decisions and actions.",
    "Purchase emails and certificates may remain in email systems or in copies retained or forwarded by their recipients. Deleting a website record does not recall an email, certificate or parcel, or automatically delete records held separately by Stripe and other providers.",
  ],

  "Your choices, access and corrections": [
    "Contact hello@thedadclub.com.au for help accessing or correcting purchase, gift or delivery information. Tell us promptly about an incorrect delivery address; changes may not be possible after a parcel has been handed to a delivery provider.",
    "We may verify whether a request comes from the purchaser, gift recipient or another authorised person before disclosing or changing information. Purchasing a gift does not authorise access to the recipient's private member information.",
    "A privacy or deletion request is separate from a request to cancel participation or obtain a refund. Contact us about the particular outcome you need so we can explain the relevant process and any records we must retain.",
    "Purchase confirmations, gift certificates and requested gift-verification messages are operational communications. Purchasing or redeeming a gift does not subscribe you to unrelated marketing.",
  ],

  "App information and research": [
    "Purchasing, gifting, redeeming a gift or requesting a refund also does not enrol anyone in research or give the website access to information stored locally in the app.",
  ],
};

function updateSection(section: PrivacySection): PrivacySection {
  const replacement = Object.prototype.hasOwnProperty.call(
    replacementParagraphs,
    section.title,
  )
    ? replacementParagraphs[section.title]
    : undefined;

  const additions = Object.prototype.hasOwnProperty.call(
    additionalParagraphs,
    section.title,
  )
    ? additionalParagraphs[section.title]
    : [];

  return {
    title: section.title,
    paragraphs: [
      ...(replacement ?? section.paragraphs),
      ...additions,
    ],
  };
}

export const websitePrivacySections: PrivacySection[] =
  existingWebsiteSections.flatMap((section) => {
    const updated = updateSection(section);

    if (section.title === "Member records and sign-in") {
      return [...websitePurchaseSections, updated];
    }

    return [updated];
  });

export const websitePrivacyProviders = [
  ...websiteProviders,
  {
    label: "Stripe Privacy Policy",
    href: "https://stripe.com/au/privacy",
  },
];