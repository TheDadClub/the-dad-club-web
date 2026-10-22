export const facilitatorConsentVersion = "facilitator-v1";

export const facilitatorDeliveryModes = [
  { value: "online", label: "Online" },
  { value: "face_to_face", label: "Face to face" },
] as const;

export const facilitatorApplicationStatuses = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
] as const;

export type FacilitatorDeliveryMode =
  (typeof facilitatorDeliveryModes)[number]["value"];

export type FacilitatorApplicationStatus =
  (typeof facilitatorApplicationStatuses)[number]["value"];

export type FacilitatorApplicationSource =
  | "website"
  | "app"
  | "app-referral";

export function normaliseFacilitatorSource(
  value: unknown,
): FacilitatorApplicationSource {
  if (value === "app" || value === "app-referral") {
    return value;
  }

  return "website";
}

export const facilitatorContactFields = [
  {
    name: "name",
    label: "Your name",
    type: "text",
    autoComplete: "name",
    maxLength: 100,
  },
  {
    name: "email",
    label: "Email address",
    type: "email",
    autoComplete: "email",
    maxLength: 254,
  },
  {
    name: "phone",
    label: "Phone number",
    type: "tel",
    autoComplete: "tel",
    maxLength: 40,
  },
  {
    name: "location",
    label: "Suburb or town and state",
    type: "text",
    autoComplete: "address-level2",
    maxLength: 150,
  },
] as const;

export const facilitatorExperienceFields = [
  {
    name: "service_areas",
    label: "Preferred service areas",
    help: "For face-to-face work, tell us where you could travel. If online only, you can leave this blank.",
    required: false,
    maxLength: 500,
    rows: 2,
  },
  {
    name: "availability",
    label: "Your general availability",
    help: "For example, weekday evenings or weekends. These are preferences, not a commitment to particular sessions.",
    required: true,
    maxLength: 1000,
    rows: 3,
  },
  {
    name: "professional_experience",
    label: "Relevant work or professional experience",
    help: "Tell us about experience relevant to supporting people, facilitating conversations or working with groups.",
    required: true,
    maxLength: 2000,
    rows: 4,
  },
  {
    name: "qualifications",
    label: "Relevant qualifications or training",
    help: "A brief summary is enough. Please do not upload or include certificate numbers or screening documents.",
    required: false,
    maxLength: 1500,
    rows: 3,
  },
  {
    name: "group_experience",
    label: "Experience supporting fathers or facilitating groups",
    help: "Experience in other settings is welcome. If you are new to this work, tell us that too.",
    required: true,
    maxLength: 2000,
    rows: 4,
  },
  {
    name: "motivation",
    label: "Why would you like to facilitate with The Dad Club?",
    help: "A short answer is fine. Please leave out personal health information about yourself or anyone else.",
    required: true,
    maxLength: 1500,
    rows: 4,
  },
] as const;