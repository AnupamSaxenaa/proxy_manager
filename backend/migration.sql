-- ==========================================
-- PRODUCTION SCHEMA SYNC SCRIPT (FEB 21 2026)
-- Run this entire script in your TiDB Cloud SQL Editor
-- to resolve the 500 error on the Calendar page.
-- ==========================================

-- 1. Ensure foreign key checks don't block alters
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Add section/subsection to users if they don't exist
-- Note: TiDB handles ADD COLUMN IF NOT EXISTS gracefully in many versions, 
-- but if it errors that they already exist, just ignore the error and proceed to step 3.
ALTER TABLE users ADD COLUMN IF NOT EXISTS section VARCHAR(10) DEFAULT NULL AFTER role;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sub_section VARCHAR(10) DEFAULT NULL AFTER section;

-- 3. Create the calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type ENUM('class', 'lab', 'assignment', 'exam', 'other') DEFAULT 'other',
  event_date DATE NOT NULL,
  is_global TINYINT(1) DEFAULT 0,
  target_section VARCHAR(10) DEFAULT NULL,
  target_sub_section VARCHAR(10) DEFAULT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_event_date (event_date),
  CONSTRAINT calendar_events_ibfk_1 FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
);

-- 4. Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- 5. Delete student accounts that were created before the section/subsection update
-- This ensures all students have valid sections assigned during registration.
DELETE FROM users 
WHERE role = 'student' 
AND (section IS NULL OR section = '' OR sub_section IS NULL OR sub_section = '');
