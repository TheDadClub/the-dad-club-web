import PrivacyDocument from "../../../components/PrivacyDocument";

const sections = [
  {
    title: "Who we are and what this covers",
    paragraphs: [
      "The Dad Club is currently operated by Peter Mann, trading as The Dad Club, in South Australia. In this notice, 'we', 'us' and 'our' refer to that operator.",
      "This notice covers the website at www.thedadclub.com.au, registrations of interest and related enquiries. The Dad Club mobile app has a separate privacy notice.",
      "The current website does not provide bookings, payments or member accounts. We will update this notice when new features change how personal information is handled.",
    ],
  },
  {
    title: "Information we collect",
    paragraphs: [
      "When you register your interest, we collect your name, email address, suburb or town, stage of fatherhood and any optional message you provide.",
      "We also record a registration identifier, creation time, your agreement to be contacted, the version of the consent wording and the confirmation email status.",
      "If you email us, we receive your email address and the information you include. Please avoid providing sensitive personal or health information through the registration form.",
      "Our hosting and security providers process technical information associated with website requests, such as IP addresses, browser and device information, request times and security or error events.",
    ],
  },
  {
    title: "Why we collect it",
    paragraphs: [
      "We use registration details to manage your interest, send a confirmation, respond to enquiries and contact you about upcoming Dad Club programs.",
      "Your suburb or town helps us understand where people would like to attend. Your stage of fatherhood helps us identify potentially relevant program options.",
      "Technical information supports website delivery, troubleshooting and protection against misuse.",
      "The form identifies required fields. Without those details and your agreement to contact, we cannot process the registration. You can browse the website without registering, and the message field is optional.",
    ],
  },
  {
    title: "Our service providers",
    paragraphs: [
      "Vercel hosts the website and runs the server code that processes registrations. Form submissions pass through Vercel before reaching our database.",
      "Supabase stores registration information in a database configured in the Sydney region.",
      "Cloudflare Turnstile provides the form's automated-submission check. Your browser connects to Cloudflare, which processes technical signals used for verification. Our server sends the verification token to Cloudflare, without adding the personal details entered in the form.",
      "Resend sends registration confirmation emails. Our current integration provides your email address, the confirmation message and a technical registration identifier. It does not include your name, location, stage of fatherhood or optional message in the email request.",
      "Microsoft 365 handles messages sent to and from hello@thedadclub.com.au, including replies to confirmation emails.",
    ],
  },
  {
    title: "Access and disclosure",
    paragraphs: [
      "Registration details are available to the operator and people authorised to manage enquiries and programs. The database is configured to prevent public website visitors from directly reading registration records.",
      "Service providers process information needed to deliver their services. We may also disclose information where required by law or to obtain professional assistance necessary to manage a privacy or security matter.",
      "We do not sell registration information or publish it on the website.",
    ],
  },
  {
    title: "Overseas processing",
    paragraphs: [
      "The registration database is configured in Sydney, but this is not a promise that all information remains in Australia.",
      "Our providers operate internationally. Hosting, email delivery, security checks, support and operational systems may involve processing in the United States and other countries used by those providers and their subprocessors.",
      "Provider locations depend on the service and configuration and can change. The privacy and subprocessor information linked below provides further details. Contact us if you need information about a particular service.",
    ],
  },
  {
    title: "Cookies and email tracking",
    paragraphs: [
      "We have not added advertising trackers or audience analytics to the current website. Hosting and security services may use browser storage or similar technical mechanisms needed to operate and protect the service.",
      "Open and click tracking have not been enabled for our Resend confirmation emails. We do not use those confirmations to measure whether you opened the message or clicked a link.",
      "Email delivery information, such as acceptance, delivery, delay, bounce or complaint events, may still be processed. A database status of 'sent' means the email provider accepted the message, not that it necessarily reached your inbox.",
    ],
  },
  {
    title: "Security",
    paragraphs: [
      "We use HTTPS for website connections, restrict database access and keep administrative credentials on the server rather than in public browser code.",
      "These measures reduce risk, but no internet service or storage system can guarantee absolute security. Please do not use the registration form to send confidential clinical information.",
    ],
  },
  {
    title: "Retention and deletion",
    paragraphs: [
      "We review interest registrations when they reach 12 months old and delete records no longer needed for the purpose for which they were collected. This is a review process, not an automatic deletion feature.",
      "Information may be retained longer where there is an ongoing enquiry or another necessary reason, including a legal obligation. We do not retain information indefinitely simply because it was collected.",
      "Email correspondence, provider logs and backups may have separate retention periods. Deleting a database registration does not instantly remove all copies from email systems or backups.",
      "You can ask us to remove your registration earlier. We will explain any information we need to retain and any relevant limitations.",
    ],
  },
  {
    title: "Your choices, access and corrections",
    paragraphs: [
      "You can withdraw your interest, ask us to stop program contact, request access to your information, correct inaccurate details or request deletion by emailing hello@thedadclub.com.au.",
      "You can also reply to a program email to withdraw from further updates. Registering interest does not book a session or commit you to payment.",
      "We may need to verify your identity before providing or changing information. We will respond within a reasonable time and explain if we cannot fulfil a request.",
    ],
  },
  {
    title: "Privacy concerns and complaints",
    paragraphs: [
      "Email hello@thedadclub.com.au with a description of your concern. Please include enough information for us to investigate without adding unnecessary sensitive details.",
      "We will acknowledge the concern, investigate and aim to provide a substantive response within 30 days. If more time is needed, we will explain why.",
      "If you remain dissatisfied, you can seek guidance from the Office of the Australian Information Commissioner at www.oaic.gov.au about available complaint options and whether the matter falls within its jurisdiction.",
    ],
  },
  {
    title: "App information and research",
    paragraphs: [
      "The website registration process does not access profiles, journey dates, check-ins or saved cards stored locally in The Dad Club app.",
      "Registering interest does not enrol you in research. Any future research participation would require a separate process, appropriate ethics review, clear information and explicit informed consent.",
    ],
  },
  {
    title: "Changes to this notice",
    paragraphs: [
      "We will update this notice when our services, operator or information-handling practices change. The revision date appears at the top of this page.",
    ],
  },
];

const providers = [
  {
    label: "Vercel Privacy Notice",
    href: "https://vercel.com/legal/privacy-notice",
  },
  {
    label: "Supabase Privacy Policy",
    href: "https://supabase.com/privacy",
  },
  {
    label: "Cloudflare Privacy Policy",
    href: "https://www.cloudflare.com/privacypolicy/",
  },
  {
    label: "Resend Privacy Policy",
    href: "https://resend.com/legal/privacy-policy",
  },
  {
    label: "Resend Subprocessors",
    href: "https://resend.com/legal/subprocessors",
  },
  {
    label: "Microsoft Privacy Statement",
    href: "https://www.microsoft.com/en-us/privacy/privacystatement",
  },
];

export default function WebsitePrivacyPage() {
  return (
    <PrivacyDocument
      title="WEBSITE PRIVACY"
      introduction="How we handle your information when you visit the website, register your interest or contact The Dad Club."
      sections={sections}
      providers={providers}
    />
  );
}