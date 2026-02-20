const { pool } = require('./config/db');

const migrate = async () => {
    try {
        console.log('Running face recognition schema migration...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS face_embeddings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                embedding JSON NOT NULL,
                photo_data LONGTEXT,
                label VARCHAR(50),
                is_primary BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_face_user (user_id)
            )
        `);
        console.log('✓ face_embeddings table created');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance_windows (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                opened_by INT NOT NULL,
                method ENUM('face','qr','both') DEFAULT 'face',
                opens_at TIMESTAMP NOT NULL,
                closes_at TIMESTAMP NULL,
                is_active BOOLEAN DEFAULT TRUE,
                allowed_network VARCHAR(100) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (opened_by) REFERENCES users(id),
                INDEX idx_window_session (session_id),
                INDEX idx_window_active (is_active)
            )
        `);
        console.log('✓ attendance_windows table created');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS face_scan_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                session_id INT NOT NULL,
                match_score FLOAT,
                liveness_passed BOOLEAN DEFAULT FALSE,
                result ENUM('success','no_match','liveness_fail','error') NOT NULL,
                ip_address VARCHAR(45),
                device_info VARCHAR(255),
                scan_photo LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
                INDEX idx_scan_user (user_id),
                INDEX idx_scan_session (session_id)
            )
        `);
        console.log('✓ face_scan_logs table created');

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
