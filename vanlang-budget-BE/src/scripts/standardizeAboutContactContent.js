import mongoose from 'mongoose';
import SiteContent from '../models/siteContentModel.js';

const standardizeAboutContactContent = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget');
        console.log('✅ Connected to MongoDB');
        
        console.log('\n🔄 === STANDARDIZING ABOUT & CONTACT CONTENT ===\n');
        
        // 1. Standardize About Content
        console.log('📖 1. Standardizing About Content...');
        const aboutContent = await SiteContent.findOne({ type: 'about' });
        
        if (aboutContent) {
            const standardizedAbout = {
                vi: {
                    title: "Về Chúng Tôi",
                    subtitle: "Hành trình của VanLang Budget",
                    description: "VanLang Budget được phát triển bởi một nhóm những người đam mê tài chính cá nhân với mục tiêu giúp mọi người quản lý tài chính hiệu quả hơn.",
                    mission: {
                        title: "Sứ Mệnh",
                        content: "Giúp mọi người đạt được sự tự do tài chính thông qua các công cụ quản lý tài chính thông minh và trực quan."
                    },
                    vision: {
                        title: "Tầm Nhìn",
                        content: "Trở thành ứng dụng quản lý tài chính cá nhân hàng đầu tại Việt Nam, giúp hàng triệu người kiểm soát chi tiêu, tiết kiệm hiệu quả và đạt được các mục tiêu tài chính."
                    },
                    values: {
                        title: "Giá Trị Cốt Lõi",
                        items: [
                            {
                                title: "Đơn Giản",
                                description: "Giao diện trực quan, dễ sử dụng cho mọi đối tượng người dùng."
                            },
                            {
                                title: "Bảo Mật",
                                description: "Bảo vệ thông tin tài chính cá nhân với các tiêu chuẩn bảo mật cao nhất."
                            },
                            {
                                title: "Hiệu Quả",
                                description: "Cung cấp các công cụ mạnh mẽ giúp quản lý tài chính một cách hiệu quả."
                            }
                        ]
                    }
                },
                en: {
                    title: "About Us",
                    subtitle: "VanLang Budget's Journey",
                    description: "VanLang Budget is developed by a team of personal finance enthusiasts with the goal of helping people manage their finances more effectively.",
                    mission: {
                        title: "Mission",
                        content: "Help people achieve financial freedom through smart and intuitive financial management tools."
                    },
                    vision: {
                        title: "Vision",
                        content: "Become the leading personal finance management application in Vietnam, helping millions of people control spending, save effectively and achieve financial goals."
                    },
                    values: {
                        title: "Core Values",
                        items: [
                            {
                                title: "Simple",
                                description: "Intuitive interface, easy to use for all users."
                            },
                            {
                                title: "Secure",
                                description: "Protect personal financial information with the highest security standards."
                            },
                            {
                                title: "Effective",
                                description: "Provide powerful tools to help manage finances effectively."
                            }
                        ]
                    }
                }
            };
            
            await SiteContent.findOneAndUpdate(
                { type: 'about' },
                { content: standardizedAbout },
                { new: true }
            );
            console.log('   ✅ About content standardized with multilingual support');
        } else {
            console.log('   ❌ About content not found');
        }
        
        // 2. Standardize Contact Content
        console.log('📞 2. Standardizing Contact Content...');
        const contactContent = await SiteContent.findOne({ type: 'contact' });
        
        if (contactContent) {
            const standardizedContact = {
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
                        address: "123 Đường ABC, Quận 1, TP. Hồ Chí Minh, Việt Nam",
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
                    socialMedia: {
                        title: "Theo dõi chúng tôi",
                        facebook: "https://facebook.com/vanlangbudget",
                        twitter: "https://twitter.com/vanlangbudget",
                        linkedin: "https://linkedin.com/company/vanlangbudget",
                        instagram: "https://instagram.com/vanlangbudget"
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
                    subtitle: "We're always ready to help you",
                    description: "If you have any questions or requests, don't hesitate to contact us. Our support team is always ready to help you.",
                    contactInfo: {
                        title: "Contact Information",
                        emailLabel: "Email",
                        email: "support@vanlangbudget.com",
                        phoneLabel: "Phone",
                        phone: "(+84) 123 456 789",
                        addressLabel: "Address",
                        address: "123 ABC Street, District 1, Ho Chi Minh City, Vietnam",
                        workingHoursLabel: "Working Hours",
                        workingHours: "Monday - Friday: 9:00 AM - 5:00 PM"
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
                    socialMedia: {
                        title: "Follow Us",
                        facebook: "https://facebook.com/vanlangbudget",
                        twitter: "https://twitter.com/vanlangbudget",
                        linkedin: "https://linkedin.com/company/vanlangbudget",
                        instagram: "https://instagram.com/vanlangbudget"
                    },
                    faq: {
                        title: "Frequently Asked Questions",
                        questions: [
                            {
                                question: "Is VanLang Budget free?",
                                answer: "Yes, VanLang Budget is currently completely free for all users."
                            },
                            {
                                question: "How to get started?",
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
            
            await SiteContent.findOneAndUpdate(
                { type: 'contact' },
                { content: standardizedContact },
                { new: true }
            );
            console.log('   ✅ Contact content standardized with multilingual support');
        } else {
            console.log('   ❌ Contact content not found');
        }
        
        console.log('\n✅ === STANDARDIZATION COMPLETE ===');
        console.log('📊 Both About and Contact now have vi/en multilingual support');
        console.log('🔧 Content structure standardized');
        
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

standardizeAboutContactContent();
