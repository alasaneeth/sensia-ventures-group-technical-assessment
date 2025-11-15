const { pool } = require("./db");
const bcrypt = require("bcrypt");

const seed = async () => {
  try {
    console.log("Seeding started...");

    // Create roles first
    const roles = ["admin", "client"];
    for(const role of roles){
      await pool.query(
        'INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [role]
      );
    }

    // Hash passwords
    const adminPassword = await bcrypt.hash("Admin@123", 10);

    // Insert ADMIN user
    const adminRes = await pool.query(
      `INSERT INTO users (username, email, password, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id`,
      ["admin", "admin@example.com", adminPassword]
    );
    const adminId = adminRes.rows[0].id;

    // Get role IDs
    const adminRoleRes = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      ['admin']
    );
    const adminRoleId = adminRoleRes.rows[0].id;

    const clientRoleRes = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      ['client']
    );
    const clientRoleId = clientRoleRes.rows[0].id;

    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)`,
      [adminId, adminRoleId]
    );

   // handle user permissions based on user role 
    const allFeatures = ["products", "clients", "orders", "comments", "users"];
    for (const feature of allFeatures) {
      await pool.query(
        `INSERT INTO user_permissions
         (role_id, feature, can_view, can_create, can_update, can_delete)
         VALUES ($1, $2, TRUE, TRUE, TRUE, TRUE)`,
        [adminRoleId, feature]  
      );
    }

  
    const clientAllowedFeatures = ["products", "orders", "comments"];
    for (const feature of clientAllowedFeatures) {
      await pool.query(
        `INSERT INTO user_permissions
         (role_id, feature, can_view, can_create, can_update, can_delete)
         VALUES ($1, $2, TRUE, TRUE, TRUE, FALSE)`,
        [clientRoleId, feature]  
      );
    }


    const clientDeniedFeatures = ["clients", "users"];
    for (const feature of clientDeniedFeatures) {
      await pool.query(
        `INSERT INTO user_permissions
         (role_id, feature, can_view, can_create, can_update, can_delete)
         VALUES ($1, $2, FALSE, FALSE, FALSE, FALSE)`,
        [clientRoleId, feature] 
      );
    }

    console.log("Seeder completed successfully!");
  } catch (error) {
    console.error("Seeder error:", error);
  } finally {
    pool.end();
  }
};

seed();