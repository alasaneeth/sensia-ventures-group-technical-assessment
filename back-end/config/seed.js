const { pool } = require("./db");
const bcrypt = require("bcrypt");

const seed = async () => {
  try {
    console.log("Seeding started...");

    // Password hashing
    const adminPassword = await bcrypt.hash("Admin@123", 10);
    const clientPassword = await bcrypt.hash("Client@123", 10);

    // Insert ADMIN user
    const adminRes = await pool.query(
      `INSERT INTO users (username, email, password, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id`,
      ["admin", "admin@example.com", adminPassword]
    );
    const adminId = adminRes.rows[0].id;

    // Insert ADMIN role
    const adminRoleRes = await pool.query(
      `INSERT INTO roles (name)
       VALUES ('admin')
       ON CONFLICT (name) DO NOTHING
       RETURNING id`
    );

    const adminRoleId =
      adminRoleRes.rows.length > 0 ? adminRoleRes.rows[0].id : 1;

    // Link ADMIN role
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [adminId, adminRoleId]
    );

    // Full admin permissions
    const features = ["products", "clients", "orders", "comments", "users"];
    for (const feature of features) {
      await pool.query(
        `INSERT INTO user_permissions
         (user_id, feature, can_view, can_create, can_update, can_delete)
         VALUES ($1, $2, TRUE, TRUE, TRUE, TRUE)`,
        [adminId, feature]
      );
    }

    // Insert CLIENT user
    const clientRes = await pool.query(
      `INSERT INTO users (username, email, password, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id`,
      ["client_user", "client@example.com", clientPassword]
    );
    const clientId = clientRes.rows[0].id;

    // Insert CLIENT role
    const clientRoleRes = await pool.query(
      `INSERT INTO roles (name)
       VALUES ('client')
       ON CONFLICT (name) DO NOTHING
       RETURNING id`
    );
    const clientRoleId =
      clientRoleRes.rows.length > 0 ? clientRoleRes.rows[0].id : 2;

    // Link CLIENT role
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [clientId, clientRoleId]
    );

    // Limited permissions
    await pool.query(
      `INSERT INTO user_permissions
       (user_id, feature, can_view, can_create, can_update, can_delete)
       VALUES
       ($1, 'clients', TRUE, FALSE, FALSE, FALSE),
       ($1, 'orders', TRUE, TRUE, FALSE, FALSE),
       ($1, 'products', TRUE, FALSE, FALSE, FALSE),
       ($1, 'comments', TRUE, FALSE, FALSE, FALSE)`,
      [clientId]
    );

    console.log("✅ Seeder completed successfully!");

  } catch (error) {
    console.error("❌ Seeder error:", error);
  } finally {
    pool.end();
  }
};

seed();
