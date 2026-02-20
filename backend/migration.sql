-- 1. Add section and sub_section to users table
ALTER TABLE users 
ADD COLUMN section VARCHAR(10) DEFAULT NULL,
ADD COLUMN sub_section VARCHAR(10) DEFAULT NULL;

-- 2. Create calendar_events table
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

-- 3. Clear existing students who do not have a section or sub_section
DELETE FROM users 
WHERE role = 'student' 
  AND (section IS NULL OR sub_section IS NULL OR section = '' OR sub_section = '');
