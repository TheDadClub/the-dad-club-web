import PrivacyDocument from "../../../components/PrivacyDocument";

const sections = [
  {
    title: "Who we are and what this covers",
    paragraphs: [
      "The Dad Club is currently operated by Peter Mann, trading as The Dad Club, in South Australia. In this notice, 'we', 'us' and 'our' refer to that operator.",
      "This notice covers www.thedadclub.com.au, registrations of interest, facilitator applications, member sign-in, session bookings, waitlists, related emails and enquiries, and information managed through our private administration tools. The Dad Club mobile app has a separate privacy notice.",
      "Existing active members can sign in and book available sessions using their session entitlements. Authorised administrators manage members, session dates, entitlements, bookings, attendance and waitlist information. Online payments are not currently collected through the website.",
    ],
  },
  {
    title: "Interest registrations",
    paragraphs: [
      "When you register your interest in the program, we collect your name, email address, suburb or town, stage of fatherhood and any optional message you provide.",
      "We also record a registration identifier, creation time, your agreement to be contacted, the version of the consent wording and the confirmation email status.",
      "We use these details to manage your interest, send a confirmation, respond to enquiries and contact you about upcoming programs. Your location and stage of fatherhood help us understand demand and identify potentially relevant options.",
      "Registering interest does not create an active membership, book a session or commit you to payment.",
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
    title: "Member records and sign-in",
    paragraphs: [
      "Authorised administrators can record member names, email addresses, optional phone numbers and locations, membership status, and due or birth dates provided by members.",
      "Members sign in by entering their membership email address and a one-time code sent by email. The member login does not require a saved password. SMS login is not currently offered.",
      "Supabase Authentication manages authentication accounts, email verification, login codes and signed-in sessions. Associated records may include an authentication identifier, email address, verification and sign-in times, and technical security information. Authentication cookies maintain your session.",
      "After successful email verification, we link the authentication account to the corresponding active member record. A login code alone does not grant membership or session entitlements. Registering interest or applying to facilitate does not grant member access.",
      "We do not save the login code in your member, booking or waitlist records. Keep codes private and sign out when using a shared device.",
      "Due or birth dates may support session recommendations when that feature becomes available. Website member records are separate from information stored locally in The Dad Club mobile app.",
    ],
  },
  {
    title: "Bookings, entitlements and attendance",
    paragraphs: [
      "We manage session entitlements, bookings, cancellations and recorded attendance. Records include identifiers linking the member and session, booking status, relevant dates and times, and identifiers for the member or administrator responsible for recorded actions.",
      "Signed-in active members can view their own entitlements and bookings and choose from published future session dates. The website checks session capacity, entitlement availability and existing bookings before accepting a booking.",
      "Authorised administrators can also create bookings, cancel bookings and record attendance. Booking reserves the entitlement for that session type; attendance marks it used. Cancelling a booking releases the place and allows an otherwise available entitlement to be booked again.",
      "After a new booking is saved, the website attempts to send a confirmation email to the email address recorded on the member profile. The email includes the session title, date and times, Adelaide time-zone information, venue or delivery details, and booking reference.",
      "We record the booking confirmation sending status and, where confirmed, the time our server recorded the email provider's acceptance. A booking remains saved if email sending fails. Older bookings may not have a tracked confirmation-email outcome.",
      "Booking confirmations and session reminders are operational messages about participation. They are not receipts or proof of payment. Cancellation, attendance and later session-detail changes do not currently trigger their own automated confirmation emails. A released place may trigger a separate availability alert to eligible waitlisted members.",
      "Members currently need to contact us to change or cancel a booking. The member area does not yet provide self-service cancellation or rescheduling.",
    ],
  },
  {
    title: "Session reminders",
    paragraphs: [
      "When session-reminder automation is enabled, we check for eligible bookings and attempt to send an email approximately 24 hours before the session. The email uses the address recorded on the member profile.",
      "The reminder includes the session title, start and end times, venue or delivery details, general preparation information and a link to member sign-in. Times identify Australian Central Daylight Time or Australian Central Standard Time according to the session date.",
      "The reminder does not include the member's name, phone number, due or birth dates, app check-ins or information about other members.",
      "The initial queueing check has a one-hour catch-up window after the scheduled reminder time. Bookings made within 24 hours of the session are not queued for an additional 24-hour reminder; the booking confirmation remains the initial participation email.",
      "Reminders are eligible only while the member is active, the booking remains booked, the session is published and the recorded session start time still matches. Eligibility is checked again before sending. Reminders are not attempted after the session starts.",
      "The system prevents a new reminder record for the same booking, session start time and reminder type. A rescheduled session may become eligible for a reminder for its new date.",
      "A reminder is not guaranteed to arrive or arrive at an exact time. Service interruptions, sending limits, changed details and email delivery issues may prevent or delay it. Please retain your booking details and check the member area.",
      "Contact us if you cannot attend, need to change a booking or want help with reminder preferences. A cancellation recorded after the final sending check cannot recall an email already being processed or accepted by the email provider.",
      "Session reminders do not subscribe members to unrelated marketing.",
    ],
  },
  {
    title: "Session-reminder processing records",
    paragraphs: [
      "We store a private reminder queue record linked to the booking and its session start time. It includes a notification identifier, reminder type, scheduled time, creation and update times, processing status, attempt count and retry information.",
      "Before contacting the email provider, we save the exact email request so retries can reuse it. This includes the sender and recipient email addresses, reply address, subject, message content, session dates, venue or delivery details and member-login link.",
      "We also store a technical fingerprint used to detect changed recipient or session details, processing identifiers, limited error codes and, where available, the provider's message identifier and acceptance time.",
      "Temporary failures may be retried within a limited period. Retries reuse the saved request and a technical identifier intended to prevent duplicate sending. Automatic attempts stop after the configured attempt or retry-time limit, with unresolved records marked for review.",
      "If recipient or session details change after a sending request is saved, the worker does not automatically retry that outdated request. Depending on the change, the record is skipped or marked for review.",
      "Reminder records are restricted to trusted server access and authorised administration. They are not publicly accessible or displayed to other members. These records help us manage operational emails and investigate sending issues.",
    ],
  },
  {
    title: "Session waitlists",
    paragraphs: [
      "An eligible signed-in member can join the waitlist for a full, future, published session. We record the member and session identifiers, the waitlist status, joining time and last update time.",
      "We use these records to show members their own waitlist entries, help authorised administrators understand demand for particular session dates and identify members eligible for availability alerts.",
      "Joining a waitlist does not reserve a place, guarantee a booking or use an entitlement. Members can leave a waitlist. Rejoining records a new joining time rather than preserving the previous position.",
      "When a member books a session, the website marks the corresponding waiting entry as booked and closes their other waiting entries for that session type. Cancelling that booking does not automatically rejoin those waitlists.",
      "Waitlist entries may remain recorded after a session starts or is no longer published. The member area identifies those dates separately, and administrators can review the records.",
      "When availability-email automation is enabled, we periodically check for places in future published sessions. An alert is eligible only while the member remains active, the waiting entry remains current, the matching entitlement is available and the member has no booking or recorded attendance for that session type.",
      "We attempt one availability alert per waitlist joining. The alert explains that a place was available when checked and links to member sign-in. It does not allocate a place, guarantee priority or create a booking. Multiple eligible waiting members may be alerted about the same opening.",
      "Availability may change before an alert is sent, received or acted on. Members must sign in and successfully book a place. If the session fills again, their waiting entry remains, but a successful alert is not repeatedly sent for that same joining.",
      "The member area indicates when automatic availability emails are paused. Members can also check the website for openings or contact us. Joining a waitlist does not subscribe the member to unrelated marketing.",
      "Leaving changes the waitlist status rather than immediately deleting its record. Sending eligibility is checked again before an alert is attempted, but an email already being processed may still arrive. You can contact us to request deletion, subject to the retention considerations below.",
    ],
  },
  {
    title: "Availability-email processing records",
    paragraphs: [
      "To manage availability alerts, we store a queue record linked to the waitlist entry and its joining time. It includes a notification identifier, creation and update times, processing status, attempt count and scheduling information.",
      "Before contacting the email provider, we save the exact email request so retries can reuse it. This includes the sender and recipient email addresses, reply address, subject, message content, session dates, venue or delivery details and the member-login link.",
      "The saved availability email does not include the member's name, phone number, due or birth dates, app check-ins or information about other members.",
      "We also record technical processing identifiers, limited error codes and, where available, the provider's message identifier and acceptance time. Authorised administrators can see sending statuses alongside waitlist entries.",
      "Temporary failures may be retried within a limited period. Retries use the same saved request and a technical identifier intended to prevent duplicate sending. Automatic attempts stop after the configured attempt or retry-time limit, with unresolved records marked for review.",
      "If the recorded recipient or session details change after an email request is saved, the worker marks it for review instead of automatically retrying the outdated message.",
      "These records help us manage operational emails and investigate delivery issues. They are separate from bookings, attendance and research participation.",
    ],
  },
  {
    title: "Enquiries and technical information",
    paragraphs: [
      "If you email us, we receive your email address and the information you include. Please avoid providing unnecessary sensitive personal or health information.",
      "Our hosting, authentication and security providers process technical information associated with website requests, such as network addresses, browser and device information, request times and security or error events.",
      "Technical information supports website delivery, sign-in, troubleshooting and protection against misuse.",
      "Required form fields are identified. Without the required details and contact agreement, we cannot process the relevant expression of interest. Without a verified email and an active member record, we cannot provide member access. You can browse the public website without submitting a form or signing in.",
    ],
  },
  {
    title: "Our service providers",
    paragraphs: [
      "Vercel hosts the website and runs server code that processes submissions, member requests, private administration, scheduled session reminders and availability-email checks. Requests pass through Vercel before reaching the relevant database, authentication or email service.",
      "Supabase stores registration, application, member, entitlement, booking, attendance, waitlist and email-processing information in a database configured in the Sydney region. Supabase Authentication supports administrator and member sign-in and manages authentication accounts and sessions.",
      "Cloudflare Turnstile provides automated-submission checks for public forms and member login-code requests. Your browser connects to Cloudflare, which processes technical signals used for verification. Our server sends the verification token to Cloudflare without adding the personal details entered in the form.",
      "Resend sends interest-registration confirmations, facilitator application acknowledgements, booking confirmations, session reminders and waitlist availability alerts. Supabase Authentication also uses our Resend connection to deliver member login-code emails. Resend processes recipient email addresses, message content and technical delivery information needed to provide these services.",
      "Interest-registration and facilitator acknowledgement email requests do not include names, phone numbers, locations, stages of fatherhood, optional enquiry messages or facilitator application answers. Technical registration or application identifiers help prevent duplicate sending.",
      "Booking confirmations include session and venue details and a booking reference. Session reminders and availability alerts include the relevant session and venue details and a member-login link. These messages do not include due or birth dates, phone numbers, app check-ins or information about other members. Login emails contain the one-time code and sign-in instructions.",
      "Microsoft 365 handles messages sent to and from hello@thedadclub.com.au, including replies to operational emails, recruitment correspondence and requests for assistance.",
    ],
  },
  {
    title: "Access and disclosure",
    paragraphs: [
      "Information is available to the operator and people authorised for the relevant enquiry, recruitment or program administration purpose. Facilitator applications are accessible through the website only to authorised administrators.",
      "The member area is restricted to the signed-in member's own member information, entitlements, bookings and waitlist entries. Shared session dates and aggregate place availability are displayed without revealing other members' names or booking details.",
      "Signing in as a member does not grant administrator access or access to other members' records, interest registrations, facilitator applications or private email-processing queues.",
      "Service providers process information needed to deliver their services. We may also disclose information where required by law or to obtain professional assistance necessary to manage a privacy or security matter.",
      "We do not sell this information or publish application, registration, member, booking, waitlist or email-processing records on the public website.",
    ],
  },
  {
    title: "Overseas processing",
    paragraphs: [
      "Our database is configured in Sydney, but this is not a promise that all information remains in Australia.",
      "Our providers operate internationally. Hosting, authentication support, email delivery, security checks, support and operational systems may involve processing in the United States and other countries used by those providers and their subprocessors.",
      "Provider locations depend on the service and configuration and can change. The privacy and subprocessor information linked below provides further details. Contact us if you need information about a particular service.",
    ],
  },
  {
    title: "Cookies, referrals and email tracking",
    paragraphs: [
      "We have not added advertising trackers or audience analytics to the current website. Hosting and security services may use browser storage or similar technical mechanisms needed to operate and protect the service. Administrator and member sign-in use authentication cookies.",
      "Facilitator links may include a general source label, such as 'app' or 'app-referral'. If you submit an application, we may store that label with it to understand how applicants found us. It is an indicative source label, not a verified referral.",
      "These source labels do not identify the person who shared a link or recruitment image. The form does not request contact details for someone you wish to refer. Technical request logs may still include the requested URL.",
      "We have not enabled Resend open or click tracking for our operational emails. We do not use those messages to measure whether you opened them or clicked a link.",
      "Email delivery information, such as acceptance, delivery, delay, bounce or complaint events, may still be processed by the email provider. A database status of 'sent' or 'accepted' means the provider accepted the email, not that it necessarily reached your inbox.",
      "For interest, facilitator and booking confirmations, 'not_confirmed' means our server could not confirm acceptance; a timed-out request may still have succeeded. 'Pending' means no final sending outcome has been recorded. 'Not recorded' means no tracked outcome is available, including for some older records.",
      "For availability alerts and session reminders, 'queued' means waiting for eligible processing and 'processing' means a worker has claimed the record. 'Accepted' means provider acceptance was recorded. 'Skipped' means the request was no longer eligible when checked. 'Review' means automatic processing has stopped and the record needs review.",
      "A booking confirmation may also be marked 'skipped' if the booking, member or session was no longer eligible when checked. Email sending statuses are separate from recruitment decisions, membership status, booking status and attendance.",
    ],
  },
  {
    title: "Security",
    paragraphs: [
      "We use HTTPS for website connections, restrict database access and keep administrative credentials on the server rather than in public browser code.",
      "Private administration requires sign-in and an administrator authorisation check. Member access requires verified sign-in and a corresponding active member record. Booking and waitlist requests are checked against the authenticated member.",
      "Scheduled email endpoints require a private access key. Queue-processing functions and records are restricted to trusted server access. Workers recheck relevant member, booking, waitlist, entitlement and session eligibility before attempting an email.",
      "The website uses verification checks and authentication-service limits to help protect login-code requests. Do not share your login codes or leave a session signed in on a shared device.",
      "These measures reduce risk, but no internet service or storage system can guarantee absolute security. Please do not use public forms to send confidential clinical information.",
    ],
  },
  {
    title: "Retention and deletion",
    paragraphs: [
      "We review interest registrations when they reach 12 months old and delete records no longer needed for their collection purpose. This is a review process, not an automatic deletion feature.",
      "We also review facilitator applications at 12 months and remove information no longer needed for recruitment. Continuing recruitment or an agreed next step may justify longer retention. Information required for any later employment or onboarding process will be addressed separately.",
      "Member, authentication, booking, attendance, entitlement and waitlist information is retained while needed to administer participation, access, remaining entitlements, relevant enquiries and operational records, and reviewed when no longer needed for those purposes.",
      "Email queue records, saved sending requests and sending outcomes, including session reminders and availability alerts, are retained while needed to manage delivery, prevent duplicate processing and investigate relevant issues. They are subject to review rather than automatic deletion after sending.",
      "Leaving a waitlist, cancelling a booking or signing out does not automatically delete all associated records, saved email requests or the authentication account.",
      "Information may be retained longer where there is an ongoing enquiry or another necessary reason, including a legal obligation. We do not retain information indefinitely simply because it was collected.",
      "Email correspondence, authentication and security logs, other provider logs and backups may have separate retention periods. Deleting a database record does not instantly remove all copies from email systems or backups.",
      "You can request removal earlier. We will explain any information we need to retain and any relevant limitations.",
    ],
  },
  {
    title: "Your choices, access and corrections",
    paragraphs: [
      "You can withdraw your program interest or facilitator application, ask us to stop relevant contact, request access to your information, correct inaccurate details or request deletion by emailing hello@thedadclub.com.au.",
      "Members can view their bookings and entitlements, join eligible waitlists and leave their own waiting entries through the member area. Contact us to change member details, request a booking change or ask about account closure.",
      "You can leave a waitlist if you no longer want an availability alert for that date. An email already being processed may still arrive. Contact us if you need help managing waiting entries or contact preferences.",
      "Contact us if you need help with session reminders. There is not currently a separate reminder-preference control in the member area.",
      "You can also reply to a program or recruitment email to explain your preferences. Operational messages about a requested login, booking, session reminder or waitlist are separate from optional program updates.",
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
      "Registering interest, applying to facilitate, signing in, booking, joining a waitlist or participating in the program does not enrol you in research. Any future research participation would require a separate process, appropriate ethics review, clear information and explicit informed consent.",
    ],
  },
  {
    title: "Changes to this notice",
    paragraphs: [
      "This version was updated on 29 October 2026 to cover member email-code sign-in, self-service session booking, booking confirmations, automated session reminders, session waitlists, automated availability alerts and related email-processing records.",
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
      introduction="How we handle information when you visit the website, register your interest, apply to facilitate, sign in as a member, book sessions, join waitlists, receive operational emails or contact The Dad Club."
      sections={sections}
      providers={providers}
    />
  );
}