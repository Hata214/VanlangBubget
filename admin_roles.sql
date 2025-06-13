-- ===============================================
-- LUỒNG DỮ LIỆU VÀ QUYỀN HẠN ADMIN/SUPERADMIN
-- ===============================================

-- Tạo cơ sở dữ liệu nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS admin_management;
USE admin_management;

-- ===============================================
-- CẤU TRÚC BẢNG DỮ LIỆU
-- ===============================================

-- Bảng vai trò người dùng
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng quyền hạn
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng liên kết vai trò và quyền hạn
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Bảng admin
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (created_by) REFERENCES admins(id)
);

-- Bảng lịch sử hoạt động của admin
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- Bảng phiên đăng nhập
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- ===============================================
-- DỮ LIỆU MẪU CHO VAI TRÒ VÀ QUYỀN HẠN
-- ===============================================

-- Thêm vai trò
INSERT INTO roles (name, description) VALUES
('superadmin', 'Quyền cao nhất trong hệ thống, có thể truy cập và quản lý tất cả các tính năng'),
('admin', 'Quyền quản trị viên, có thể quản lý hầu hết các tính năng nhưng bị giới hạn một số quyền đặc biệt');

-- Thêm quyền hạn cho các module
-- Module: Quản lý người dùng
INSERT INTO permissions (name, description, module) VALUES
('user.view', 'Xem danh sách người dùng', 'user'),
('user.create', 'Tạo người dùng mới', 'user'),
('user.edit', 'Chỉnh sửa thông tin người dùng', 'user'),
('user.delete', 'Xóa người dùng', 'user');

-- Module: Quản lý sản phẩm
INSERT INTO permissions (name, description, module) VALUES
('product.view', 'Xem danh sách sản phẩm', 'product'),
('product.create', 'Tạo sản phẩm mới', 'product'),
('product.edit', 'Chỉnh sửa thông tin sản phẩm', 'product'),
('product.delete', 'Xóa sản phẩm', 'product');

-- Module: Quản lý đơn hàng
INSERT INTO permissions (name, description, module) VALUES
('order.view', 'Xem danh sách đơn hàng', 'order'),
('order.create', 'Tạo đơn hàng mới', 'order'),
('order.edit', 'Chỉnh sửa thông tin đơn hàng', 'order'),
('order.delete', 'Xóa đơn hàng', 'order'),
('order.approve', 'Phê duyệt đơn hàng', 'order'),
('order.cancel', 'Hủy đơn hàng', 'order');

-- Module: Quản lý admin
INSERT INTO permissions (name, description, module) VALUES
('admin.view', 'Xem danh sách admin', 'admin'),
('admin.create', 'Tạo admin mới', 'admin'),
('admin.edit', 'Chỉnh sửa thông tin admin', 'admin'),
('admin.delete', 'Xóa admin', 'admin');

-- Module: Quản lý vai trò và phân quyền
INSERT INTO permissions (name, description, module) VALUES
('role.view', 'Xem danh sách vai trò', 'role'),
('role.create', 'Tạo vai trò mới', 'role'),
('role.edit', 'Chỉnh sửa vai trò', 'role'),
('role.delete', 'Xóa vai trò', 'role'),
('permission.assign', 'Phân quyền cho vai trò', 'role');

-- Module: Quản lý hệ thống
INSERT INTO permissions (name, description, module) VALUES
('system.settings', 'Cấu hình hệ thống', 'system'),
('system.logs', 'Xem nhật ký hệ thống', 'system'),
('system.backup', 'Sao lưu và phục hồi dữ liệu', 'system');

-- Module: Báo cáo thống kê
INSERT INTO permissions (name, description, module) VALUES
('report.sales', 'Báo cáo doanh số', 'report'),
('report.users', 'Báo cáo người dùng', 'report'),
('report.products', 'Báo cáo sản phẩm', 'report'),
('report.export', 'Xuất báo cáo', 'report');

-- ===============================================
-- PHÂN QUYỀN CHO CÁC VAI TRÒ
-- ===============================================

-- Phân quyền cho Superadmin (tất cả quyền)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Phân quyền cho Admin (giới hạn một số quyền đặc biệt)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions 
WHERE name NOT IN (
    'admin.delete', 
    'role.delete', 
    'role.create',
    'system.backup',
    'permission.assign'
);

-- ===============================================
-- TẠO TÀI KHOẢN MẪU
-- ===============================================

-- Tạo tài khoản superadmin
INSERT INTO admins (username, email, password, full_name, role_id, created_by)
VALUES ('superadmin', 'superadmin@example.com', '$2a$12$1234567890abcdefghijk.uvwxyz', 'Super Administrator', 1, NULL);

-- Tạo tài khoản admin (được tạo bởi superadmin)
INSERT INTO admins (username, email, password, full_name, role_id, created_by)
VALUES ('admin', 'admin@example.com', '$2a$12$abcdefghijk1234567890.lmnopq', 'Administrator', 2, 1);

-- ===============================================
-- STORED PROCEDURES VÀ TRIGGERS
-- ===============================================

-- Procedure: Đăng nhập admin
DELIMITER //
CREATE PROCEDURE sp_admin_login(IN p_username VARCHAR(50), IN p_password VARCHAR(255))
BEGIN
    DECLARE v_admin_id INT;
    DECLARE v_role_id INT;
    DECLARE v_token VARCHAR(255);
    
    -- Kiểm tra thông tin đăng nhập
    SELECT id, role_id INTO v_admin_id, v_role_id
    FROM admins
    WHERE username = p_username AND is_active = TRUE;
    
    IF v_admin_id IS NOT NULL THEN
        -- Tạo token ngẫu nhiên (trong thực tế sẽ sử dụng hàm mã hóa)
        SET v_token = CONCAT(UUID(), UNIX_TIMESTAMP());
        
        -- Cập nhật thời gian đăng nhập
        UPDATE admins SET last_login = NOW() WHERE id = v_admin_id;
        
        -- Tạo phiên đăng nhập mới
        INSERT INTO admin_sessions (admin_id, token, ip_address, expires_at)
        VALUES (v_admin_id, v_token, '127.0.0.1', DATE_ADD(NOW(), INTERVAL 1 DAY));
        
        -- Ghi log hoạt động
        INSERT INTO admin_activity_logs (admin_id, action, entity_type, description)
        VALUES (v_admin_id, 'LOGIN', 'admin', 'Đăng nhập thành công');
        
        -- Trả về thông tin phiên
        SELECT a.id, a.username, a.email, a.full_name, r.name as role_name, v_token as session_token
        FROM admins a
        JOIN roles r ON a.role_id = r.id
        WHERE a.id = v_admin_id;
    ELSE
        -- Trả về NULL nếu đăng nhập thất bại
        SELECT NULL as id;
    END IF;
END //
DELIMITER ;

-- Procedure: Kiểm tra quyền hạn của admin
DELIMITER //
CREATE PROCEDURE sp_check_admin_permission(IN p_admin_id INT, IN p_permission_name VARCHAR(100))
BEGIN
    DECLARE v_has_permission BOOLEAN;
    
    SELECT COUNT(*) > 0 INTO v_has_permission
    FROM admins a
    JOIN role_permissions rp ON a.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE a.id = p_admin_id AND p.name = p_permission_name AND a.is_active = TRUE;
    
    SELECT v_has_permission as has_permission;
END //
DELIMITER ;

-- Trigger: Ghi log khi thay đổi thông tin admin
DELIMITER //
CREATE TRIGGER trg_admin_update
AFTER UPDATE ON admins
FOR EACH ROW
BEGIN
    INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, description)
    VALUES (NEW.updated_by, 'UPDATE', 'admin', NEW.id, 
            CONCAT('Cập nhật thông tin admin: ', NEW.username));
END //
DELIMITER ;

-- ===============================================
-- VIEWS CHO BÁO CÁO VÀ THỐNG KÊ
-- ===============================================

-- View: Danh sách admin và quyền hạn
CREATE OR REPLACE VIEW vw_admin_permissions AS
SELECT 
    a.id as admin_id,
    a.username,
    a.full_name,
    r.name as role_name,
    p.name as permission_name,
    p.module
FROM admins a
JOIN roles r ON a.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE a.is_active = TRUE;

-- View: Thống kê hoạt động của admin
CREATE OR REPLACE VIEW vw_admin_activities AS
SELECT 
    a.username,
    a.full_name,
    r.name as role_name,
    COUNT(al.id) as total_activities,
    MAX(al.created_at) as last_activity
FROM admins a
JOIN roles r ON a.role_id = r.id
LEFT JOIN admin_activity_logs al ON a.id = al.admin_id
WHERE a.is_active = TRUE
GROUP BY a.id, a.username, a.full_name, r.name;

-- ===============================================
-- MÔ TẢ LUỒNG DỮ LIỆU
-- ===============================================

/*
LUỒNG DỮ LIỆU VÀ QUYỀN HẠN ADMIN/SUPERADMIN

1. SUPERADMIN:
   - Là vai trò cao nhất trong hệ thống
   - Có toàn quyền truy cập và quản lý tất cả các tính năng
   - Có thể tạo, chỉnh sửa, xóa tài khoản admin khác
   - Có thể tạo và quản lý vai trò, phân quyền
   - Có thể xem tất cả các báo cáo, nhật ký hệ thống
   - Có thể cấu hình hệ thống, sao lưu và phục hồi dữ liệu
   - Có thể quản lý tất cả các module: người dùng, sản phẩm, đơn hàng...

2. ADMIN:
   - Là vai trò quản trị viên thông thường
   - Có quyền quản lý hầu hết các tính năng nhưng bị giới hạn một số quyền đặc biệt
   - Không thể xóa tài khoản admin khác
   - Không thể tạo vai trò mới hoặc xóa vai trò
   - Không thể phân quyền cho vai trò
   - Không thể sao lưu và phục hồi dữ liệu
   - Có thể quản lý người dùng, sản phẩm, đơn hàng...

3. LUỒNG HOẠT ĐỘNG:
   
   a. Đăng nhập và xác thực:
      - Admin/Superadmin đăng nhập vào hệ thống
      - Hệ thống kiểm tra thông tin đăng nhập và vai trò
      - Tạo phiên đăng nhập và token xác thực
      - Ghi log hoạt động đăng nhập
   
   b. Kiểm tra quyền hạn:
      - Mỗi khi truy cập một tính năng, hệ thống kiểm tra quyền hạn
      - Sử dụng stored procedure sp_check_admin_permission để kiểm tra
      - Chỉ cho phép truy cập nếu có quyền tương ứng
   
   c. Quản lý tài khoản admin:
      - Superadmin có thể tạo, chỉnh sửa, xóa tài khoản admin
      - Admin chỉ có thể xem danh sách và chỉnh sửa thông tin cá nhân
      - Mỗi thay đổi đều được ghi lại trong bảng nhật ký hoạt động
   
   d. Quản lý vai trò và phân quyền:
      - Superadmin có thể tạo vai trò mới, phân quyền cho vai trò
      - Mỗi vai trò có một tập hợp các quyền hạn khác nhau
      - Quyền hạn được phân theo module và chức năng
   
   e. Ghi log hoạt động:
      - Mọi hoạt động quan trọng đều được ghi lại
      - Bao gồm thông tin: người thực hiện, hành động, đối tượng tác động
      - Dùng để kiểm tra, theo dõi và đảm bảo an ninh
   
   f. Báo cáo và thống kê:
      - Superadmin có thể xem tất cả các báo cáo
      - Admin có thể xem các báo cáo được phân quyền
      - Dữ liệu báo cáo được tổng hợp từ các view

4. QUAN HỆ DỮ LIỆU:
   - Mỗi admin thuộc về một vai trò (roles)
   - Mỗi vai trò có nhiều quyền hạn (permissions)
   - Mỗi admin có nhiều hoạt động (admin_activity_logs)
   - Mỗi admin có nhiều phiên đăng nhập (admin_sessions)
*/
