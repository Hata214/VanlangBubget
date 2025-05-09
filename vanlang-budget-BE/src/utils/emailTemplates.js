/**
 * Tạo template email dựa trên loại và dữ liệu
 * @param {string} type Loại template
 * @param {Object} data Dữ liệu để điền vào template
 * @returns {string} HTML template
 */
export const generateEmailTemplate = (type, data) => {
    const baseTemplate = (content) => {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VangLang Budget</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    color: #333;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #4F46E5;
                    padding: 20px;
                    text-align: center;
                    color: white;
                    border-radius: 4px 4px 0 0;
                }
                .content {
                    background-color: #ffffff;
                    padding: 20px;
                    border-left: 1px solid #e1e1e1;
                    border-right: 1px solid #e1e1e1;
                }
                .footer {
                    background-color: #f9fafb;
                    padding: 15px;
                    text-align: center;
                    font-size: 12px;
                    color: #6b7280;
                    border-radius: 0 0 4px 4px;
                    border: 1px solid #e1e1e1;
                    border-top: none;
                }
                .btn {
                    display: inline-block;
                    background-color: #4F46E5;
                    color: white;
                    text-decoration: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .unsubscribe {
                    color: #6b7280;
                    font-size: 12px;
                    text-decoration: none;
                }
                .highlight {
                    color: #4F46E5;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>VangLang Budget</h1>
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} VangLang Budget. All rights reserved.</p>
                    <p>
                        <a href="${process.env.FRONTEND_URL}/settings/notifications" class="unsubscribe">
                            ${data.language === 'vi' ? 'Quản lý cài đặt thông báo' : 'Manage notification settings'}
                        </a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    };

    switch (type) {
        case 'verification':
            return baseTemplate(`
                <h2>${data.title || 'Xác minh địa chỉ email'}</h2>
                <p>${data.greeting || `Xin chào ${data.name},`}</p>
                <p>${data.message || 'Cảm ơn bạn đã đăng ký tài khoản VangLang Budget. Vui lòng xác minh địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:'}</p>
                <div style="text-align: center;">
                    <a href="${data.verificationUrl}" class="btn">${data.buttonText || 'Xác minh Email'}</a>
                </div>
                <p>${data.expiry || 'Liên kết này sẽ hết hạn trong 24 giờ.'}</p>
                <p>${data.footer || 'Trân trọng,<br>Đội ngũ VangLang Budget'}</p>
            `);

        case 'passwordReset':
            return baseTemplate(`
                <h2>${data.title || 'Đặt lại mật khẩu'}</h2>
                <p>${data.greeting || `Xin chào ${data.name},`}</p>
                <p>${data.message || 'Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấp vào nút bên dưới để đặt lại mật khẩu:'}</p>
                <div style="text-align: center;">
                    <a href="${data.resetUrl}" class="btn">${data.buttonText || 'Đặt lại mật khẩu'}</a>
                </div>
                <p>${data.expiry || 'Liên kết này sẽ hết hạn trong 1 giờ.'}</p>
                <p>${data.ignore || 'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi nếu bạn có câu hỏi.'}</p>
                <p>${data.footer || 'Trân trọng,<br>Đội ngũ VangLang Budget'}</p>
            `);

        case 'notification':
            let actionButton = '';
            if (data.actionUrl && data.actionText) {
                actionButton = `
                <div style="text-align: center;">
                    <a href="${data.actionUrl}" class="btn">${data.actionText}</a>
                </div>
                `;
            }

            return baseTemplate(`
                <h2>${data.title}</h2>
                <p>${data.greeting || `Xin chào ${data.name},`}</p>
                <p>${data.message}</p>
                ${actionButton}
                <p>${data.footer || 'Trân trọng,<br>Đội ngũ VangLang Budget'}</p>
            `);

        case 'financialReport':
            const { reportType, reportData } = data;

            // Xác định tiêu đề cho báo cáo
            let reportTitle;
            if (data.language === 'vi') {
                switch (reportType) {
                    case 'daily':
                        reportTitle = 'Báo cáo tài chính hàng ngày';
                        break;
                    case 'weekly':
                        reportTitle = 'Báo cáo tài chính hàng tuần';
                        break;
                    case 'monthly':
                        reportTitle = 'Báo cáo tài chính hàng tháng';
                        break;
                    default:
                        reportTitle = 'Báo cáo tài chính';
                }
            } else {
                switch (reportType) {
                    case 'daily':
                        reportTitle = 'Daily Financial Report';
                        break;
                    case 'weekly':
                        reportTitle = 'Weekly Financial Report';
                        break;
                    case 'monthly':
                        reportTitle = 'Monthly Financial Report';
                        break;
                    default:
                        reportTitle = 'Financial Report';
                }
            }

            // Tạo nội dung báo cáo
            const { totalIncome, totalExpense, balance, topExpenseCategories, recentTransactions } = reportData;

            // Tạo danh sách danh mục chi tiêu hàng đầu
            let topExpensesHtml = '';
            if (topExpenseCategories && topExpenseCategories.length > 0) {
                const topExpensesTitle = data.language === 'vi' ? 'Danh mục chi tiêu hàng đầu' : 'Top Expense Categories';
                topExpensesHtml = `
                <h3>${topExpensesTitle}</h3>
                <ul>
                    ${topExpenseCategories.map(category => `
                        <li>${category.name}: ${formatCurrency(category.amount, data.language)}</li>
                    `).join('')}
                </ul>
                `;
            }

            // Tạo danh sách giao dịch gần đây
            let recentTransactionsHtml = '';
            if (recentTransactions && recentTransactions.length > 0) {
                const recentTransactionsTitle = data.language === 'vi' ? 'Giao dịch gần đây' : 'Recent Transactions';
                const dateHeader = data.language === 'vi' ? 'Ngày' : 'Date';
                const descriptionHeader = data.language === 'vi' ? 'Mô tả' : 'Description';
                const amountHeader = data.language === 'vi' ? 'Số tiền' : 'Amount';

                recentTransactionsHtml = `
                <h3>${recentTransactionsTitle}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">${dateHeader}</th>
                        <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">${descriptionHeader}</th>
                        <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${amountHeader}</th>
                    </tr>
                    ${recentTransactions.map(transaction => `
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(transaction.date, data.language)}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${transaction.description}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; ${transaction.type === 'expense' ? 'color: #ef4444;' : 'color: #10b981;'}">
                                ${transaction.type === 'expense' ? '-' : '+'} ${formatCurrency(transaction.amount, data.language)}
                            </td>
                        </tr>
                    `).join('')}
                </table>
                `;
            }

            const totalIncomeLabel = data.language === 'vi' ? 'Tổng thu nhập' : 'Total Income';
            const totalExpenseLabel = data.language === 'vi' ? 'Tổng chi tiêu' : 'Total Expense';
            const balanceLabel = data.language === 'vi' ? 'Số dư' : 'Balance';
            const viewDetailsText = data.language === 'vi' ? 'Xem chi tiết' : 'View Details';
            const overviewText = data.language === 'vi' ? 'Dưới đây là tổng quan về tài chính của bạn' : 'Here is an overview of your finances';

            return baseTemplate(`
                <h2>${reportTitle}</h2>
                <p>${data.greeting || `Xin chào ${data.name},`}</p>
                <p>${overviewText}:</p>
                
                <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 4px;">
                    <div style="margin-bottom: 10px;">
                        <span style="font-weight: bold;">${totalIncomeLabel}:</span> 
                        <span style="color: #10b981; font-weight: bold;">${formatCurrency(totalIncome, data.language)}</span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <span style="font-weight: bold;">${totalExpenseLabel}:</span> 
                        <span style="color: #ef4444; font-weight: bold;">${formatCurrency(totalExpense, data.language)}</span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <span style="font-weight: bold;">${balanceLabel}:</span> 
                        <span style="color: ${balance >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">${formatCurrency(balance, data.language)}</span>
                    </div>
                </div>
                
                ${topExpensesHtml}
                ${recentTransactionsHtml}
                
                <div style="text-align: center; margin-top: 20px;">
                    <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">${viewDetailsText}</a>
                </div>
                
                <p>${data.footer || 'Trân trọng,<br>Đội ngũ VangLang Budget'}</p>
            `);

        default:
            const defaultTitle = data.language === 'vi' ? 'Thông báo từ VangLang Budget' : 'Notification from VangLang Budget';
            const defaultGreeting = data.language === 'vi' ? 'Xin chào,' : 'Hello,';
            const defaultMessage = data.language === 'vi' ?
                'Đây là thông báo tự động từ hệ thống VangLang Budget.' :
                'This is an automated notification from the VangLang Budget system.';

            return baseTemplate(`
                <h2>${defaultTitle}</h2>
                <p>${defaultGreeting}</p>
                <p>${defaultMessage}</p>
                <p>${data.footer || 'Trân trọng,<br>Đội ngũ VangLang Budget'}</p>
            `);
    }
};

/**
 * Format số tiền thành chuỗi tiền tệ
 * @param {number} amount Số tiền cần format
 * @param {string} language Ngôn ngữ
 * @returns {string} Chuỗi tiền tệ đã format
 */
const formatCurrency = (amount, language = 'vi') => {
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    const currency = language === 'vi' ? 'VND' : 'USD';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * Format ngày thành chuỗi ngày tháng
 * @param {string} dateString Chuỗi ngày cần format
 * @param {string} language Ngôn ngữ
 * @returns {string} Chuỗi ngày tháng đã format
 */
const formatDate = (dateString, language = 'vi') => {
    const date = new Date(dateString);
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';

    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}; 