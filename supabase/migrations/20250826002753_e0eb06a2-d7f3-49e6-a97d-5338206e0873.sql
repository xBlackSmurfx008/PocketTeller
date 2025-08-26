
-- Ensure the 'extensions' schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Install pgcrypto in the 'extensions' schema so functions like gen_random_bytes and
-- pgp_sym_encrypt_bytea are available to our SECDEF functions that set search_path to 'public, extensions'
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Optional: if pgcrypto was previously installed in another schema, standardize it
ALTER EXTENSION pgcrypto SET SCHEMA extensions;
