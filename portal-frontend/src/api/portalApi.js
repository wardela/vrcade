import { getStoredPortalToken } from "../login/auth";

const normalizeErrorMessage = async (response, fallbackMessage) => {
  try {
    const payload = await response.json();
    return payload?.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

const buildUrl = (url, params) => {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `${url}?${query}` : url;
};

const authorizedFetch = async (
  url,
  options = {},
  fallbackMessage = "Request failed."
) => {
  const token = getStoredPortalToken();
  const requestUrl = buildUrl(url, options.params);
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  if (options.body != null && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(requestUrl, {
    ...options,
    headers,
    body:
      options.body != null && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  if (!response.ok) {
    throw new Error(await normalizeErrorMessage(response, fallbackMessage));
  }

  return response.json();
};

export const fetchPortalDashboard = async (date) => {
  const params = new URLSearchParams();

  if (date) {
    params.set("date", date);
  }

  return authorizedFetch(
    `/api/portal/dashboard${params.toString() ? `?${params.toString()}` : ""}`,
    {},
    "Failed to load dashboard."
  );
};

export const fetchPortalStatistics = async ({ from, to }) => {
  const params = new URLSearchParams();

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  return authorizedFetch(
    `/api/portal/statistics${params.toString() ? `?${params.toString()}` : ""}`,
    {},
    "Failed to load statistics."
  );
};

export const fetchPortalInvoices = async ({
  limit = 20,
  offset = 0,
  q = "",
  dateFrom = "",
  dateTo = "",
} = {}) =>
  authorizedFetch(
    "/api/portal/invoices",
    {
      params: {
        limit,
        offset,
        q,
        date_from: dateFrom,
        date_to: dateTo,
      },
    },
    "Failed to load invoices."
  );

export const fetchPortalInvoiceDetail = async (invoiceNumber) =>
  authorizedFetch(
    `/api/portal/invoices/${invoiceNumber}`,
    {},
    "Failed to load invoice details."
  );

export const fetchPortalInvoiceCompany = async () =>
  authorizedFetch(
    "/api/portal/invoices/company",
    {},
    "Failed to load invoice company details."
  );

export const fetchPortalNextInvoiceNumber = async () =>
  authorizedFetch(
    "/api/portal/invoices/next-number",
    {},
    "Failed to load the next invoice number."
  );

export const fetchPortalInvoiceClients = async ({ q = "", limit = 100 } = {}) =>
  authorizedFetch(
    "/api/portal/invoices/clients",
    {
      params: {
        q,
        limit,
      },
    },
    "Failed to load clients."
  );

export const fetchPortalInvoiceItems = async ({ q = "", limit = 100 } = {}) =>
  authorizedFetch(
    "/api/portal/invoices/items",
    {
      params: {
        q,
        limit,
      },
    },
    "Failed to load items."
  );

export const fetchPortalInvoiceStorages = async () =>
  authorizedFetch(
    "/api/portal/invoices/storages",
    {},
    "Failed to load storages."
  );

export const createPortalInvoice = async (payload) =>
  authorizedFetch(
    "/api/portal/invoices",
    {
      method: "POST",
      body: payload,
    },
    "Failed to save invoice."
  );

export const sharePortalInvoice = async (invoiceNumber) =>
  authorizedFetch(
    `/api/portal/invoices/${invoiceNumber}/share`,
    {
      method: "POST",
    },
    "Failed to share invoice."
  );

export const fetchPortalCompany = async () =>
  authorizedFetch(
    "/api/portal/monitoring/pos/company",
    {},
    "Failed to load company details."
  );

export const fetchPortalPosMonitoringOverview = async () =>
  authorizedFetch(
    "/api/portal/monitoring/pos/overview",
    {},
    "Failed to load POS monitoring."
  );

export const fetchPortalPosPoint = async (posPointId) =>
  authorizedFetch(
    `/api/portal/monitoring/pos/points/${posPointId}`,
    {},
    "Failed to load POS station."
  );

export const fetchPortalPosPointSessions = async (posPointId) =>
  authorizedFetch(
    `/api/portal/monitoring/pos/points/${posPointId}/sessions`,
    {},
    "Failed to load session history."
  );

export const fetchPortalPosSessionDetail = async (sessionId) =>
  authorizedFetch(
    `/api/portal/monitoring/pos/sessions/${sessionId}/detail`,
    {},
    "Failed to load session details."
  );

export const fetchPortalPosSessionSummary = async (sessionId) =>
  authorizedFetch(
    `/api/portal/monitoring/pos/sessions/${sessionId}/summary`,
    {},
    "Failed to load session summary."
  );

export const fetchPortalPosAggregateSummary = async ({ from, to, posPointId }) =>
  authorizedFetch(
    "/api/portal/monitoring/pos/sessions/aggregate-summary",
    {
      params: {
        from,
        to,
        pos_point_id: posPointId || "",
      },
    },
    "Failed to load aggregated summary."
  );

export const createPortalPosPoint = async (payload) =>
  authorizedFetch(
    "/api/portal/monitoring/pos/points",
    {
      method: "POST",
      body: payload,
    },
    "Failed to create POS station."
  );

export const updatePortalPosPoint = async (posPointId, payload) =>
  authorizedFetch(
    `/api/portal/monitoring/pos/points/${posPointId}`,
    {
      method: "PUT",
      body: payload,
    },
    "Failed to update POS station."
  );

export const forceClosePortalPosSession = async (sessionId, payload = {}) =>
  authorizedFetch(
    `/api/portal/monitoring/pos/sessions/${sessionId}/force-close`,
    {
      method: "POST",
      body: payload,
    },
    "Failed to force-close the session."
  );
