-- Migration to normalize existing emails to lowercase
-- This ensures all existing data is consistent with the new normalization policy

-- First, remove duplicate emails (keeping the earliest created record for each normalized email)
DELETE FROM early_access_request_table 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM early_access_request_table 
    GROUP BY LOWER(TRIM(email))
);

-- Then normalize all remaining emails to lowercase
UPDATE early_access_request_table 
SET email = LOWER(TRIM(email)) 
WHERE email != LOWER(TRIM(email));

-- Note: This migration:
-- 1. Removes duplicate emails (keeping the first occurrence)  
-- 2. Normalizes all emails to lowercase + trimmed
-- 3. Ensures unique constraint compatibility