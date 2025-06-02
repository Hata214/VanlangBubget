import mongoose from 'mongoose';
import { config } from 'dotenv';
import SiteContent from '../src/models/siteContentModel.js';

// Load environment variables
config();

const defaultContactContent = {
    vi: {
        title: "Liên hệ với chúng tôi",
        subtitle: "Chúng tôi luôn sẵn sàng hỗ trợ bạn",
        description: "Nếu bạn có bất kỳ câu hỏi hoặc yêu cầu nào, đừng ngần ngại liên hệ với chúng tôi. Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn.",
        contactInfo: {
            title: "Thông tin liên hệ",
            emailLabel: "Email",
            email: "support@vanlangbudget.com",
            phoneLabel: "Điện thoại",
            phone: "(+84) 123 456 789",
            addressLabel: "Địa chỉ",
            address: "Hà Nội, Việt Nam",
            workingHoursLabel: "Giờ làm việc",
            workingHours: "Thứ Hai - Thứ Sáu: 9:00 - 17:00"
        },
        contactForm: {
            title: "Gửi tin nhắn cho chúng tôi",
            nameLabel: "Họ và tên",
            namePlaceholder: "Nhập họ và tên của bạn",
            emailLabel: "Email",
            emailPlaceholder: "Nhập địa chỉ email của bạn",
            subjectLabel: "Chủ đề",
            subjectPlaceholder: "Nhập chủ đề tin nhắn",
            messageLabel: "Tin nhắn",
            messagePlaceholder: "Nhập tin nhắn của bạn",
            submitButton: "Gửi tin nhắn",
            successMessage: "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.",
            errorMessage: "Có lỗi xảy ra. Vui lòng thử lại sau."
        },
        faq: {
            title: "Câu hỏi thường gặp",
            questions: [
                {
                    question: "VanLang Budget có miễn phí không?",
                    answer: "Có, VanLang Budget hiện tại hoàn toàn miễn phí cho tất cả người dùng."
                },
                {
                    question: "Làm thế nào để bắt đầu sử dụng?",
                    answer: "Bạn chỉ cần đăng ký tài khoản và có thể bắt đầu quản lý tài chính ngay lập tức."
                },
                {
                    question: "Dữ liệu của tôi có an toàn không?",
                    answer: "Chúng tôi sử dụng các biện pháp bảo mật cao nhất để bảo vệ thông tin của bạn."
                }
            ]
        }
    },
    en: {
        title: "Contact Us",
        subtitle: "We're always here to help you",
        description: "If you have any questions or requests, don't hesitate to contact us. Our support team is always ready to help you.",
        contactInfo: {
            title: "Contact Information",
            emailLabel: "Email",
            email: "support@vanlangbudget.com",
            phoneLabel: "Phone",
            phone: "(+84) 123 456 789",
            addressLabel: "Address",
            address: "Hanoi, Vietnam",
            workingHoursLabel: "Working Hours",
            workingHours: "Monday - Friday: 9:00 - 17:00"
        },
        contactForm: {
            title: "Send us a message",
            nameLabel: "Full Name",
            namePlaceholder: "Enter your full name",
            emailLabel: "Email",
            emailPlaceholder: "Enter your email address",
            subjectLabel: "Subject",
            subjectPlaceholder: "Enter message subject",
            messageLabel: "Message",
            messagePlaceholder: "Enter your message",
            submitButton: "Send Message",
            successMessage: "Thank you for contacting us! We will respond as soon as possible.",
            errorMessage: "An error occurred. Please try again later."
        },
        faq: {
            title: "Frequently Asked Questions",
            questions: [
                {
                    question: "Is VanLang Budget free?",
                    answer: "Yes, VanLang Budget is currently completely free for all users."
                },
                {
                    question: "How do I get started?",
                    answer: "You just need to register an account and can start managing your finances immediately."
                },
                {
                    question: "Is my data safe?",
                    answer: "We use the highest security measures to protect your information."
                }
            ]
        }
    }
};

async function initializeContactContent() {
    try {
        // Kết nối MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Kiểm tra xem đã có contact content chưa
        const existingContact = await SiteContent.findOne({ type: 'contact' });

        if (existingContact) {
            console.log('⚠️ Contact content already exists. Updating...');
            await SiteContent.findOneAndUpdate(
                { type: 'contact' },
                {
                    content: defaultContactContent,
                    status: 'published',
                    version: existingContact.version + 1
                }
            );
            console.log('✅ Contact content updated successfully');
        } else {
            console.log('📝 Creating new contact content...');
            await SiteContent.create({
                type: 'contact',
                content: defaultContactContent,
                status: 'published',
                version: 1
            });
            console.log('✅ Contact content created successfully');
        }

        console.log('🎉 Contact content initialization completed!');
    } catch (error) {
        console.error('❌ Error initializing contact content:', error);
    } finally {
        // Đóng kết nối
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

// Chạy script
initializeContactContent();
