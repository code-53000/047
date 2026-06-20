SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS workstudy DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE workstudy;

DROP TABLE IF EXISTS work_hours;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS positions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    contact_name VARCHAR(50) NOT NULL,
    contact_phone VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    role ENUM('student', 'department', 'admin') NOT NULL,
    student_no VARCHAR(30),
    class VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    department_id INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_role (role),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    department_id INT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    weekly_hours INT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 15.00,
    max_workers INT NOT NULL DEFAULT 1,
    current_workers INT NOT NULL DEFAULT 0,
    status ENUM('open', 'closed', 'archived') DEFAULT 'open',
    semester VARCHAR(50) NOT NULL,
    location VARCHAR(200),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    position_id INT NOT NULL,
    student_id INT NOT NULL,
    motivation TEXT,
    relevant_experience TEXT,
    status ENUM('pending', 'approved', 'rejected', 'assigned') DEFAULT 'pending',
    review_comment TEXT,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    assigned_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_position_student (position_id, student_id),
    INDEX idx_status (status),
    INDEX idx_student (student_id),
    INDEX idx_position (position_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE work_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    position_id INT NOT NULL,
    student_id INT NOT NULL,
    work_date DATE NOT NULL,
    hours DECIMAL(4,1) NOT NULL,
    work_content TEXT,
    status ENUM('submitted', 'approved', 'rejected') DEFAULT 'submitted',
    reviewed_by INT,
    review_comment TEXT,
    reviewed_at TIMESTAMP NULL,
    month VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student_month (student_id, month),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO departments (name, contact_name, contact_phone, description) VALUES
('图书馆', '李馆长', '13800000001', '学校图书馆，负责图书借还、整理等工作'),
('食堂管理处', '王主任', '13800000002', '学校后勤集团食堂管理处'),
('行政楼', '张主任', '13800000003', '学校行政办公大楼'),
('教务处', '赵老师', '13800000004', '教务处日常办公辅助'),
('学生处', '钱老师', '13800000005', '学生工作处日常事务');

INSERT INTO users (username, password, real_name, role, student_no, class, phone, email, department_id, status) VALUES
('admin', '$2a$10$eF/v/u2CVGEmxGJnHABDSO1.ZHAwALQI0UXX4WQJPPJ3NYktAzoNa', '管理员老师', 'admin', NULL, NULL, '13800000100', 'admin@school.edu.cn', NULL, 'active'),
('lib_manager', '$2a$10$eF/v/u2CVGEmxGJnHABDSO1.ZHAwALQI0UXX4WQJPPJ3NYktAzoNa', '李馆长', 'department', NULL, NULL, '13800000001', 'lib@school.edu.cn', 1, 'active'),
('canteen_manager', '$2a$10$eF/v/u2CVGEmxGJnHABDSO1.ZHAwALQI0UXX4WQJPPJ3NYktAzoNa', '王主任', 'department', NULL, NULL, '13800000002', 'canteen@school.edu.cn', 2, 'active'),
('admin_office', '$2a$10$eF/v/u2CVGEmxGJnHABDSO1.ZHAwALQI0UXX4WQJPPJ3NYktAzoNa', '张主任', 'department', NULL, NULL, '13800000003', 'admin_office@school.edu.cn', 3, 'active'),
('student001', '$2a$10$eF/v/u2CVGEmxGJnHABDSO1.ZHAwALQI0UXX4WQJPPJ3NYktAzoNa', '张三', 'student', '2024001', '计算机2401班', '13900000001', 'zhangsan@school.edu.cn', NULL, 'active'),
('student002', '$2a$10$eF/v/u2CVGEmxGJnHABDSO1.ZHAwALQI0UXX4WQJPPJ3NYktAzoNa', '李四', 'student', '2024002', '计算机2401班', '13900000002', 'lisi@school.edu.cn', NULL, 'active'),
('student003', '$2a$10$eF/v/u2CVGEmxGJnHABDSO1.ZHAwALQI0UXX4WQJPPJ3NYktAzoNa', '王五', 'student', '2024003', '软件工程2401班', '13900000003', 'wangwu@school.edu.cn', NULL, 'active'),
('student004', '$2a$10$eF/v/u2CVGEmxGJnHABDSO1.ZHAwALQI0UXX4WQJPPJ3NYktAzoNa', '赵六', 'student', '2024004', '软件工程2401班', '13900000004', 'zhaoliu@school.edu.cn', NULL, 'active'),
('student005', '$2a$10$eF/v/u2CVGEmxGJnHABDSO1.ZHAwALQI0UXX4WQJPPJ3NYktAzoNa', '孙七', 'student', '2024005', '机械工程2401班', '13900000005', 'sunqi@school.edu.cn', NULL, 'active'),
('student006', '$2a$10$eF/v/u2CVGEmxGJnHABDSO1.ZHAwALQI0UXX4WQJPPJ3NYktAzoNa', '周八', 'student', '2024006', '电子信息2401班', '13900000006', 'zhouba@school.edu.cn', NULL, 'active');

INSERT INTO positions (title, department_id, description, requirements, weekly_hours, hourly_rate, max_workers, current_workers, status, semester, location, created_by) VALUES
('图书整理员', 1, '负责图书上架、整理、书架清洁等工作，协助读者查找图书。', '工作认真细致，有责任心，每周至少能到岗2天。熟悉图书分类者优先。', 10, 15.00, 3, 0, 'open', '2025-2026学年第二学期', '图书馆各楼层书库', 2),
('前台借还助理', 1, '协助前台老师办理图书借还手续，解答读者咨询。', '形象端正，沟通能力强，有服务意识。', 8, 15.00, 2, 0, 'open', '2025-2026学年第二学期', '图书馆一楼前台', 2),
('食堂餐盘回收', 2, '在就餐高峰期负责回收餐盘、清理桌面、保持餐厅整洁。', '吃苦耐劳，能适应午餐和晚餐高峰期工作。', 12, 14.00, 4, 0, 'open', '2025-2026学年第二学期', '第一食堂、第二食堂', 3),
('食堂窗口协助', 2, '协助食堂窗口打菜、刷卡、维护排队秩序。', '身体健康，持有健康证，卫生意识强。', 10, 14.00, 3, 0, 'open', '2025-2026学年第二学期', '第一食堂', 3),
('行政楼前台接待', 3, '负责行政楼前台来访登记、电话接听、文件传递等工作。', '形象气质佳，普通话标准，熟练使用Office办公软件。', 8, 16.00, 2, 0, 'open', '2025-2026学年第二学期', '行政楼一楼大厅', 4),
('会议室服务', 3, '负责行政楼会议室准备、会议服务、会后整理工作。', '工作细心，有服务意识，能灵活安排时间配合会议需求。', 6, 15.00, 2, 0, 'open', '2025-2026学年第二学期', '行政楼各会议室', 4);

INSERT INTO applications (position_id, student_id, motivation, relevant_experience, status, review_comment, reviewed_by, reviewed_at, assigned_at, created_at) VALUES
(1, 5, '我平时喜欢看书，对图书馆环境很熟悉，想通过勤工俭学减轻家庭负担。', '高中时在班级担任过图书管理员。', 'assigned', '符合条件，录用', 1, '2026-02-20 10:00:00', '2026-02-20 10:00:00', '2026-02-18 09:00:00'),
(1, 6, '希望能在安静的环境中工作，同时利用闲暇时间看书学习。', '有整理物品的经验，做事细心。', 'pending', NULL, NULL, NULL, NULL, '2026-02-19 14:30:00'),
(2, 7, '想锻炼自己的沟通和服务能力。', '之前做过商场导购兼职。', 'approved', '条件优秀', 1, '2026-02-21 11:00:00', NULL, '2026-02-19 10:15:00'),
(3, 8, '家庭条件一般，想赚取生活费，不怕吃苦。', '寒暑假在餐馆打过工。', 'pending', NULL, NULL, NULL, NULL, '2026-02-20 16:00:00'),
(3, 9, '能吃苦耐劳，适应高强度工作。', '在家经常帮父母干农活。', 'pending', NULL, NULL, NULL, NULL, '2026-02-20 18:20:00'),
(5, 10, '想锻炼办公软件操作能力和待人接物能力。', '担任过学生会干事，熟练使用Word和Excel。', 'pending', NULL, NULL, NULL, NULL, '2026-02-21 08:45:00');

UPDATE positions SET current_workers = 1, status = CASE WHEN current_workers >= max_workers THEN 'closed' ELSE 'open' END WHERE id = 1;

INSERT INTO work_hours (application_id, position_id, student_id, work_date, hours, work_content, status, reviewed_by, review_comment, reviewed_at, month) VALUES
(1, 1, 5, '2026-06-02', 4.0, '整理三楼文学类图书，上架归还图书120册', 'approved', 2, '工作认真', '2026-06-05 10:00:00', '2026-06'),
(1, 1, 5, '2026-06-04', 4.0, '协助读者查找图书，整理书架', 'approved', 2, '按时到岗', '2026-06-05 10:00:00', '2026-06'),
(1, 1, 5, '2026-06-09', 4.0, '整理二楼科技类图书区域', 'submitted', NULL, NULL, NULL, '2026-06'),
(1, 1, 5, '2026-06-11', 4.0, '前台临时协助借还书', 'submitted', NULL, NULL, NULL, '2026-06'),
(1, 1, 5, '2026-05-15', 8.0, '图书馆整理图书', 'approved', 2, 'OK', '2026-05-20 10:00:00', '2026-05'),
(1, 1, 5, '2026-05-22', 8.0, '图书馆整理图书', 'approved', 2, 'OK', '2026-05-25 10:00:00', '2026-05');
