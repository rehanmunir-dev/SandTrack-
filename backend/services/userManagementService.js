import bcrypt from 'bcryptjs'

const ALLOWED_ROLES = ['ADMIN', 'OPERATOR', 'DRIVER', 'WATCHMAN', 'ACCOUNTANT']

const PROFILE_CONFIG = {
  ADMIN: { table: 'super_admin_profiles' },
  OPERATOR: { table: 'operator_profiles' },
  DRIVER: { table: 'driver_profiles' },
  WATCHMAN: { table: 'watchman_profiles' },
  ACCOUNTANT: { table: 'accountant_profiles' },
}

export function normalizeRole(role) {
  const normalized = String(role || '').trim().toUpperCase()
  if (normalized === 'SUPER_ADMIN') {
    return 'ADMIN'
  }
  return normalized === 'TERMINAL_OPERATOR' ? 'OPERATOR' : normalized
}

export function validateRole(role) {
  return ALLOWED_ROLES.includes(role)
}

async function getRoleId(client, role) {
  const roleRow = await client.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [role])
  if (!roleRow.rows[0]) {
    throw new Error(`Role ${role} is not present in roles table.`)
  }
  return roleRow.rows[0].id
}

async function upsertProfile(client, { role, userId, name, phone, cnic, organizationId }) {
  const table = PROFILE_CONFIG[role]?.table
  if (!table) {
    return
  }

  if (role === 'DRIVER') {
    const licenseNo = `AUTO-${String(userId).slice(0, 8).toUpperCase()}`
    const insertedDriver = await client.query(
      `
      INSERT INTO drivers (organization_id, full_name, cnic, license_no, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      RETURNING id
      `,
      [organizationId, name, cnic || null, licenseNo, phone || null],
    )

    await client.query(
      `
      INSERT INTO driver_profiles (user_id, organization_id, driver_id, name, phone, cnic)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE
      SET name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          cnic = EXCLUDED.cnic,
          updated_at = NOW()
      `,
      [userId, organizationId, insertedDriver.rows[0].id, name, phone || null, cnic || null],
    )

    return
  }

  await client.query(
    `
    INSERT INTO ${table} (user_id, organization_id, name, phone)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id) DO UPDATE
    SET name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        updated_at = NOW()
    `,
    [userId, organizationId, name, phone || null],
  )
}

export async function createUserWithProfile(client, {
  organizationId,
  assignedByUserId,
  username,
  password,
  role,
  name,
  phone,
  email,
  cnic,
  permissions,
}) {
  const passwordHash = await bcrypt.hash(password, 10)

  const insertedUser = await client.query(
    `
    INSERT INTO users (organization_id, username, email, password_hash, full_name, phone, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, TRUE)
    RETURNING id, organization_id, username, email, full_name, phone, is_active, created_at
    `,
    [organizationId, username, email || null, passwordHash, name, phone || null],
  )

  const user = insertedUser.rows[0]
  const roleId = await getRoleId(client, role)

  await client.query(
    `
    INSERT INTO user_roles (user_id, role_id, site_id, assigned_by_user_id, is_active)
    VALUES ($1, $2, NULL, $3, TRUE)
    ON CONFLICT (user_id, role_id, site_id) DO NOTHING
    `,
    [user.id, roleId, assignedByUserId || null],
  )

  await client.query(
    `
    INSERT INTO user_onboarding_queue (user_id, role_name, created_by_user_id, payload)
    VALUES ($1, $2, $3, $4::jsonb)
    `,
    [
      user.id,
      role,
      assignedByUserId || null,
      JSON.stringify({ name, phone: phone || null, email: email || null, cnic: cnic || null }),
    ],
  )

  await client.query(
    `
    INSERT INTO user_feature_permissions (user_id, permissions)
    VALUES ($1, $2::jsonb)
    ON CONFLICT (user_id) DO UPDATE
    SET permissions = EXCLUDED.permissions,
        updated_at = NOW()
    `,
    [user.id, JSON.stringify(permissions || {})],
  )

  await upsertProfile(client, {
    role,
    userId: user.id,
    name,
    phone,
    cnic,
    organizationId,
  })

  return {
    ...user,
    role,
  }
}

export async function setUserRole(client, { userId, role, assignedByUserId }) {
  const roleId = await getRoleId(client, role)

  await client.query('UPDATE user_roles SET is_active = FALSE WHERE user_id = $1', [userId])
  await client.query(
    `
    INSERT INTO user_roles (user_id, role_id, site_id, assigned_by_user_id, is_active)
    VALUES ($1, $2, NULL, $3, TRUE)
    ON CONFLICT (user_id, role_id, site_id) DO UPDATE
    SET is_active = TRUE,
        assigned_by_user_id = EXCLUDED.assigned_by_user_id,
        assigned_at = NOW()
    `,
    [userId, roleId, assignedByUserId || null],
  )
}

export async function upsertUserProfileForRole(client, { userId, organizationId, role, name, phone, cnic }) {
  await upsertProfile(client, { userId, organizationId, role, name, phone, cnic })
}
