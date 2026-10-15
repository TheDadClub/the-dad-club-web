import PrivacyDocument from "../../../components/PrivacyDocument";

const sections = [
  {
    title: "Who operates the app",
    paragraphs: [
      "The Dad Club is currently operated by Peter Mann, trading as The Dad Club, in South Australia.",
      "This notice describes the current device-only version of The Dad Club app. Website registrations are covered separately by our website privacy notice.",
    ],
  },
  {
    title: "Information stored on your device",
    paragraphs: [
      "The app stores information you enter or save locally on your device. This includes your profile name, expected due date or birth date, saved cards and wellbeing check-in information, including selected factors and history.",
      "These details support your personalised fatherhood timeline, saved content and private reflection.",
      "The current version does not require a member account or upload this information to The Dad Club's website registration database.",
    ],
  },
  {
    title: "Check-ins and wellbeing information",
    paragraphs: [
      "Check-in information stays within the app's local storage in the current version. It is not sent to The Dad Club for monitoring or clinical review.",
      "The app does not notify us when you complete a check-in. Do not rely on it to alert someone if you need assistance.",
      "You choose whether to use check-ins. Anyone with access to your unlocked device may be able to view information in the app.",
    ],
  },
  {
    title: "Analytics and advertising",
    paragraphs: [
      "The current device-only version has no added advertising, user analytics or crash-reporting service that sends your profile or check-in information to The Dad Club.",
      "Apple, Google and your operating system may separately process app installation, purchase, diagnostic or backup information under their own settings and privacy terms.",
    ],
  },
  {
    title: "Sharing content and opening links",
    paragraphs: [
      "The app allows you to choose to share suitable general fatherhood cards through your device's sharing tools. Private check-in information is not included in that card-sharing feature.",
      "If you share a card, the destination app or service handles the content under its own privacy practices. Check the destination and recipient before sharing.",
      "When you open an external support link, visit our website or contact a service, that website or service may receive technical information or details you choose to provide.",
      "Registering interest on our website is a separate action. It does not automatically upload your locally stored app information.",
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
      "Local information may remain while you use the app. Removing the app may remove its local data, depending on your device and the removal method.",
      "Offloading or archiving an app can preserve its data. Removing an app also does not necessarily erase existing backups.",
      "The current version's complete deletion behaviour is being checked before release. Contact us for help understanding the available options for your device.",
      "Because we do not receive your local profile or check-in records, we cannot retrieve, correct or delete those records remotely.",
    ],
  },
  {
    title: "Looking after your privacy",
    paragraphs: [
      "Use a device passcode or biometric lock, keep your operating system updated and consider who can access your device and backups.",
      "Do not assume local storage is a separate encrypted clinical record system. Avoid entering information you would not want someone with access to your device to see.",
    ],
  },
  {
    title: "If you contact us",
    paragraphs: [
      "If you email hello@thedadclub.com.au for support, we receive your address and the information you include. Our correspondence is handled through Microsoft 365.",
      "Please do not send check-in screenshots or sensitive health information unless necessary to explain your issue. You can ask for access, correction or deletion of support correspondence we hold.",
      "We retain support correspondence while needed to resolve the issue and for necessary administration, then review it for deletion. Email systems and backups may retain copies for their applicable retention periods.",
    ],
  },
  {
    title: "Research",
    paragraphs: [
      "Using the current app does not enrol you in research or send your check-in history to a research database.",
      "Any future research feature would require a separate, deliberately designed process with appropriate ethics review, clear information, explicit informed consent and appropriate privacy safeguards.",
    ],
  },
  {
    title: "Privacy questions and complaints",
    paragraphs: [
      "Contact hello@thedadclub.com.au with privacy questions, requests or complaints.",
      "We will acknowledge concerns, investigate and aim to provide a substantive response within 30 days. If more time is needed, we will explain why.",
      "If you remain dissatisfied, you can seek guidance from the Office of the Australian Information Commissioner at www.oaic.gov.au about available complaint options and its jurisdiction.",
    ],
  },
  {
    title: "Future changes",
    paragraphs: [
      "We will update this notice before introducing changes such as accounts, cloud synchronisation or new data collection. The date at the top identifies the latest revision.",
    ],
  },
];

export default function AppPrivacyPage() {
  return (
    <PrivacyDocument
      title="APP PRIVACY"
      introduction="Privacy information for the current device-only version of The Dad Club app."
      notice="Release review: this notice reflects the current design. App deletion, backup behaviour and the final release configuration are still being verified before this is used as the app-store privacy policy."
      sections={sections}
      providers={[
        {
          label: "Microsoft Privacy Statement",
          href: "https://www.microsoft.com/en-us/privacy/privacystatement",
        },
      ]}
    />
  );
}