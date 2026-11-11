import PrivacyDocument from "../../../components/PrivacyDocument";

const sections = [
  {
    title: "Who operates the app",
    paragraphs: [
      "The Dad Club is operated by Peter Mann, trading as The Dad Club, in South Australia.",
      "This notice describes the current version of The Dad Club app, which stores your profile and check-in information locally on your device. Website registrations, member accounts, bookings and facilitator applications are covered separately by our website privacy notice.",
    ],
  },
  {
    title: "Information stored on your device",
    paragraphs: [
      "The app stores the information you enter or save locally on your device. This can include your name, an optional baby name, expected due date, actual birth date, journey status, saved cards and whether you have completed onboarding.",
      "Check-in records contain your selected mood, selected factors, journey stage, a record identifier and the date and time of the check-in. The app also stores your notification preference.",
      "These details support your personalised fatherhood timeline, saved content, reminders and private reflection.",
      "The app does not require an account. Your local profile and check-in records are not uploaded to The Dad Club's website database.",
    ],
  },
  {
    title: "Check-ins and wellbeing information",
    paragraphs: [
      "Check-in information is stored locally in the app. It is not sent to The Dad Club for monitoring, clinical review or research.",
      "The app does not notify us when you complete a check-in or select a particular response. Do not rely on it to alert someone if you need assistance.",
      "Using check-ins is optional. The current version lets you view your history but does not provide an in-app check-in export or deletion control.",
      "Anyone with access to your unlocked device may be able to view information in the app.",
    ],
  },
  {
    title: "Notifications",
    paragraphs: [
      "If you enable reminders and grant notification permission, the app schedules notifications locally on your device using your journey dates and the app's content schedule.",
      "The current reminder system does not register a remote push token or send your profile, journey dates or check-in records to a push notification server.",
      "Reminders are generally scheduled for 7:30 pm using your device's local time settings. The schedule is refreshed when you open or return to the app.",
      "You can turn reminders off in the app's Stay connected screen or manage notification permission through your device settings. Pausing your journey is designed to stop scheduled journey reminders.",
      "Notification text may include general card titles. Depending on your device settings, notifications may appear on a lock screen or another connected device. Use your operating system's notification-preview settings to control what is visible.",
    ],
  },
  {
    title: "Analytics, advertising and app distribution",
    paragraphs: [
      "The current app does not include advertising or an added user analytics or crash-reporting service that sends your local profile or check-in records to The Dad Club.",
      "Apple, Google and your operating system may separately process installation, purchase, diagnostic and backup information under their own settings and privacy terms.",
      "App stores may make sales, download, usage or diagnostic reports available to the developer, depending on the platform and your settings. These reports are separate from the app's locally stored profile and check-in history.",
      "Purchases and downloads through an app store are handled by that store. The app does not ask you to enter payment card details.",
    ],
  },
  {
    title: "Sharing content and opening links",
    paragraphs: [
      "You can choose to share suitable general fatherhood cards and a branded facilitator recruitment image through your device's sharing tools.",
      "These sharing features do not include your local profile, journey dates or private check-in history. A temporary image file is created on your device to support image sharing.",
      "If you share an image, the destination app or service handles it under its own privacy practices. Check the destination and recipient before sharing. Copies you send or save are outside the app's control.",
      "When you open an external support link, visit our website, make a phone call or contact a service, that service may receive technical information or details you choose to provide.",
      "Registering interest, applying to facilitate or using a website member account is a separate action. It does not automatically upload your locally stored app information.",
    ],
  },
  {
    title: "Device backups",
    paragraphs: [
      "Local storage does not guarantee that information exists only on one physical device. Your operating system or backup settings may include app data in a device or cloud backup.",
      "Backups and restored data are managed through your device and backup provider. The Dad Club cannot inspect or delete those copies for you.",
    ],
  },
  {
    title: "Keeping and removing app information",
    paragraphs: [
      "Your profile, saved cards and check-in history remain in local app storage unless that storage is removed or changed. The current app does not automatically delete older check-ins.",
      "You can update journey dates through the app's journey options and remove cards from your saved collection.",
      "The current version does not provide a complete in-app reset or delete-all-data button. To remove local app storage, use your operating system's app deletion or storage controls. Available options depend on your device.",
      "Deleting an app is different from offloading or archiving it, which can preserve its data. Removing the app does not necessarily erase existing backups or copies of images you have shared.",
      "Because we do not receive your local profile or check-in records, we cannot retrieve, correct or delete those records remotely. Contact us if you need help finding the relevant device controls.",
    ],
  },
  {
    title: "Looking after your privacy",
    paragraphs: [
      "Use a device passcode or biometric lock, keep your operating system updated and consider who can access your device, notification previews and backups.",
      "The app uses local device storage; it is not a separate encrypted clinical record system. Your device and operating system provide their own security protections.",
      "The app provides general information and reflection tools. It is not a monitored service, therapy service or emergency response system.",
    ],
  },
  {
    title: "If you contact us",
    paragraphs: [
      "If you email hello@thedadclub.com.au for support, we receive your email address and the information you include. Our correspondence is handled through Microsoft 365.",
      "Please avoid sending check-in screenshots or sensitive health information unless necessary to explain your issue. You can ask for access, correction or deletion of support correspondence we hold.",
      "We retain support correspondence while needed to resolve the issue and for necessary administration, then review it for deletion. Email systems and backups may retain copies for their applicable retention periods.",
      "Microsoft operates internationally, so support correspondence may be processed outside Australia under its service arrangements.",
    ],
  },
  {
    title: "Research",
    paragraphs: [
      "Using the app does not enrol you in research or send your check-in history to a research database.",
      "Any future research feature would require a separate, deliberately designed process with appropriate ethics review, clear information, explicit informed consent and appropriate privacy safeguards.",
    ],
  },
  {
    title: "Privacy questions and complaints",
    paragraphs: [
      "Contact hello@thedadclub.com.au with privacy questions, requests or complaints.",
      "We may need to verify your identity before providing or changing information we hold, such as support correspondence.",
      "We will acknowledge concerns, investigate and aim to provide a substantive response within 30 days. If more time is needed, we will explain why.",
      "If you remain dissatisfied, you can seek guidance from the Office of the Australian Information Commissioner at www.oaic.gov.au about available complaint options and its jurisdiction.",
    ],
  },
  {
    title: "Changes to this notice",
    paragraphs: [
      "We will update this notice when the app's information-handling practices change, including before introducing accounts, cloud synchronisation, research participation or new data collection.",
      "This app privacy notice was last reviewed on 11 November 2026.",
    ],
  },
];

export default function AppPrivacyPage() {
  return (
    <PrivacyDocument
      title="APP PRIVACY"
      introduction="How The Dad Club app handles your information, local storage, reminders and sharing. Last reviewed: 11 November 2026."
      sections={sections}
      providers={[
        {
          label: "Apple Privacy Policy",
          href: "https://www.apple.com/legal/privacy/",
        },
        {
          label: "Google Privacy Policy",
          href: "https://policies.google.com/privacy",
        },
        {
          label: "Microsoft Privacy Statement",
          href: "https://www.microsoft.com/en-us/privacy/privacystatement",
        },
      ]}
    />
  );
}