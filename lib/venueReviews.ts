export const venueReviewStatuses = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
  { value: "inactive", label: "Inactive" },
] as const;

export function venueStatusLabel(value: string) {
  return (
    venueReviewStatuses.find((status) => status.value === value)
      ?.label ?? value
  );
}