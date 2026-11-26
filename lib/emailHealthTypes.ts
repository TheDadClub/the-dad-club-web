
export type EmailHealthType =
  | "admin_notification"
  | "interest_confirmation"
  | "facilitator_acknowledgement"
  | "venue_acknowledgement"
  | "booking_confirmation"
  | "booking_cancellation"
  | "booking_change"
  | "purchase_confirmation"
  | "session_reminder"
  | "waitlist_notification"
  | "scheduled_processor";

export type EmailHealthIssueType =
  | "failed"
  | "not_confirmed"
  | "pending_overdue"
  | "processing_overdue"
  | "queue_overdue"
  | "review_required"
  | "processor_inactive"
  | "processor_failed";

export type EmailHealthSeverity =
  | "warning"
  | "critical";

export type EmailHealthIssueStatus =
  | "open"
  | "acknowledged"
  | "resolved";

export type ProcessorName =
  | "session_reminders"
  | "waitlist_notifications"
  | "email_health_monitor";

export type ProcessorStatus =
  | "not_started"
  | "running"
  | "success"
  | "failed"
  | "disabled";

export type DetectedEmailIssue = {
  issue_key: string;
  email_type: EmailHealthType;
  source_table: string;
  source_id: string;
  issue_type: EmailHealthIssueType;
  severity: EmailHealthSeverity;
  source_status: string;
  error_code: string | null;
};

export type EmailHealthSettings = {
  enabled: boolean;
  monitoring_started_at: string | null;
};

export const EMAIL_HEALTH_THRESHOLDS = {
  unconfirmedGraceMinutes: 5,
  pendingOverdueMinutes: 30,
  expiredLeaseGraceMinutes: 15,
  queueOverdueMinutes: 30,
  processorInactiveMinutes: 20,
} as const;

export const EMAIL_HEALTH_LABELS: Record<
  EmailHealthType,
  string
> = {
  admin_notification: "Administrator notification",
  interest_confirmation: "Interest registration confirmation",
  facilitator_acknowledgement: "Facilitator acknowledgement",
  venue_acknowledgement: "Venue acknowledgement",
  booking_confirmation: "Booking confirmation",
  booking_cancellation: "Booking cancellation",
  booking_change: "Booking change",
  purchase_confirmation: "Purchase confirmation",
  session_reminder: "Session reminder",
  waitlist_notification: "Waitlist notification",
  scheduled_processor: "Scheduled email processor",
};

export const EMAIL_HEALTH_ISSUE_LABELS: Record<
  EmailHealthIssueType,
  string
> = {
  failed: "Sending failed",
  not_confirmed: "Sending outcome not confirmed",
  pending_overdue: "Pending email overdue",
  processing_overdue: "Processing overdue",
  queue_overdue: "Queued email overdue",
  review_required: "Manual review required",
  processor_inactive: "Scheduled processor inactive",
  processor_failed: "Scheduled processor failed",
};
