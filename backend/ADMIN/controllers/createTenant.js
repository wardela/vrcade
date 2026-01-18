import bcrypt from "bcrypt";
import pool from "../../config/db.js";
import createTenantTables from "../../utils/createTenantTables.js";
export async function createTenant(req, res) {
  const {
    tenant_name,
    tenant_code,
    owner_username,
    owner_password,
    license_start,
    license_end
  } = req.body;

  if (!tenant_name || !tenant_code || !owner_username || !owner_password) {
    return res.status(400).json({
      message: "Missing required fields"
    });
  }

  // EXACT SAME schema logic (no changes except style)
  const schemaName = `tenant_${tenant_code
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")}`;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ==================================================
    // 1. Ensure schema does not already exist
    // ==================================================
    const existingTenant = await client.query(
      `SELECT 1 FROM public.tenants WHERE schema_name = $1`,
      [schemaName]
    );

    if (existingTenant.rowCount > 0) {
      throw new Error("Tenant schema already exists");
    }

    // ==================================================
    // 2. Insert tenant into PUBLIC.tenants
    // ==================================================
    await client.query(
      `
      INSERT INTO public.tenants
      (tenant_name, tenant_code, schema_name, license_start, license_end, active)
      VALUES ($1, $2, $3, $4, $5, true)
      `,
      [
        tenant_name,
        tenant_code,
        schemaName,
        license_start || new Date(),
        license_end || null
      ]
    );

    // ==================================================
    // 3. Create tenant schema
    // ==================================================
    await createTenantTables(client, schemaName);

    // ==================================================
    // 4. Create OWNER user
    // ==================================================
    const passwordHash = await bcrypt.hash(owner_password, 12);

    const userResult = await client.query(
      `
      INSERT INTO ${schemaName}.users
      (username, password, full_name, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id
      `,
      [owner_username, passwordHash, owner_username]
    );

    const userId = userResult.rows[0].id;

    // ==================================================
    // 5. Grant FULL permissions (MODULE-BASED)
    // ==================================================
    const modules = [
      "dashboard",
      "sales",
      "refunds",
      "items",
      "stock_management",
      "clients",
      "reports",
      "users",
      "company_config",
      "einvoicing"
    ];

    for (const module of modules) {
      await client.query(
        `
        INSERT INTO ${schemaName}.user_permissions
        (user_id, module, can_view, can_add, can_edit, can_delete, created_at, updated_at)
        VALUES ($1, $2, true, true, true, true, NOW(), NOW())
        `,
        [userId, module]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Tenant created successfully",
      schema: schemaName
    });

  } catch (err) {
    await client.query("ROLLBACK");

    console.error("❌ Tenant creation failed:", err.message);

    return res.status(500).json({
      message: "Tenant creation failed",
      error: err.message
    });

  } finally {
    client.release();
  }
}