const SQL_IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_$]*$/;

const assertSafeSqlIdentifier = (value, label = "SQL identifier") => {
  const normalized = String(value || "").trim();

  if (!SQL_IDENTIFIER_PATTERN.test(normalized)) {
    throw new Error(`${label} is invalid`);
  }

  return normalized;
};

const quoteIdentifier = (value, label) =>
  `"${assertSafeSqlIdentifier(value, label).replace(/"/g, "\"\"")}"`;

const setTenantSearchPath = async (db, schemaName) => {
  const quotedSchema = quoteIdentifier(schemaName, "Tenant schema");
  await db.query(`SET search_path TO ${quotedSchema}, public`);
};

module.exports = {
  assertSafeSqlIdentifier,
  setTenantSearchPath,
};
