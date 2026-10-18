-- ADMIN was the highest role before SUPER_ADMIN existed.
UPDATE "user"
SET role = 'SUPER_ADMIN',
    updated_at = CURRENT_TIMESTAMP
WHERE role = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1
    FROM "user" existing_super_admin
    WHERE existing_super_admin.role = 'SUPER_ADMIN'
  );
