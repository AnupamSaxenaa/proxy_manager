CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

CREATE TABLE IF NOT EXISTS departments (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY code (code)
);

CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','faculty','student') NOT NULL DEFAULT 'student',
  enrollment_no VARCHAR(50) DEFAULT NULL,
  department_id INT DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY email (email),
  UNIQUE KEY enrollment_no (enrollment_no),
  KEY idx_users_role (role),
  KEY idx_users_department (department_id),
  CONSTRAINT users_ibfk_1 FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL,
  department_id INT NOT NULL,
  semester INT DEFAULT NULL,
  credits INT DEFAULT 3,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY code (code),
  KEY department_id (department_id),
  CONSTRAINT courses_ibfk_1 FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS classes (
  id INT NOT NULL AUTO_INCREMENT,
  course_id INT NOT NULL,
  faculty_id INT NOT NULL,
  room_no VARCHAR(50) DEFAULT NULL,
  day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  section VARCHAR(10) DEFAULT 'A',
  semester INT DEFAULT NULL,
  academic_year VARCHAR(20) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY course_id (course_id),
  KEY faculty_id (faculty_id),
  CONSTRAINT classes_ibfk_1 FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT classes_ibfk_2 FOREIGN KEY (faculty_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_sessions (
  id INT NOT NULL AUTO_INCREMENT,
  class_id INT NOT NULL,
  session_date DATE NOT NULL,
  topic VARCHAR(255) DEFAULT NULL,
  status ENUM('scheduled','ongoing','completed','cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_session (class_id, session_date),
  KEY idx_class_sessions_date (session_date),
  CONSTRAINT class_sessions_ibfk_1 FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_classes (
  id INT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  enrolled_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_enrollment (student_id, class_id),
  KEY class_id (class_id),
  CONSTRAINT student_classes_ibfk_1 FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT student_classes_ibfk_2 FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id INT NOT NULL AUTO_INCREMENT,
  session_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('present','absent','late','excused') DEFAULT 'absent',
  marked_by ENUM('qr','manual','wifi','facial') DEFAULT 'manual',
  marked_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) DEFAULT NULL,
  device_info VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY unique_attendance (session_id, student_id),
  KEY idx_attendance_student (student_id),
  KEY idx_attendance_session (session_id),
  CONSTRAINT attendance_records_ibfk_1 FOREIGN KEY (session_id) REFERENCES class_sessions (id) ON DELETE CASCADE,
  CONSTRAINT attendance_records_ibfk_2 FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_windows (
  id INT NOT NULL AUTO_INCREMENT,
  session_id INT NOT NULL,
  opened_by INT NOT NULL,
  method ENUM('face','qr','both') DEFAULT 'face',
  opens_at TIMESTAMP NOT NULL,
  closes_at TIMESTAMP NULL DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  allowed_network VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY opened_by (opened_by),
  KEY idx_window_session (session_id),
  KEY idx_window_active (is_active),
  CONSTRAINT attendance_windows_ibfk_1 FOREIGN KEY (session_id) REFERENCES class_sessions (id) ON DELETE CASCADE,
  CONSTRAINT attendance_windows_ibfk_2 FOREIGN KEY (opened_by) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS qr_sessions (
  id INT NOT NULL AUTO_INCREMENT,
  session_id INT NOT NULL,
  qr_token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY qr_token (qr_token),
  KEY session_id (session_id),
  KEY idx_qr_token (qr_token),
  CONSTRAINT qr_sessions_ibfk_1 FOREIGN KEY (session_id) REFERENCES class_sessions (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('alert','info','warning','attendance') DEFAULT 'info',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id, is_read),
  CONSTRAINT notifications_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS face_embeddings (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  embedding JSON NOT NULL,
  photo_data LONGTEXT,
  label VARCHAR(50) DEFAULT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_face_user (user_id),
  CONSTRAINT face_embeddings_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS face_scan_logs (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  session_id INT NOT NULL,
  match_score FLOAT DEFAULT NULL,
  liveness_passed TINYINT(1) DEFAULT 0,
  result ENUM('success','no_match','liveness_fail','error') NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  device_info VARCHAR(255) DEFAULT NULL,
  scan_photo LONGTEXT,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_scan_user (user_id),
  KEY idx_scan_session (session_id),
  CONSTRAINT face_scan_logs_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT face_scan_logs_ibfk_2 FOREIGN KEY (session_id) REFERENCES class_sessions (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wifi_zones (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  bssid VARCHAR(50) DEFAULT NULL,
  ssid VARCHAR(100) DEFAULT NULL,
  room_no VARCHAR(50) DEFAULT NULL,
  building VARCHAR(100) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
