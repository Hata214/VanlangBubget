import mongoose from 'mongoose';
import SiteContent from './src/models/siteContentModel.js'; // Điều chỉnh đường dẫn nếu cần
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: './.env.production' }); // Hoặc .env.development tùy môi trường bạn muốn chạy script

const LOG_FILE = path.join(process.cwd(), 'updateScript.log');

function writeToLog(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message); // Keep console logging as well
    try {
        fs.appendFileSync(LOG_FILE, logMessage);
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
}

// Clear log file at the beginning of a run
try {
    fs.writeFileSync(LOG_FILE, '');
    writeToLog('Log file initialized.');
} catch (err) {
    console.error('Failed to initialize log file:', err);
}


// ----- CONFIGURATION -----
const MONGO_URI = process.env.MONGODB_URI_PROD || 'mongodb+srv://hoang:Ab1234567@dataweb.bptnx.mongodb.net/test?retryWrites=true&w=majority&appName=DataWeb'; // Updated with provided URI
const ADMIN_USER_ID_PLACEHOLDER_CHECK = 'YOUR_ADMIN_USER_ID_HERE'; // Original placeholder for checking
const ADMIN_USER_ID_VALUE = process.env.ADMIN_USER_ID || ADMIN_USER_ID_PLACEHOLDER_CHECK; // Actual Admin User ID to use or placeholder

// ----- ENGLISH CONTENT DEFINITIONS -----

const homepageContentEn = {
    hero: {
        title: 'Smart Personal Finance Management',
        subtitle: 'Comprehensive financial management solution for everyone',
        description: 'VanLang Budget helps you track income and expenses, plan finances, and achieve savings goals easily and effectively.',
        imageUrl: '/images/VLB-Photoroom.png',
        buttonText: 'Sign up for free',
        buttonLink: '/register'
    },
    features: {
        title: 'Outstanding Features',
        description: 'VanLang Budget provides all the tools you need to manage your finances effectively',
        items: [
            { title: 'Track Income & Expenses', description: 'Easily and quickly record and categorize all daily income and expenses.', icon: 'wallet' },
            { title: 'Budget Management', description: 'Set up and track budgets for each spending category for better financial control.', icon: 'calculator' },
            { title: 'Financial Analysis', description: 'View detailed reports and charts of your financial situation in real time.', icon: 'chart' },
            { title: 'Future Planning', description: 'Set financial goals and track your progress towards achieving them.', icon: 'target' },
            { title: 'Loan Management', description: 'Easily track loans, calculate interest, and manage repayment schedules.', icon: 'loan' },
            { title: 'Data Security', description: 'Your data is encrypted and protected with the highest security standards.', icon: 'security' }
        ]
    },
    testimonials: {
        title: 'What Our Users Say',
        description: 'Thousands of users trust VanLang Budget to manage their personal finances',
        items: [
            { author: 'Minh Anh Nguyen', title: 'Office Worker', content: 'VanLang Budget has helped me control my spending better. The interface is simple, easy to use, and very effective.', rating: 5, avatarUrl: '/images/avatar-placeholder.png' },
            { author: 'Van Hung Tran', title: 'University Student', content: 'A great app for students like me. It helps me manage my allowance and save more.', rating: 5, avatarUrl: '/images/avatar-placeholder.png' },
            { author: 'Thi Mai Le', title: 'Small Business Owner', content: 'The loan management feature is very useful. I can track all my debts and plan repayments effectively.', rating: 5, avatarUrl: '/images/avatar-placeholder.png' }
        ]
    },
    pricing: {
        title: 'Pricing Plans',
        description: 'Choose the plan that suits your needs',
        plans: [
            { name: 'Basic', price: 'Free', description: 'Perfect for beginners', features: ['Expense tracking', 'Basic budgeting', 'Monthly reports', 'Email support'] },
            { name: 'Standard', price: '$4.99/month', description: 'For regular users', features: ['All basic features', 'Detailed reports', 'Loan management', '24/7 support'] }
        ]
    },
    cta: {
        title: 'Ready to take control of your finances?',
        description: 'Sign up today and start your journey to financial freedom.',
        primaryButtonText: 'Get started for free',
        primaryButtonLink: '/register',
        secondaryButtonText: 'Contact us',
        secondaryButtonLink: '/contact'
    }
};

const aboutContentEn = {
    // Matching the structure observed in inspectContent.js for 'vi' (top-level fields)
    title: "About Us", // Corresponds to "Về Chúng Tôi"
    subtitle: "The Journey of VanLang Budget", // Corresponds to "Hành trình của VanLang Budget"
    description: "VanLang Budget was developed by a team of personal finance enthusiasts with the goal of helping everyone manage their finances more effectively.", // Corresponds to the main paragraph
    mission: { // Corresponds to "Sứ Mệnh" section
        title: "Our Mission",
        content: "To help people achieve financial freedom through smart and intuitive financial management tools."
    },
    vision: { // Corresponds to "Tầm Nhìn" section
        title: "Our Vision",
        content: "To become the leading personal finance management application in Vietnam, helping millions of people control spending, save effectively, and achieve their financial goals."
    },
    values: { // Corresponds to "Giá Trị Cốt Lõi" section
        title: "Core Values",
        items: [
            { title: "Simplicity", description: "User-friendly interface, suitable for everyone." },
            { title: "Security", description: "Protecting financial information with the highest security standards." },
            { title: "Effectiveness", description: "Providing powerful financial management tools for optimal efficiency." }
        ]
    }
};

const featuresContentEn = { // From initializeFeaturesContent
    title: "Outstanding Features",
    subtitle: "Powerful financial management tools",
    description: "Tools that help you manage your finances effectively",
    features: [
        { icon: "📊", title: "Income & Expense Tracking", description: "Record and categorize all income and expenses daily, weekly, and monthly with a user-friendly interface." },
        { icon: "🎯", title: "Budget Management", description: "Set up and track budgets by category, helping you control spending and develop good financial habits." },
        { icon: "💰", title: "Loan Management", description: "Track loans, repayment schedules, and calculate interest rates accurately and in detail." },
        { icon: "📈", title: "Investment Management", description: "Track real estate investment portfolios, bank savings with automatic interest calculation features." },
        { icon: "🤖", title: "VanLang Agent AI", description: "Smart AI assistant that helps answer financial questions, calculations, and data analysis in Vietnamese." },
        { icon: "📱", title: "User-friendly Interface", description: "Responsive design, dark mode support, and multilingual (Vietnamese/English) for the best experience." }
    ]
};

const roadmapContentEn = { // From initializeRoadmapContent
    title: "Development Roadmap",
    description: "Explore VanLang Budget's development plan and upcoming features to be released in the future.",
    milestones: [
        { date: "Q1 2025", title: "Basic Foundation", description: "Build basic features for personal financial management and daily expense tracking.", completed: true },
        { date: "Q2 2025", title: "Budget Management", description: "Develop advanced budget management features and detailed reporting.", completed: false },
        { date: "Q3 2025", title: "Smart AI Automation", description: "Integrate AI for smart spending analysis and optimal budget recommendations.", completed: false },
        { date: "Q4 2025", title: "Banking Integration", description: "Direct connection with banks for automatic transaction sync and comprehensive management.", completed: false }
    ]
};

const pricingContentEn = { // From initializePricingContent
    title: "Pricing",
    subtitle: "Choose the plan that suits you",
    description: "We are perfecting service packages that suit your needs. Currently, VanLang Budget is completely free!",
    plans: [
        { name: "Plan 1", price: "Free", description: "Plan 1 description", features: ["Feature 1", "Feature 2", "Feature 3"], buttonText: "Sign up now", buttonLink: "/register", popular: false },
        { name: "Plan 2", price: "Free", description: "Plan 2 description", features: ["Feature 1", "Feature 2", "Feature 3"], buttonText: "Sign up now", buttonLink: "/register", popular: false }
    ]
};

const contactContentEn = { // From initializeContactContent
    title: "Contact Us",
    subtitle: "We're always here to help you",
    description: "If you have any questions or requests, don't hesitate to contact us. Our support team is always ready to help you.",
    contactInfo: {
        title: "Contact Information",
        emailLabel: "Email", email: "support@vanlangbudget.com",
        phoneLabel: "Phone", phone: "(+84) 123 456 789",
        addressLabel: "Address", address: "Hanoi, Vietnam",
        workingHoursLabel: "Working Hours", workingHours: "Monday - Friday: 9:00 - 17:00"
    },
    contactForm: {
        title: "Send us a message",
        nameLabel: "Full Name", namePlaceholder: "Enter your full name",
        emailLabel: "Email", emailPlaceholder: "Enter your email address",
        subjectLabel: "Subject", subjectPlaceholder: "Enter message subject",
        messageLabel: "Message", messagePlaceholder: "Enter your message",
        submitButton: "Send Message",
        successMessage: "Thank you for contacting us! We will respond as soon as possible.",
        errorMessage: "An error occurred. Please try again later."
    },
    faq: {
        title: "Frequently Asked Questions",
        questions: [
            { question: "Is VanLang Budget free?", answer: "Yes, VanLang Budget is currently completely free for all users." },
            { question: "How do I get started?", answer: "You just need to register an account and can start managing your finances immediately." },
            { question: "Is my data safe?", answer: "We use the highest security measures to protect your information." }
        ]
    }
};

const headerContentEn = {
    // Matching the structure observed in inspectContent.js for 'vi' (top-level fields)
    logo: "VanLang Budget",
    nav1: "About Us",
    nav2: "Features",
    nav3: "Pricing",
    nav4: "Contact",
    loginButton: "Login",
    signupButton: "Sign Up",
    // Assuming these might be used if a user is logged in, though not visible in the screenshot
    userMenuProfile: "Profile",
    userMenuSettings: "Settings",
    userMenuLogout: "Logout"
};

const footerContentEn = {
    // Matching the structure observed in inspectContent.js for 'vi' (top-level fields)
    companyName: "VanLang Budget",
    description: "Smart personal finance management application, helping you track expenses and achieve financial goals.",
    product1: "Expense Management",
    product2: "Budgeting",
    product3: "Financial Reports",
    product4: "Savings Goals",
    company1: "About Us",
    company2: "Contact",
    company3: "Careers",
    company4: "News/Blog",
    support1: "Help Center",
    support2: "User Guide",
    support3: "FAQ",
    support4: "Report a Bug",
    // Assuming these might exist based on typical footers, even if not in the vi example
    legal1: "Terms of Use",
    legal2: "Privacy Policy",
    legal3: "Cookie Policy",
    copyright: "© 2024 VanLang Budget. All rights reserved.",
    socialFacebook: "Facebook",
    socialTwitter: "Twitter",
    socialLinkedin: "LinkedIn",
    socialInstagram: "Instagram"
};

// ----- MAIN SCRIPT LOGIC -----
const contentToUpdate = [
    { type: 'homepage', en: homepageContentEn },
    { type: 'about', en: aboutContentEn },
    { type: 'features', en: featuresContentEn },
    { type: 'roadmap', en: roadmapContentEn },
    { type: 'pricing', en: pricingContentEn },
    { type: 'contact', en: contactContentEn },
    { type: 'header', en: headerContentEn },
    { type: 'footer', en: footerContentEn }
];

async function updateAllContent() {
    // Check for MONGO_URI placeholder is still relevant if not using .env
    if (MONGO_URI === 'YOUR_FALLBACK_MONGO_URI_HERE' && !process.env.MONGODB_URI_PROD) {
        writeToLog('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        writeToLog('!!! PLEASE CONFIGURE MONGO_URI in the script or .env file      !!!');
        writeToLog('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        return;
    }
    if (ADMIN_USER_ID_VALUE === ADMIN_USER_ID_PLACEHOLDER_CHECK) {
        writeToLog('********************************************************************');
        writeToLog('*** ADMIN_USER_ID is not set. "lastUpdatedBy" will not be updated. ***');
        writeToLog('********************************************************************');
    }

    try {
        await mongoose.connect(MONGO_URI);
        writeToLog('MongoDB Connected');

        let adminUserIdForUpdate = null;
        if (ADMIN_USER_ID_VALUE !== ADMIN_USER_ID_PLACEHOLDER_CHECK) {
            try {
                adminUserIdForUpdate = new mongoose.Types.ObjectId(ADMIN_USER_ID_VALUE);
            } catch (e) {
                writeToLog(`Error: Provided ADMIN_USER_ID "${ADMIN_USER_ID_VALUE}" is not a valid ObjectId. "lastUpdatedBy" will not be set.`);
                // Proceed without adminUserId if it's invalid but not the placeholder
            }
        }

        for (const item of contentToUpdate) {
            writeToLog(`Processing content for type: ${item.type}...`);
            const existingDoc = await SiteContent.findOne({ type: item.type });

            if (!existingDoc) {
                writeToLog(`Document for type "${item.type}" not found. Skipping.`);
                continue;
            }

            let currentContent = existingDoc.content || {};
            let newViContent = {}; // Will hold the restructured Vietnamese content
            let newEnContent = item.en; // English content from our definitions

            // Force restructure: Collect all top-level keys that are not 'en' or 'vi' into 'vi'
            // This handles cases where 'vi' might exist but is empty, or top-level vi fields still exist.
            let needsRestructure = false;
            newViContent = currentContent.vi || {}; // Start with existing vi content if any

            // Iterate over a copy of keys, as we are deleting from currentContent
            const topLevelKeys = Object.keys(currentContent);
            for (const key of topLevelKeys) {
                if (key !== 'en' && key !== 'vi') {
                    // Add to newViContent, potentially overwriting if newViContent was from an existing currentContent.vi
                    // This ensures the top-level field is prioritized if it exists.
                    newViContent[key] = currentContent[key];
                    delete currentContent[key]; // Remove the top-level key
                    needsRestructure = true;
                }
            }

            if (Object.keys(newViContent).length === 0 && !currentContent.en && !currentContent.vi) {
                // If after cleanup, newViContent is still empty, and no en/vi, initialize vi
                currentContent.vi = {};
                writeToLog(`Initialized empty 'vi' content for ${item.type} as it was completely empty.`);
            } else if (needsRestructure || !currentContent.vi) { // If restructure happened OR if 'vi' never existed
                currentContent.vi = newViContent;
                writeToLog(`Vietnamese content for type: ${item.type} has been (re)structured into 'content.vi'.`);
            } else {
                writeToLog(`'vi' content already structured for ${item.type}, and no top-level vi-like fields found to merge.`);
            }

            // Ensure 'en' content is set
            currentContent.en = newEnContent;
            writeToLog(`Set 'en' content for ${item.type}.`);

            const updatePayload = {
                content: currentContent, // This now contains the potentially restructured 'vi' and the new 'en'
                $inc: { version: 1 }
            };

            if (adminUserIdForUpdate) {
                updatePayload.lastUpdatedBy = adminUserIdForUpdate;
            }

            const updatedDoc = await SiteContent.findOneAndUpdate(
                { type: item.type },
                updatePayload,
                { new: true }
            );

            if (updatedDoc) {
                writeToLog(`Successfully updated ${item.type}. New version: ${updatedDoc.version}. Content keys: ${Object.keys(updatedDoc.content || {}).join(', ')}`);
            } else {
                writeToLog(`Failed to update document for type "${item.type}". It might have been deleted during the script run, or an unknown error occurred.`);
            }
        }

        writeToLog('All English content updates attempted.');
    } catch (error) {
        writeToLog(`Error during script execution: ${error.stack || error}`);
    } finally {
        await mongoose.disconnect();
        writeToLog('MongoDB Disconnected');
    }
}

updateAllContent();
