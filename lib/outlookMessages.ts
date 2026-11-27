
import "server-only";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export type OutlookEmailAddress = {
  emailAddress?: {
    name?: string;
    address?: string;
  };
};

export type OutlookInternetMessageHeader = {
  name?: string;
  value?: string;
};

export type OutlookMessage = {
  id: string;
  internetMessageId?: string;
  conversationId?: string;
  subject?: string;
  sentDateTime?: string;
  receivedDateTime?: string;
  from?: OutlookEmailAddress;
  sender?: OutlookEmailAddress;
  toRecipients?: OutlookEmailAddress[];
  ccRecipients?: OutlookEmailAddress[];
  isDraft?: boolean;
  internetMessageHeaders?: OutlookInternetMessageHeader[];
};

type OutlookMessagePage = {
  value?: OutlookMessage[];
  "@odata.nextLink"?: string;
};

type OutlookFolder = "sentitems" | "inbox";

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

function validateGraphUrl(value: string): URL {
  const url = new URL(value);

  if (
    url.origin !== "https://graph.microsoft.com" ||
    !url.pathname.startsWith("/v1.0/") ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "Invalid Microsoft Graph pagination URL."
    );
  }

  return url;
}

export function normaliseOutlookEmail(
  recipient?: OutlookEmailAddress
): string | null {
  const address =
    recipient?.emailAddress?.address
      ?.trim()
      .toLowerCase();

  if (
    !address ||
    address.length > 254 ||
    address.indexOf("@") <= 0
  ) {
    return null;
  }

  return address;
}

export function getOutlookHeaderValues(
  message: OutlookMessage,
  headerName: string
): string[] {
  const target = headerName.trim().toLowerCase();

  if (
    !Array.isArray(message.internetMessageHeaders)
  ) {
    return [];
  }

  return message.internetMessageHeaders
    .filter(
      (header) =>
        header &&
        typeof header.name === "string" &&
        header.name.trim().toLowerCase() === target &&
        typeof header.value === "string"
    )
    .map(
      (header) =>
        (header.value ?? "").trim().toLowerCase()
    )
    .filter(Boolean);
}

export async function getOutlookMessageHeaders({
  accessToken,
  messageId,
  assertLease,
}: {
  accessToken: string;
  messageId: string;
  assertLease: () => Promise<void>;
}): Promise<OutlookInternetMessageHeader[]> {
  if (
    typeof messageId !== "string" ||
    !messageId.trim() ||
    messageId.length > 2048
  ) {
    throw new Error(
      "Invalid Outlook message identifier."
    );
  }

  await assertLease();

  const url = new URL(
    `${GRAPH_BASE}/me/messages/${encodeURIComponent(messageId)}`
  );

  url.searchParams.set(
    "$select",
    "id,internetMessageHeaders"
  );

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'IdType="ImmutableId"',
      Accept: "application/json",
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(
      `Outlook header retrieval failed: HTTP ${response.status}.`
    );
  }

  const data =
    (await response.json()) as Partial<OutlookMessage>;

  if (data.id !== messageId) {
    throw new Error(
      "Outlook header response identifier mismatch."
    );
  }

  if (
    !Array.isArray(data.internetMessageHeaders)
  ) {
    throw new Error(
      "Outlook message headers are unavailable."
    );
  }

  const headers =
    data.internetMessageHeaders.filter(
      (header) =>
        header &&
        typeof header.name === "string" &&
        header.name.trim().length > 0 &&
        typeof header.value === "string"
    );

  if (headers.length === 0) {
    throw new Error(
      "Outlook message contains no usable headers."
    );
  }

  await assertLease();

  return headers;
}

export async function getOutlookMessages({
  accessToken,
  folder,
  fromAt,
  untilAt,
  assertLease,
}: {
  accessToken: string;
  folder: OutlookFolder;
  fromAt: string;
  untilAt: string;
  assertLease: () => Promise<void>;
}): Promise<OutlookMessage[]> {
  const fromDate = new Date(fromAt);
  const untilDate = new Date(untilAt);

  if (
    !Number.isFinite(fromDate.getTime()) ||
    !Number.isFinite(untilDate.getTime()) ||
    fromDate.getTime() > untilDate.getTime()
  ) {
    throw new Error(
      "Invalid Outlook retrieval date range."
    );
  }

  const dateField =
    folder === "sentitems"
      ? "sentDateTime"
      : "receivedDateTime";

  const initialUrl = new URL(
    `${GRAPH_BASE}/me/mailFolders/${folder}/messages`
  );

  // Retrieve basic message metadata only.
  // Headers are requested separately for potential
  // outreach replies after contact matching.
  const selectedFields = [
    "id",
    "internetMessageId",
    "conversationId",
    "subject",
    "sentDateTime",
    "receivedDateTime",
    "from",
    "sender",
    "toRecipients",
    "isDraft",
  ];

  initialUrl.searchParams.set(
    "$select",
    selectedFields.join(",")
  );

  initialUrl.searchParams.set(
    "$filter",
    `${dateField} ge ${fromDate.toISOString()} and ${dateField} le ${untilDate.toISOString()}`
  );

  initialUrl.searchParams.set(
    "$orderby",
    `${dateField} asc`
  );

  initialUrl.searchParams.set(
    "$top",
    String(PAGE_SIZE)
  );

  const messages: OutlookMessage[] = [];

  const visitedUrls = new Set<string>();

  let nextUrl: string | null =
    initialUrl.toString();

  let pages = 0;

  while (nextUrl) {
    if (pages >= MAX_PAGES) {
      throw new Error(
        "Outlook retrieval page limit exceeded."
      );
    }

    await assertLease();

    const url = validateGraphUrl(nextUrl);

    if (visitedUrls.has(url.toString())) {
      throw new Error(
        "Repeated Outlook pagination URL."
      );
    }

    visitedUrls.add(url.toString());

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'IdType="ImmutableId"',
        Accept: "application/json",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(
        `Outlook message retrieval failed: HTTP ${response.status}.`
      );
    }

    const page =
      (await response.json()) as OutlookMessagePage;

    if (!Array.isArray(page.value)) {
      throw new Error(
        "Invalid Outlook message response."
      );
    }

    for (const message of page.value) {
      if (
        !message ||
        typeof message.id !== "string" ||
        !message.id.trim() ||
        message.isDraft === true
      ) {
        continue;
      }

      messages.push(message);
    }

    pages += 1;

    nextUrl =
      page["@odata.nextLink"] ?? null;
  }

  await assertLease();

  return messages;
}
