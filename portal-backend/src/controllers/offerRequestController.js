const { insertOfferRequest } = require("../services/offerRequestService");

const ALLOWED_BUSINESS_TYPES = new Set([
  "Retail",
  "Restaurant / Cafe",
  "Services",
  "Wholesale",
  "Other",
]);

const normalizeText = (value) => {
  if (value == null) {
    return "";
  }

  return String(value).trim();
};

const normalizeOptionalText = (value) => {
  const normalized = normalizeText(value);
  return normalized || null;
};

const normalizeOptionalInteger = (value) => {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

exports.submitOfferRequest = async (req, res) => {
  const fullName = normalizeText(req.body.full_name);
  const businessName = normalizeText(req.body.business_name);
  const phoneNumber = normalizeText(req.body.phone_number);
  const email = normalizeOptionalText(req.body.email);
  const cityLocation = normalizeOptionalText(req.body.city_location);
  const branchCount = normalizeOptionalInteger(req.body.branch_count);
  const userCount = normalizeOptionalInteger(req.body.user_count);
  const businessType = normalizeText(req.body.business_type);
  const notes = normalizeOptionalText(req.body.notes);
  const locale = normalizeOptionalText(req.body.locale);
  const interestedModules = Array.isArray(req.body.interested_modules)
    ? req.body.interested_modules
        .map((value) => normalizeText(value))
        .filter(Boolean)
        .slice(0, 20)
    : [];

  if (!fullName || !businessName || !phoneNumber || !businessType) {
    return res.status(400).json({
      ok: false,
      message:
        "full_name, business_name, phone_number, and business_type are required",
    });
  }

  if (!ALLOWED_BUSINESS_TYPES.has(businessType)) {
    return res.status(400).json({
      ok: false,
      message: "business_type is invalid",
    });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({
      ok: false,
      message: "email must be a valid email address",
    });
  }

  if (Number.isNaN(branchCount) || Number.isNaN(userCount)) {
    return res.status(400).json({
      ok: false,
      message: "branch_count and user_count must be valid positive numbers",
    });
  }

  try {
    const submission = await insertOfferRequest({
      fullName,
      businessName,
      phoneNumber,
      email,
      cityLocation,
      branchCount,
      userCount,
      businessType,
      interestedModules,
      notes,
      locale,
      userAgent: normalizeOptionalText(req.get("user-agent")),
      submittedFromIp: normalizeOptionalText(req.ip),
    });

    return res.status(201).json({
      ok: true,
      message: "Offer request saved successfully",
      submission,
    });
  } catch (error) {
    console.error("Failed to save offer request:", error);

    return res.status(500).json({
      ok: false,
      message: "Failed to save offer request",
    });
  }
};
