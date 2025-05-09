/**
 * Cấu hình ngôn ngữ cho hệ thống
 */

// Danh sách ngôn ngữ được hỗ trợ
export const SUPPORTED_LANGUAGES = ['en', 'vi'];
export const DEFAULT_LANGUAGE = 'en';

// Translations cho thông báo
export const translations = {
    en: {
        notifications: {
            emailSubjects: {
                verifyEmail: 'Verify your email address',
                resetPassword: 'Reset your password',
                newExpense: 'New expense added',
                expenseUpdated: 'Expense updated',
                expenseDeleted: 'Expense deleted',
                newIncome: 'New income added',
                incomeUpdated: 'Income updated',
                incomeDeleted: 'Income deleted',
                budgetLimit: 'Budget limit reached',
                accountUpdate: 'Account update'
            },
            emailTemplates: {
                greeting: 'Hello, {{name}}!',
                footer: 'Best regards,<br>VangLang Budget Team',
                unsubscribe: 'If you no longer wish to receive these emails, you can <a href="{{unsubscribeUrl}}">unsubscribe here</a>.',
                verifyEmail: {
                    title: 'Welcome to VangLang Budget',
                    message: 'Thank you for signing up. Please verify your email address by clicking the button below:',
                    button: 'Verify Email Address',
                    expiry: 'This verification link will expire in 24 hours.'
                },
                resetPassword: {
                    title: 'Reset Your Password',
                    message: 'We received a request to reset your password. Click the button below to create a new password:',
                    button: 'Reset Password',
                    expiry: 'This password reset link will expire in 1 hour.',
                    ignore: 'If you did not request a password reset, please ignore this email or contact support if you have concerns.'
                },
                expense: {
                    added: 'A new expense of {{amount}} was added to your account in the "{{category}}" category.',
                    updated: 'Your expense of {{amount}} in the "{{category}}" category has been updated.',
                    deleted: 'Your expense of {{amount}} in the "{{category}}" category has been deleted.'
                },
                income: {
                    added: 'A new income of {{amount}} was added to your account in the "{{category}}" category.',
                    updated: 'Your income of {{amount}} in the "{{category}}" category has been updated.',
                    deleted: 'Your income of {{amount}} in the "{{category}}" category has been deleted.'
                },
                budget: {
                    limit: 'Your "{{category}}" budget has reached {{percentage}}% of its limit. You have spent {{spent}} out of {{total}}.'
                },
                account: {
                    update: 'Your account information has been updated successfully.'
                }
            },
            pushNotifications: {
                expense: {
                    added: 'New expense: {{amount}} added to {{category}}',
                    updated: 'Expense updated: {{amount}} in {{category}}',
                    deleted: 'Expense deleted: {{amount}} from {{category}}'
                },
                income: {
                    added: 'New income: {{amount}} added to {{category}}',
                    updated: 'Income updated: {{amount}} in {{category}}',
                    deleted: 'Income deleted: {{amount}} from {{category}}'
                },
                budget: {
                    limit: '{{category}} budget: {{percentage}}% used ({{spent}}/{{total}})'
                },
                account: {
                    update: 'Account information updated'
                }
            }
        },
        financialReport: {
            daily: {
                subject: 'Your Daily Financial Report - {{appName}}'
            },
            weekly: {
                subject: 'Your Weekly Financial Report - {{appName}}'
            },
            monthly: {
                subject: 'Your Monthly Financial Report - {{appName}}'
            },
            general: {
                subject: 'Your Financial Report - {{appName}}'
            }
        }
    },
    vi: {
        notifications: {
            emailSubjects: {
                verifyEmail: 'Xác minh địa chỉ email của bạn',
                resetPassword: 'Đặt lại mật khẩu của bạn',
                newExpense: 'Đã thêm chi tiêu mới',
                expenseUpdated: 'Đã cập nhật chi tiêu',
                expenseDeleted: 'Đã xóa chi tiêu',
                newIncome: 'Đã thêm thu nhập mới',
                incomeUpdated: 'Đã cập nhật thu nhập',
                incomeDeleted: 'Đã xóa thu nhập',
                budgetLimit: 'Đã đạt giới hạn ngân sách',
                accountUpdate: 'Cập nhật tài khoản'
            },
            emailTemplates: {
                greeting: 'Xin chào, {{name}}!',
                footer: 'Trân trọng,<br>Đội ngũ VangLang Budget',
                unsubscribe: 'Nếu bạn không muốn nhận các email này nữa, bạn có thể <a href="{{unsubscribeUrl}}">hủy đăng ký tại đây</a>.',
                verifyEmail: {
                    title: 'Chào mừng đến với VangLang Budget',
                    message: 'Cảm ơn bạn đã đăng ký. Vui lòng xác minh địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:',
                    button: 'Xác minh địa chỉ email',
                    expiry: 'Liên kết xác minh này sẽ hết hạn trong 24 giờ.'
                },
                resetPassword: {
                    title: 'Đặt lại mật khẩu của bạn',
                    message: 'Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn. Nhấp vào nút bên dưới để tạo mật khẩu mới:',
                    button: 'Đặt lại mật khẩu',
                    expiry: 'Liên kết đặt lại mật khẩu này sẽ hết hạn trong 1 giờ.',
                    ignore: 'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ nếu bạn có lo ngại.'
                },
                expense: {
                    added: 'Một khoản chi tiêu mới {{amount}} đã được thêm vào tài khoản của bạn trong danh mục "{{category}}".',
                    updated: 'Khoản chi tiêu {{amount}} của bạn trong danh mục "{{category}}" đã được cập nhật.',
                    deleted: 'Khoản chi tiêu {{amount}} của bạn trong danh mục "{{category}}" đã bị xóa.'
                },
                income: {
                    added: 'Một khoản thu nhập mới {{amount}} đã được thêm vào tài khoản của bạn trong danh mục "{{category}}".',
                    updated: 'Khoản thu nhập {{amount}} của bạn trong danh mục "{{category}}" đã được cập nhật.',
                    deleted: 'Khoản thu nhập {{amount}} của bạn trong danh mục "{{category}}" đã bị xóa.'
                },
                budget: {
                    limit: 'Ngân sách "{{category}}" của bạn đã đạt {{percentage}}% giới hạn. Bạn đã chi tiêu {{spent}} trên tổng {{total}}.'
                },
                account: {
                    update: 'Thông tin tài khoản của bạn đã được cập nhật thành công.'
                }
            },
            pushNotifications: {
                expense: {
                    added: 'Chi tiêu mới: {{amount}} thêm vào {{category}}',
                    updated: 'Đã cập nhật chi tiêu: {{amount}} trong {{category}}',
                    deleted: 'Đã xóa chi tiêu: {{amount}} từ {{category}}'
                },
                income: {
                    added: 'Thu nhập mới: {{amount}} thêm vào {{category}}',
                    updated: 'Đã cập nhật thu nhập: {{amount}} trong {{category}}',
                    deleted: 'Đã xóa thu nhập: {{amount}} từ {{category}}'
                },
                budget: {
                    limit: 'Ngân sách {{category}}: đã dùng {{percentage}}% ({{spent}}/{{total}})'
                },
                account: {
                    update: 'Đã cập nhật thông tin tài khoản'
                }
            }
        },
        financialReport: {
            daily: {
                subject: 'Báo Cáo Tài Chính Hàng Ngày - {{appName}}'
            },
            weekly: {
                subject: 'Báo Cáo Tài Chính Hàng Tuần - {{appName}}'
            },
            monthly: {
                subject: 'Báo Cáo Tài Chính Hàng Tháng - {{appName}}'
            },
            general: {
                subject: 'Báo Cáo Tài Chính - {{appName}}'
            }
        }
    }
};

/**
 * Lấy bản dịch dựa trên ngôn ngữ
 * @param {string} language - Mã ngôn ngữ
 * @param {string} path - Đường dẫn đến chuỗi cần lấy (dạng dot notation)
 * @param {Object} variables - Biến để thay thế trong template
 * @returns {string} - Chuỗi đã được dịch
 */
export const getTranslation = (language, path, variables = {}) => {
    // Sử dụng ngôn ngữ mặc định nếu ngôn ngữ không được hỗ trợ
    if (!SUPPORTED_LANGUAGES.includes(language)) {
        language = DEFAULT_LANGUAGE;
    }

    // Lấy dữ liệu từ path
    const keys = path.split('.');
    let value = translations[language];

    for (const key of keys) {
        if (value && value[key]) {
            value = value[key];
        } else {
            // Nếu không tìm thấy, thử lấy từ ngôn ngữ mặc định
            let defaultValue = translations[DEFAULT_LANGUAGE];
            for (const defaultKey of keys) {
                if (defaultValue && defaultValue[defaultKey]) {
                    defaultValue = defaultValue[defaultKey];
                } else {
                    defaultValue = path; // Trả về path nếu không tìm thấy
                    break;
                }
            }
            value = defaultValue;
            break;
        }
    }

    // Thay thế biến trong template
    if (typeof value === 'string' && variables && Object.keys(variables).length > 0) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return variables[key] !== undefined ? variables[key] : match;
        });
    }

    return value;
}; 