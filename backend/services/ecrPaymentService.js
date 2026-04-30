const axios = require("axios");
const https = require("https");

const DEFAULT_TIMEOUT_MS = 90000;
const DEFAULT_CURRENCY_CODE = "400";
const DEFAULT_PRINT_POS_RECEIPT = "3";

const createEcrError = (message, statusCode = 400, code = "ECR_PAYMENT_ERROR", details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const isFalseEnvValue = (value) =>
  ["0", "false", "no", "off"].includes(String(value ?? "").trim().toLowerCase());

const getTagValue = (xml, tagName) => {
  if (!xml) return "";
  const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(xml).match(new RegExp(`<(?:\\w+:)?${escapedTag}\\b[^>]*>([\\s\\S]*?)</(?:\\w+:)?${escapedTag}>`, "i"));
  return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
};

const normalizeAmount = (amount) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw createEcrError("Card payment amount must be greater than zero", 400, "ECR_AMOUNT_INVALID");
  }

  return numeric.toFixed(3);
};

const normalizePrintPosReceipt = (value) => {
  const normalized = String(value ?? DEFAULT_PRINT_POS_RECEIPT).trim().toLowerCase();
  if (["true", "yes", "1", "merchant"].includes(normalized)) return "1";
  if (["2", "customer"].includes(normalized)) return "2";
  if (["3", "both"].includes(normalized)) return "3";
  return DEFAULT_PRINT_POS_RECEIPT;
};

const normalizeEcrText = (value, fieldName, maxLength, { required = false, truncate = false } = {}) => {
  const text = String(value ?? "").trim();
  if (required && !text) {
    throw createEcrError(`${fieldName} is required`, 400, "ECR_FIELD_REQUIRED");
  }
  if (text.length <= maxLength) return text;
  if (truncate) return text.slice(0, maxLength);
  throw createEcrError(`${fieldName} must be ${maxLength} characters or less`, 400, "ECR_FIELD_TOO_LONG", {
    fieldName,
    maxLength,
  });
};

const normalizeMaskedPan = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;
  if (/[xX*]/.test(text)) return text;

  const digits = text.replace(/\D/g, "");
  if (digits.length < 6) return null;
  return `${digits.slice(0, 6)}******${digits.slice(-4)}`;
};

const getOperationalConfig = () => {
  const serviceUrl = String(process.env.ECR_SERVICE_URL || "").trim();
  if (!serviceUrl) {
    throw createEcrError(
      "ECR service URL is not configured",
      503,
      "ECR_SERVICE_URL_MISSING",
    );
  }

  return {
    serviceUrl,
    currencyCode: String(process.env.ECR_CURRENCY_CODE || DEFAULT_CURRENCY_CODE).trim(),
    soapAction: String(process.env.ECR_SOAP_ACTION || "http://tempuri.org/IEcrPayoneWebInterface/FinancialTxn").trim(),
    tenant: String(process.env.ECR_TENANT || "").trim(),
    printerWidth: Number.parseInt(process.env.ECR_PRINTER_WIDTH || "40", 10) || 40,
    printPosReceipt: normalizePrintPosReceipt(process.env.ECR_PRINT_POS_RECEIPT),
    timeoutMs: Number.parseInt(process.env.ECR_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS), 10) || DEFAULT_TIMEOUT_MS,
    tlsRejectUnauthorized: !isFalseEnvValue(process.env.ECR_TLS_REJECT_UNAUTHORIZED),
  };
};

const getPosEcrCredentials = async (db, posPointId) => {
  const parsedPosPointId = Number.parseInt(posPointId, 10);
  if (!Number.isInteger(parsedPosPointId) || parsedPosPointId <= 0) {
    throw createEcrError("Invalid POS station id", 400, "POS_POINT_INVALID_ID");
  }

  const result = await db.query(
    `
      SELECT
        id,
        name,
        has_ecr,
        ecr_mid,
        ecr_tid,
        ecr_secure_key
      FROM pos_points
      WHERE id = $1
      LIMIT 1
    `,
    [parsedPosPointId],
  );

  const posPoint = result.rows[0];
  if (!posPoint) {
    throw createEcrError("POS station not found", 404, "POS_POINT_NOT_FOUND");
  }

  if (posPoint.has_ecr !== true) {
    throw createEcrError(
      "This POS station is not connected to a Visa terminal",
      409,
      "POS_POINT_ECR_DISABLED",
      { posPointId: parsedPosPointId },
    );
  }

  const missing = [
    ["ecr_mid", posPoint.ecr_mid],
    ["ecr_tid", posPoint.ecr_tid],
    ["ecr_secure_key", posPoint.ecr_secure_key],
  ]
    .filter(([, value]) => !String(value || "").trim())
    .map(([field]) => field);

  if (missing.length > 0) {
    throw createEcrError(
      `POS station ECR configuration is missing: ${missing.join(", ")}`,
      409,
      "POS_POINT_ECR_CONFIG_MISSING",
      { posPointId: parsedPosPointId, missing },
    );
  }

  return {
    posPointId: parsedPosPointId,
    posPointName: posPoint.name,
    mid: String(posPoint.ecr_mid).trim(),
    tid: String(posPoint.ecr_tid).trim(),
    merchantSecureKey: String(posPoint.ecr_secure_key).trim(),
  };
};

const getCompanyEcrConfig = async (db) => {
  const result = await db.query(
    `
      SELECT ecr_integrator_name
      FROM company_config
      ORDER BY id DESC
      LIMIT 1
    `,
  );

  return {
    integratorName: String(result.rows[0]?.ecr_integrator_name || "").trim(),
  };
};

const getEcrConfig = async ({ db, posPointId }) => {
  if (!db) {
    throw createEcrError("Tenant database context is required", 500, "ECR_DB_CONTEXT_REQUIRED");
  }

  const [operationalConfig, posCredentials, companyConfig] = await Promise.all([
    Promise.resolve(getOperationalConfig()),
    getPosEcrCredentials(db, posPointId),
    getCompanyEcrConfig(db),
  ]);

  return {
    ...operationalConfig,
    ...posCredentials,
    integratorName: companyConfig.integratorName,
  };
};

const buildPayoneFinancialTxnRequestXml = ({
  config,
  amount,
  invoiceNumber,
  referenceNumber,
  tillerUsername,
  tillerFullName,
}) => `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:ae="http://schemas.datacontract.org/2004/07/Apex.Ecr.Entities" xmlns:ns="http://schemas.datacontract.org/2004/07/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:FinancialTxn>
      <tem:webReq>
        <ae:AuthCode></ae:AuthCode>
        <ae:Config>
          <ns:EcrCurrencyCode>${escapeXml(config.currencyCode)}</ns:EcrCurrencyCode>
          <ns:EcrTillerFullName>${escapeXml(tillerFullName)}</ns:EcrTillerFullName>
          <ns:EcrTillerUserName>${escapeXml(tillerUsername)}</ns:EcrTillerUserName>
          <ns:IntegratorName>${escapeXml(config.integratorName)}</ns:IntegratorName>
          <ns:MerchantSecureKey>${escapeXml(config.merchantSecureKey)}</ns:MerchantSecureKey>
          <ns:Mid>${escapeXml(config.mid)}</ns:Mid>
          <ns:Tenant>${escapeXml(config.tenant)}</ns:Tenant>
          <ns:Tid>${escapeXml(config.tid)}</ns:Tid>
        </ae:Config>
        <ae:EcrAmount>${escapeXml(amount)}</ae:EcrAmount>
        <ae:EcrUniqueTxnId>${escapeXml(referenceNumber)}</ae:EcrUniqueTxnId>
        <ae:ExpDateEncrypted></ae:ExpDateEncrypted>
        <ae:InvoiceNumber>${escapeXml(invoiceNumber)}</ae:InvoiceNumber>
        <ae:Optional1></ae:Optional1>
        <ae:Optional2></ae:Optional2>
        <ae:Optional3></ae:Optional3>
        <ae:PanEncrypted></ae:PanEncrypted>
        <ae:Printer>
          <ns:EnablePrintPosReceipt>${escapeXml(config.printPosReceipt)}</ns:EnablePrintPosReceipt>
          <ns:EnablePrintReceiptNote>0</ns:EnablePrintReceiptNote>
          <ns:InvoiceNumber>${escapeXml(invoiceNumber)}</ns:InvoiceNumber>
          <ns:PrinterWidth>${escapeXml(config.printerWidth)}</ns:PrinterWidth>
          <ns:ReceiptNote></ns:ReceiptNote>
          <ns:ReferenceNumber>${escapeXml(referenceNumber)}</ns:ReferenceNumber>
        </ae:Printer>
        <ae:TransactionType>SALE</ae:TransactionType>
      </tem:webReq>
    </tem:FinancialTxn>
  </soapenv:Body>
</soapenv:Envelope>`;

const isSuccessfulWebStatus = (value) =>
  /^(success|0|00)$/i.test(String(value ?? "").trim());

const parseEcrResponse = (rawResponse) => {
  const xml = String(rawResponse || "");
  const webResponseStatus = getTagValue(xml, "WebResponseStatus");
  const errorDescription = getTagValue(xml, "WebResponseErrorDesc");
  const posRespStatus = getTagValue(xml, "PosRespStatus");
  const posRespCode = getTagValue(xml, "PosRespCode");
  const posRespText = getTagValue(xml, "PosRespText");

  return {
    approved: isSuccessfulWebStatus(webResponseStatus) && (posRespStatus === "1" || posRespCode === "00"),
    raw: xml,
    webResponseStatus,
    errorDescription,
    posAmount: getTagValue(xml, "PosAmount"),
    posCurrencyCode: getTagValue(xml, "PosCurrencyCode"),
    posRrn: getTagValue(xml, "PosRRN"),
    posAuthCode: getTagValue(xml, "PosAuthCode"),
    posRespCode,
    posRespStatus,
    posRespText,
    posInvoiceNumber: getTagValue(xml, "PosInvoiceNumber"),
    posIssuerName: getTagValue(xml, "PosIssuerName"),
    posPan: getTagValue(xml, "PosPan"),
  };
};

const isCancellationResponse = (parsed) => {
  const responseText = [
    parsed?.webResponseStatus,
    parsed?.errorDescription,
    parsed?.posRespStatus,
    parsed?.posRespCode,
    parsed?.posRespText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /cancel|cancelled|canceled|abort|aborted|user terminated|user stop/.test(responseText);
};

const sale = async ({
  db,
  posPointId,
  amount,
  referenceNumber,
  invoiceNumber,
  tillerUsername,
  tillerFullName,
}) => {
  const config = await getEcrConfig({ db, posPointId });
  const normalizedAmount = normalizeAmount(amount);
  const requestReference = normalizeEcrText(referenceNumber, "ECR reference number", 30, {
    required: true,
  });
  const requestInvoice = normalizeEcrText(invoiceNumber || requestReference, "ECR invoice number", 30, {
    required: true,
  });
  const requestTillerUsername = normalizeEcrText(tillerUsername || "POS", "ECR tiller username", 30, {
    truncate: true,
  });
  const requestTillerFullName = normalizeEcrText(tillerFullName || requestTillerUsername, "ECR tiller full name", 30, {
    truncate: true,
  });

  const xml = buildPayoneFinancialTxnRequestXml({
    config,
    amount: normalizedAmount,
    invoiceNumber: requestInvoice,
    referenceNumber: requestReference,
    tillerUsername: requestTillerUsername,
    tillerFullName: requestTillerFullName,
  });

  let response;
  try {
    response = await axios.post(config.serviceUrl, xml, {
      timeout: config.timeoutMs,
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: `"${config.soapAction}"`,
        Accept: "text/xml, application/xml, */*",
      },
      httpsAgent: config.tlsRejectUnauthorized ? undefined : new https.Agent({ rejectUnauthorized: false }),
      transformResponse: [(data) => data],
    });
  } catch (error) {
    throw createEcrError(
      error.code === "ECONNABORTED"
        ? "Timed out waiting for the payment terminal"
        : "Failed to contact the payment terminal service",
      502,
      "ECR_GATEWAY_UNREACHABLE",
      {
        gatewayCode: error.code || null,
        httpStatus: error.response?.status || null,
      },
    );
  }

  const parsed = parseEcrResponse(response.data);
  if (!parsed.approved) {
    if (isCancellationResponse(parsed)) {
      throw createEcrError(
        "Payment cancelled",
        409,
        "ECR_PAYMENT_CANCELLED",
        {
          webResponseStatus: parsed.webResponseStatus,
          posRespStatus: parsed.posRespStatus,
          posRespCode: parsed.posRespCode,
        },
      );
    }

    throw createEcrError(
      parsed.posRespText || parsed.errorDescription || "Card transaction was not approved",
      402,
      "ECR_PAYMENT_DECLINED",
      {
        webResponseStatus: parsed.webResponseStatus,
        posRespStatus: parsed.posRespStatus,
        posRespCode: parsed.posRespCode,
        posRespText: parsed.posRespText,
        errorDescription: parsed.errorDescription,
      },
    );
  }

  return {
    approved: true,
    amount: Number(normalizedAmount),
    posPointId: config.posPointId,
    referenceNumber: requestReference,
    rrn: parsed.posRrn || null,
    authCode: parsed.posAuthCode || null,
    responseCode: parsed.posRespCode || null,
    responseText: parsed.posRespText || null,
    issuerName: parsed.posIssuerName || null,
    maskedPan: normalizeMaskedPan(parsed.posPan),
  };
};

module.exports = {
  buildPayoneFinancialTxnRequestXml,
  createEcrError,
  getEcrConfig,
  parseEcrResponse,
  sale,
};
