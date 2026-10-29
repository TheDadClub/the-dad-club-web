import PrivacyDocument from "../../../components/PrivacyDocument";

const sections = [
  {
    title: "Who we are and what this covers",
    paragraphs: [
      "The Dad Club is currently operated by Peter Mann, trading as The Dad Club, in South Australia. In this notice, 'we', 'us' and 'our' refer to that operator.",
      "This notice covers www.thedadclub.com.au, registrations of interest, facilitator applications, related enquiries and information managed through our private administration tools. The Dad Club mobile app has a separate privacy notice.",
      "The public website currently accepts expressions of interest rather than paid session bookings. Our private administration tools allow authorised administrators to manage members, session dates, entitlements and bookings. Public payments and participant accounts are not yet available.",
    ],
  },
  {
    title: "Interest registrations",
    paragraphs: [
      "When you register your interest in the program, we collect your name, email address, suburb or town, stage of fatherhood and any optional message you provide.",
      "We also record a registration identifier, creation time, your agreement to be contacted, the version of the consent wording and the confirmation email status.",
      "We use these details to manage your interest, send a confirmation, respond to enquiries and contact you about upcoming programs. Your location and stage of fatherhood help us understand demand and identify potentially relevant options.",
      "Registering interest does not book a session or commit you to payment.",
    ],
  },
  {
    title: "Facilitator applications",
    paragraphs: [
      "When you express interest in facilitation, we collect your name, email address, phone number, location, preferred delivery modes, general availability, relevant experience and motivation. You can also provide preferred service areas and a summary of qualifications or training.",
      "We record an application identifier, submission time, your agreement to recruitment contact, the consent wording version, application review information and an application review status.",
      "For new applications, we also record the acknowledgement email sending status and, where confirmed, the time our server recorded the email provider's acceptance. These records help administrators identify sending attempts needing review.",
      "We use application information to assess suitability, manage recruitment, send an acknowledgement and contact you about your application. This consent does not subscribe you to general program marketing.",
      "The initial form does not request bank details, identity documents, screening documents or personal health information. Please do not include these in your answers. If further information is needed, we will explain the purpose and appropriate collection process separately.",
      "Submitting an application does not create a facilitator account, approve you to deliver sessions or guarantee employment or work.",
      "We keep one initial application per email address. A repeat submission does not overwrite the existing application or trigger another automated acknowledgement email. Contact us to update your information.",
      "After saving a new application, we attempt to send an automated acknowledgement to the email address provided. The application remains saved if email sending fails. An on-page acknowledgement does not guarantee email delivery.",
    ],
  },
  {
    title: "Member and booking administration",
    paragraphs: [
      "Authorised administrators can record member names, email addresses, optional phone numbers and locations, membership status, and due or birth dates provided by members.",
      "We also manage session entitlements, bookings, cancellations and recorded attendance. Administrative records may include creation and update times and identifiers for the administrator responsible.",
      "We use this information to organise participation, manage places and entitlements, and support program administration. Due or birth dates may support session recommendations when that feature becomes available.",
      "Private administration is separate from the information stored locally in The Dad Club mobile app.",
    ],
  },
  {
    title: "Enquiries and technical information",
    paragraphs: [
      "If you email us, we receive your email address and the information you include. Please avoid providing unnecessary sensitive personal or health information.",
      "Our hosting and security providers process technical information associated with website requests, such as IP addresses, browser and device information, request times and security or error events.",
      "Technical information supports website delivery, troubleshooting and protection against misuse.",
      "Required form fields are identified. Without the required details and contact agreement, we cannot process the relevant expression of interest. You can browse the website without submitting a form.",
    ],
  },
  {
    title: "Our service providers",
    paragraphs: [
      "Vercel hosts the website and runs server code that processes submissions and private administration. Form submissions pass through Vercel before reaching our database.",
      "Supabase stores registration, application and administration information in a database configured in the Sydney region. Supabase Authentication supports administrator sign-in.",
      "Cloudflare Turnstile provides automated-submission checks. Your browser connects to Cloudflare, which processes technical signals used for verification. Our server sends the verification token to Cloudflare without adding the personal details entered in the form.",
      "Resend sends program interest-registration confirmations and facilitator application acknowledgements. Our current integrations provide the recipient's email address, the email content and a technical registration or application identifier used to help prevent duplicate sending. The email requests do not include your name, phone number, location, stage of fatherhood, optional enquiry message or facilitator application answers.",
      "Microsoft 365 handles messages sent to and from hello@thedadclub.com.au, including replies to confirmation emails and recruitment correspondence.",
    ],
  },
  {
    title: "Access and disclosure",
    paragraphs: [
      "Information is available to the operator and people authorised for the relevant enquiry, recruitment or program administration purpose. Facilitator applications are accessible through the website only to authorised administrators.",
      "Public visitors and ordinary signed-in users are not granted direct access to application records. An applicant does not receive access to other applicants' details.",
      "Service providers process information needed to deliver their services. We may also disclose information where required by law or to obtain professional assistance necessary to manage a privacy or security matter.",
      "We do not sell this information or publish application, registration, member or booking records on the public website.",
    ],
  },
  {
    title: "Overseas processing",
    paragraphs: [
      "Our database is configured in Sydney, but this is not a promise that all information remains in Australia.",
      "Our providers operate internationally. Hosting, email delivery, security checks, support and operational systems may involve processing in the United States and other countries used by those providers and their subprocessors.",
      "Provider locations depend on the service and configuration and can change. The privacy and subprocessor information linked below provides further details. Contact us if you need information about a particular service.",
    ],
  },
  {
    title: "Cookies, referrals and email tracking",
    paragraphs: [
      "We have not added advertising trackers or audience analytics to the current website. Hosting and security services may use browser storage or similar technical mechanisms needed to operate and protect the service. Administrator sign-in uses authentication cookies.",
      "Facilitator links may include a general source label, such as 'app' or 'app-referral'. If you submit an application, we may store that label with it to understand how applicants found us. It is an indicative source label, not a verified referral.",
      "These source labels do not identify the person who shared a link or recruitment image. The form does not request contact details for someone you wish to refer. Technical request logs may still include the requested URL.",
      "Open and click tracking have not been enabled for our Resend confirmation and acknowledgement emails. We do not use those emails to measure whether you opened the message or clicked a link.",
      "Email delivery information, such as acceptance, delivery, delay, bounce or complaint events, may still be processed by the email provider. An interest-registration database status of 'sent', or a facilitator acknowledgement status of 'accepted', means the provider accepted the email, not that it necessarily reached your inbox.",
      "A facilitator acknowledgement status of 'not_confirmed' means our server could not confirm acceptance; a timed-out request may still have succeeded. 'Pending' means a sending attempt was started without a recorded final outcome. 'Not recorded' means no tracked outcome is available, including for older applications. These statuses are separate from recruitment review decisions.",
    ],
  },
  {
    title: "Security",
    paragraphs: [
      "We use HTTPS for website connections, restrict database access and keep administrative credentials on the server rather than in public browser code.",
      "Private administration requires sign-in and an administrator authorisation check. Facilitator applications do not grant administrator or facilitator access.",
      "These measures reduce risk, but no internet service or storage system can guarantee absolute security. Please do not use public forms to send confidential clinical information.",
    ],
  },
  {
    title: "Retention and deletion",
    paragraphs: [
      "We review interest registrations when they reach 12 months old and delete records no longer needed for their collection purpose. This is a review process, not an automatic deletion feature.",
      "We also review facilitator applications at 12 months and remove information no longer needed for recruitment. Continuing recruitment or an agreed next step may justify longer retention. Information required for any later employment or onboarding process will be addressed separately.",
      "Member and booking information is retained while needed to administer participation and remaining entitlements, and reviewed when no longer needed for that purpose.",
      "Information may be retained longer where there is an ongoing enquiry or another necessary reason, including a legal obligation. We do not retain information indefinitely simply because it was collected.",
      "Email correspondence, provider logs and backups may have separate retention periods. Deleting a database record does not instantly remove all copies from email systems or backups.",
      "You can request removal earlier. We will explain any information we need to retain and any relevant limitations.",
    ],
  },
  {
    title: "Your choices, access and corrections",
    paragraphs: [
      "You can withdraw your program interest or facilitator application, ask us to stop relevant contact, request access to your information, correct inaccurate details or request deletion by emailing hello@thedadclub.com.au.",
      "You can also reply to a program or recruitment email to explain your preferences.",
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
      "The website does not access profiles, journey dates, check-ins or saved cards stored locally in The Dad Club app. Information entered separately on the website is managed under this notice.",
      "Registering interest, applying to facilitate or participating in the program does not enrol you in research. Any future research participation would require a separate process, appropriate ethics review, clear information and explicit informed consent.",
    ],
  },
  {
    title: "Changes to this notice",
    paragraphs: [
      "This version was updated on 29 October 2026 to cover automated facilitator application acknowledgements and administrative email sending-status records.",
      "We will update this notice when our services, operator or information-handling practices change.",
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
      introduction="How we handle information when you visit the website, register your interest, apply to facilitate, participate in the program or contact The Dad Club."
      sections={sections}
      providers={providers}
    />
  );
}