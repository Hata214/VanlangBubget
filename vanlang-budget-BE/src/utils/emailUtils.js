import nodemailer from 'nodemailer';

/**
 * Cấu hình transporter của nodemailer để gửi email
 * Tự động phát hiện và thiết lập cấu hình SMTP dựa trên domain email
 * @param {String} recipientEmail - Email người nhận để xác định dịch vụ email
 * @returns {Object} - Nodemailer transporter
 */
const createTransporter = async (recipientEmail = '') => {
    // Xác định loại dịch vụ email nên dùng
    const useEthereal = process.env.USE_ETHEREAL === 'true' ||
        (process.env.NODE_ENV === 'development' && process.env.USE_REAL_EMAIL !== 'true');

    // Sử dụng Ethereal nếu được cấu hình hoặc trong môi trường development
    if (useEthereal) {
        console.log('Sử dụng Ethereal Email (môi trường test) để gửi email');
        try {
            // Tạo tài khoản test Ethereal mới
            const testAccount = await nodemailer.createTestAccount();
            console.log('Tài khoản Ethereal được tạo:');
            console.log('- Email:', testAccount.user);
            console.log('- Password:', testAccount.pass);

            // Trả về transporter Ethereal với testAccount để sử dụng sau này
            const transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
                debug: true,
                logger: true
            });

            // Lưu trữ thông tin tài khoản để sử dụng sau
            transporter.testAccount = testAccount;

            return transporter;
        } catch (error) {
            console.error('Lỗi khi tạo tài khoản Ethereal:', error);
            // Nếu không tạo được Ethereal, thử dùng cấu hình Gmail bên dưới
        }
    }

    // Xác định domain của email người nhận
    let recipientDomain = '';
    if (recipientEmail) {
        const parts = recipientEmail.split('@');
        if (parts.length === 2) {
            recipientDomain = parts[1].toLowerCase();
        }
    }

    // Sử dụng Gmail nếu đã cấu hình
    if (process.env.EMAIL_HOST === 'smtp.gmail.com' &&
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASSWORD) {
        console.log('Sử dụng Gmail để gửi email:', process.env.EMAIL_USER);

        // Tạo transporter Gmail
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            debug: process.env.NODE_ENV === 'development',
            logger: process.env.NODE_ENV === 'development'
        });
    }

    // Sử dụng cấu hình tương ứng với domain người nhận (nếu có)
    const emailServices = {
        'gmail.com': {
            service: 'gmail',
        },
        'outlook.com': {
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false
        },
        'hotmail.com': {
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false
        },
        'yahoo.com': {
            host: 'smtp.mail.yahoo.com',
            port: 587,
            secure: false
        }
    };

    if (recipientDomain && emailServices[recipientDomain] &&
        process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        console.log(`Sử dụng cấu hình cho domain ${recipientDomain}`);

        return nodemailer.createTransport({
            ...emailServices[recipientDomain],
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    // Sử dụng cấu hình thủ công nếu có
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        console.log(`Sử dụng cấu hình SMTP thủ công: ${process.env.EMAIL_HOST}`);
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            }
        });
    }

    // Nếu không có cấu hình nào phù hợp, quay lại dùng Ethereal
    console.log('Không tìm thấy cấu hình email phù hợp, dùng Ethereal làm dự phòng');
    try {
        const testAccount = await nodemailer.createTestAccount();
        console.log('Tài khoản Ethereal dự phòng:', testAccount.user);
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            }
        });
    } catch (error) {
        console.error('Không thể tạo tài khoản Ethereal dự phòng:', error);
        throw new Error('Không thể cấu hình dịch vụ email');
    }
};

/**
 * Gửi email thông qua Nodemailer
 * @param {Object} options - Các tùy chọn gửi email
 * @param {String} options.to - Email người nhận
 * @param {String} options.subject - Chủ đề email
 * @param {String} options.text - Nội dung văn bản thuần
 * @param {String} options.html - Nội dung HTML
 * @returns {Promise} - Thông tin về email đã gửi
 */
export const sendEmail = async (options) => {
    try {
        // Truyền email người nhận cho createTransporter để cấu hình SMTP phù hợp
        const transporter = await createTransporter(options.to);

        // Hiển thị nội dung email trong console khi ở môi trường development
        if (process.env.NODE_ENV === 'development') {
            console.log('\n📧 EMAIL CONTENT PREVIEW:');
            console.log('To:', options.to);
            console.log('Subject:', options.subject);
            console.log('Text:', options.text?.substring(0, 100) + '...');
            console.log('HTML:', 'HTML content available (not displayed in console)');
            console.log('\n');
        }

        // Gửi email
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"VanLang Budget" <no-reply@vanlangbudget.com>',
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });

        // Lưu test account (nếu có) vào kết quả để sử dụng với getTestMessageUrl
        if (transporter.testAccount) {
            info.testAccount = transporter.testAccount;
        }

        // Trong môi trường development, luôn hiển thị URL xem email
        if (process.env.NODE_ENV === 'development') {
            try {
                // Tạo preview URL nếu sử dụng Ethereal
                if (info.testAccount) {
                    const previewURL = nodemailer.getTestMessageUrl(info);
                    if (previewURL) {
                        console.log('📧 EMAIL SENT SUCCESSFULLY');
                        console.log('🔶 Email Preview URL:', previewURL);
                        console.log('👆 Mở link trên để xem email đã gửi');
                    } else {
                        console.log('📧 EMAIL SENT SUCCESSFULLY (không có preview URL)');
                    }
                } else {
                    console.log('📧 EMAIL SENT SUCCESSFULLY (không phải Ethereal, không có preview URL)');
                }
            } catch (error) {
                console.log('📧 EMAIL SENT SUCCESSFULLY (không thể lấy preview URL)');
                console.error('Lỗi hiển thị preview:', error);
            }
        }

        return info;
    } catch (error) {
        console.error('Email sending error:', error);

        // Hiển thị chi tiết lỗi khi ở môi trường development
        if (process.env.NODE_ENV === 'development') {
            console.error('📧 EMAIL PREVIEW (NOT SENT - ERROR):');
            console.log('To:', options.to);
            console.log('Subject:', options.subject);
            console.log('Text:', options.text?.substring(0, 500));
            console.log('Error code:', error.code);
            console.log('Error message:', error.message);
            console.log('\n');
        }

        throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
    }
};

/**
 * Tạo mã OTP ngẫu nhiên
 * @param {Number} length - Độ dài của mã OTP (mặc định là 6)
 * @returns {String} - Mã OTP 
 */
export const generateOTP = (length = 6) => {
    let otp = '';
    const digits = '0123456789';

    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }

    return otp;
};

/**
 * Gửi email xác thực tài khoản với liên kết
 * @param {String} email - Email người nhận
 * @param {String} name - Tên người nhận 
 * @param {String} verificationURL - URL xác thực
 * @param {String} locale - Ngôn ngữ (vi hoặc en)
 * @returns {Promise} - Thông tin email đã gửi
 */
export const sendVerificationEmail = async (email, name, verificationURL, locale = 'vi') => {
    // Kiểm tra nếu biến môi trường SKIP_EMAIL_SENDING được bật
    if (process.env.SKIP_EMAIL_SENDING === 'true' && process.env.NODE_ENV === 'development') {
        console.log('⚠️ Đang mô phỏng gửi email xác thực (SKIP_EMAIL_SENDING=true)');

        // Tạo nội dung email
        const subject = locale === 'en'
            ? 'Verify your account - VanLang Budget'
            : 'Xác thực tài khoản - VanLang Budget';

        const text = locale === 'en'
            ? `Hello ${name},\n\nPlease click on the following link to verify your account: ${verificationURL}\n\nThis link is valid for 24 hours.\n\nIf you did not request this, please ignore this email.\n\nRegards,\nVanLang Budget Team`
            : `Xin chào ${name},\n\nVui lòng truy cập link sau để xác thực tài khoản của bạn: ${verificationURL}\n\nLink này có hiệu lực trong 24 giờ.\n\nNếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.\n\nTrân trọng,\nĐội ngũ VanLang Budget`;

        // Trả về kết quả mô phỏng
        return simulateEmailSending({
            to: email,
            subject,
            text
        });
    }

    // Nội dung email dựa theo ngôn ngữ
    let subject, text, html;

    if (locale === 'en') {
        subject = 'Verify your account - VanLang Budget';
        text = `Hello ${name},\n\nPlease click on the following link to verify your account: ${verificationURL}\n\nThis link is valid for 24 hours.\n\nIf you did not request this, please ignore this email.\n\nRegards,\nVanLang Budget Team`;

        html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #333;">VanLang Budget</h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
                <p>Hello <strong>${name}</strong>,</p>
                <p>Thank you for registering with VanLang Budget. Please click the button below to verify your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationURL}" style="background-color: #4a6ee0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Account</a>
                </div>
                <p>Or copy this link into your browser:</p>
                <p style="background-color: #ffffff; padding: 10px; border-radius: 3px; word-break: break-all;">${verificationURL}</p>
                <p>This verification link will expire in 24 hours.</p>
                <p>If you did not request this verification, please ignore this email or contact us if you have any questions.</p>
            </div>
            <div style="margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
                <p>© ${new Date().getFullYear()} VanLang Budget. All Rights Reserved.</p>
            </div>
        </div>
        `;
    } else {
        // Default Vietnamese
        subject = 'Xác thực tài khoản - VanLang Budget';
        text = `Xin chào ${name},\n\nVui lòng truy cập link sau để xác thực tài khoản của bạn: ${verificationURL}\n\nLink này có hiệu lực trong 24 giờ.\n\nNếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.\n\nTrân trọng,\nĐội ngũ VanLang Budget`;

        html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #333;">VanLang Budget</h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
                <p>Xin chào <strong>${name}</strong>,</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản VanLang Budget. Vui lòng nhấp vào nút bên dưới để xác thực tài khoản của bạn:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationURL}" style="background-color: #4a6ee0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Xác thực tài khoản</a>
                </div>
                <p>Hoặc sao chép đường dẫn này vào trình duyệt của bạn:</p>
                <p style="background-color: #ffffff; padding: 10px; border-radius: 3px; word-break: break-all;">${verificationURL}</p>
                <p>Liên kết xác thực này sẽ hết hạn sau 24 giờ.</p>
                <p>Nếu bạn không yêu cầu xác thực này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.</p>
            </div>
            <div style="margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
                <p>© ${new Date().getFullYear()} VanLang Budget. Đã đăng ký Bản quyền.</p>
            </div>
        </div>
        `;
    }

    // Gửi email
    return sendEmail({
        to: email,
        subject,
        text,
        html
    });
};

/**
 * Hiển thị thông tin OTP trong console 
 * @param {String} email - Email người dùng
 * @param {String} otp - Mã OTP
 */
export const renderOTPConsole = (email, otp) => {
    console.log('\n');
    console.log('🔑 =====================================================');
    console.log(`🔑 MÃ OTP ĐƯỢC TẠO CHO EMAIL ${email}:`);
    console.log(`🔑 ${otp}`);
    console.log('🔑 =====================================================');
    console.log('\n');
};

/**
 * Tạo và gửi mã OTP qua email để xác thực
 * @param {String} email - Email người nhận 
 * @param {String} name - Tên người nhận
 * @param {String} locale - Ngôn ngữ (vi hoặc en)
 * @returns {String} - Mã OTP đã tạo
 */
export const sendOTPVerificationEmail = async (email, name, locale = 'vi') => {
    // Tạo mã OTP
    const otp = generateOTP();

    // Kiểm tra nếu biến môi trường SKIP_EMAIL_SENDING được bật
    if (process.env.SKIP_EMAIL_SENDING === 'true' && process.env.NODE_ENV === 'development') {
        console.log(`⚠️ Đang bỏ qua việc gửi OTP đến ${email} (SKIP_EMAIL_SENDING=true)`);
        renderOTPConsole(email, otp);
        return otp;
    }

    // Nội dung email dựa theo ngôn ngữ
    let subject, text, html;

    if (locale === 'en') {
        subject = 'Verify your account - VanLang Budget';
        text = `Hello ${name},\n\nYour OTP is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this code, please ignore this email.\n\nRegards,\nVanLang Budget Team`;

        html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #333;">VanLang Budget</h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
                <p>Hello <strong>${name}</strong>,</p>
                <p>Thank you for registering with VanLang Budget. To complete the registration process, please use the OTP code below to verify your account:</p>
                <div style="background-color: #ffffff; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; border: 1px dashed #ccc;">
                    <h2 style="margin: 0; color: #4a6ee0; letter-spacing: 5px;">${otp}</h2>
                </div>
                <p>This verification code will expire in 10 minutes.</p>
                <p>If you did not request this verification code, please ignore this email or contact us if you have any questions.</p>
            </div>
            <div style="margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
                <p>© ${new Date().getFullYear()} VanLang Budget. All Rights Reserved.</p>
            </div>
        </div>
        `;
    } else {
        // Default Vietnamese
        subject = 'Xác thực tài khoản của bạn - VanLang Budget';
        text = `Xin chào ${name},\n\nMã OTP của bạn là: ${otp}\n\nMã này có hiệu lực trong 10 phút.\n\nNếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.\n\nTrân trọng,\nĐội ngũ VanLang Budget`;

        html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #333;">VanLang Budget</h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
                <p>Xin chào <strong>${name}</strong>,</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản VanLang Budget. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP dưới đây để xác thực tài khoản của bạn:</p>
                <div style="background-color: #ffffff; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; border: 1px dashed #ccc;">
                    <h2 style="margin: 0; color: #4a6ee0; letter-spacing: 5px;">${otp}</h2>
                </div>
                <p>Mã xác thực này sẽ hết hạn sau 10 phút.</p>
                <p>Nếu bạn không yêu cầu mã xác thực này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.</p>
            </div>
            <div style="margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
                <p>© ${new Date().getFullYear()} VanLang Budget. Đã đăng ký Bản quyền.</p>
            </div>
        </div>
        `;
    }

    try {
        // Gửi email
        await sendEmail({
            to: email,
            subject,
            text,
            html
        });

        // Trong môi trường development, hiển thị OTP
        if (process.env.NODE_ENV === 'development') {
            console.log('\n');
            console.log('🔑 =====================================================');
            console.log(`🔑 MÃ OTP ĐƯỢC TẠO CHO EMAIL ${email}:`);
            console.log(`🔑 ${otp}`);
            console.log('🔑 =====================================================');
            console.log('\n');
        }

        return otp;
    } catch (error) {
        console.error('Không thể gửi email OTP:', error);
        throw error; // Re-throw để xử lý ở controller
    }
};

/**
 * Hiển thị thông tin token và URL đặt lại mật khẩu trong console
 * @param {String} email - Email người dùng
 * @param {String} resetToken - Token đặt lại mật khẩu
 * @param {String} resetURL - URL đặt lại mật khẩu
 */
export const renderResetPasswordToken = (email, resetToken, resetURL) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('\n');
        console.log('🔑 ====================================================');
        console.log(`🔑 THÔNG TIN ĐẶT LẠI MẬT KHẨU CHO EMAIL ${email}:`);
        console.log(`🔑 Token: ${resetToken}`);
        console.log(`🔑 URL: ${resetURL}`);
        console.log('🔑 ====================================================');
        console.log('\n');
    }
};

/**
 * Mô phỏng việc gửi email thành công khi không thể/không muốn gửi email thật
 * @param {Object} options - Các tùy chọn gửi email
 * @returns {Object} - Thông tin mô phỏng về email đã gửi
 */
export const simulateEmailSending = (options) => {
    console.log('\n📨 SIMULATED EMAIL (NOT ACTUALLY SENT):');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Text:', options.text?.substring(0, 150) + '...');
    console.log('\n');

    return {
        messageId: `simulated-${Date.now()}@localhost`,
        envelope: {
            from: process.env.EMAIL_FROM || 'no-reply@vanlangbudget.com',
            to: options.to
        },
        accepted: [options.to],
        rejected: [],
        pending: [],
        response: 'Simulated email sent successfully'
    };
};

/**
 * Gửi email đặt lại mật khẩu
 * @param {String} email - Email người nhận
 * @param {String} name - Tên người nhận
 * @param {String} resetURL - URL đặt lại mật khẩu
 * @param {String} locale - Ngôn ngữ (vi hoặc en)
 * @returns {Promise} - Thông tin về email đã gửi
 */
export const sendPasswordResetEmail = async (email, name, resetURL, locale = 'vi') => {
    // Luôn hiển thị thông tin token đặt lại mật khẩu trong console
    const resetToken = resetURL.split('/').pop();
    renderResetPasswordToken(email, resetToken, resetURL);

    // Kiểm tra nếu biến môi trường SKIP_EMAIL_SENDING được bật
    if (process.env.SKIP_EMAIL_SENDING === 'true' && process.env.NODE_ENV === 'development') {
        console.log(`⚠️ Đang bỏ qua việc gửi email đặt lại mật khẩu đến ${email} (SKIP_EMAIL_SENDING=true)`);
        console.log('⚠️ Sử dụng token và URL trong console để đặt lại mật khẩu');
        return simulateEmailSending({
            to: email,
            subject: locale === 'en' ? 'Password Reset' : 'Đặt lại mật khẩu',
            text: `Token: ${resetToken}, URL: ${resetURL}`
        });
    }

    // Nội dung email dựa theo ngôn ngữ
    let subject, text, html;

    if (locale === 'en') {
        subject = 'Password Reset Request - VanLang Budget';
        text = `Hello ${name},\n\nYou requested to reset your password. Please click on the following link to reset your password: ${resetURL}\n\nThis link is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nRegards,\nVanLang Budget Team`;

        html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #333;">VanLang Budget</h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
                <p>Hello <strong>${name}</strong>,</p>
                <p>You requested to reset your password for your VanLang Budget account. Please click the button below to proceed with the password reset:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetURL}" style="background-color: #4a6ee0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
                </div>
                <p>Or copy this link into your browser:</p>
                <p style="background-color: #ffffff; padding: 10px; border-radius: 3px; word-break: break-all;">${resetURL}</p>
                <p>This link will expire in 10 minutes.</p>
                <p>If you did not request a password reset, please ignore this email or contact us if you have any questions.</p>
            </div>
            <div style="margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
                <p>© ${new Date().getFullYear()} VanLang Budget. All Rights Reserved.</p>
            </div>
        </div>
        `;
    } else {
        // Default Vietnamese
        subject = 'Yêu cầu đặt lại mật khẩu - VanLang Budget';
        text = `Xin chào ${name},\n\nBạn đã yêu cầu đặt lại mật khẩu. Vui lòng truy cập link sau để đặt lại mật khẩu: ${resetURL}\n\nLink này có hiệu lực trong 10 phút.\n\nNếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\nTrân trọng,\nĐội ngũ VanLang Budget`;

        html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #333;">VanLang Budget</h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
                <p>Xin chào <strong>${name}</strong>,</p>
                <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản VanLang Budget. Vui lòng nhấp vào nút bên dưới để tiến hành đặt lại mật khẩu:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetURL}" style="background-color: #4a6ee0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Đặt lại mật khẩu</a>
                </div>
                <p>Hoặc sao chép đường dẫn này vào trình duyệt của bạn:</p>
                <p style="background-color: #ffffff; padding: 10px; border-radius: 3px; word-break: break-all;">${resetURL}</p>
                <p>Liên kết này sẽ hết hạn sau 10 phút.</p>
                <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.</p>
            </div>
            <div style="margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
                <p>© ${new Date().getFullYear()} VanLang Budget. Đã đăng ký Bản quyền.</p>
            </div>
        </div>
        `;
    }

    // Gửi email
    return sendEmail({
        to: email,
        subject,
        text,
        html
    });
}; 