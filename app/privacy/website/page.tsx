import PrivacyDocument from "../../../components/PrivacyDocument";
import {
  websitePrivacySections,
  websitePrivacyProviders,
} from "../../../lib/privacy/websitePrivacySections";

export default function WebsitePrivacyPage() {
  return (
    <PrivacyDocument
      title="WEBSITE PRIVACY"
      introduction="How we handle information when you visit the website, register your interest, apply to facilitate, enquire about venue partnerships, purchase a program or hat, give or redeem a gift, manage your membership and bookings, receive operational emails or contact The Dad Club."
      lastUpdated="13 November 2026"
      sections={websitePrivacySections}
      providers={websitePrivacyProviders}
    />
  );
}