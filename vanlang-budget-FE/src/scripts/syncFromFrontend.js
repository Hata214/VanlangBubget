/**
 * Script để đọc dữ liệu từ các trang frontend và đồng bộ vào admin
 * Sử dụng puppeteer để truy cập các trang và trích xuất dữ liệu
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// API Endpoints
const API_BASE_URL = 'http://localhost:4000/api';
const SITE_CONTENT_ENDPOINT = `${API_BASE_URL}/site-content`;

// Danh sách các trang cần đồng bộ
const PAGES = [
  { url: 'http://localhost:3000/', endpoint: 'homepage' },
  { url: 'http://localhost:3000/about', endpoint: 'about' },
  { url: 'http://localhost:3000/features', endpoint: 'features' },
  { url: 'http://localhost:3000/roadmap', endpoint: 'roadmap' },
  { url: 'http://localhost:3000/pricing', endpoint: 'pricing' },
  { url: 'http://localhost:3000/contact', endpoint: 'contact' }
];

/**
 * Gửi dữ liệu lên API
 * @param {string} endpoint Endpoint API
 * @param {Object} data Dữ liệu cần gửi
 * @returns {Promise} Kết quả từ API
 */
const postToApi = async (endpoint, data) => {
  try {
    const response = await axios.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi gửi dữ liệu đến ${endpoint}:`, error.message);
    return null;
  }
};

/**
 * Trích xuất dữ liệu từ trang chủ
 * @param {Page} page Đối tượng Page của Puppeteer
 * @returns {Object} Dữ liệu trang chủ
 */
const extractHomepageData = async (page) => {
  return await page.evaluate(() => {
    const hero = {
      title: document.querySelector('h1')?.textContent?.trim() || 'Quản lý tài chính cá nhân một cách thông minh',
      subtitle: document.querySelector('h1 + p')?.textContent?.trim() || 'VanLang Budget giúp bạn theo dõi thu chi, quản lý ngân sách và đạt được mục tiêu tài chính một cách dễ dàng',
      ctaText: document.querySelector('.hero-section a.btn-primary')?.textContent?.trim() || 'Bắt đầu ngay',
      ctaUrl: document.querySelector('.hero-section a.btn-primary')?.getAttribute('href') || '/register',
      secondaryCtaText: document.querySelector('.hero-section a.btn-secondary')?.textContent?.trim() || 'Tìm hiểu thêm',
      secondaryCtaUrl: document.querySelector('.hero-section a.btn-secondary')?.getAttribute('href') || '/features',
      image: document.querySelector('.hero-section img')?.getAttribute('src') || '/images/homepage/hero.png'
    };

    // Trích xuất các tính năng nổi bật
    const featuresSection = {
      title: document.querySelector('.features-section h2')?.textContent?.trim() || 'Tính năng nổi bật',
      subtitle: document.querySelector('.features-section h2 + p')?.textContent?.trim() || 'Khám phá các tính năng giúp bạn quản lý tài chính hiệu quả',
      features: []
    };

    // Trích xuất từng tính năng
    const featureElements = document.querySelectorAll('.feature-card');
    featureElements.forEach(element => {
      const feature = {
        title: element.querySelector('h3')?.textContent?.trim() || '',
        description: element.querySelector('p')?.textContent?.trim() || '',
        icon: element.querySelector('img, svg')?.getAttribute('src') || element.querySelector('i')?.className || ''
      };
      featuresSection.features.push(feature);
    });

    // Trích xuất phần testimonials nếu có
    const testimonialsSection = {
      title: document.querySelector('.testimonials-section h2')?.textContent?.trim() || 'Khách hàng nói gì về chúng tôi',
      testimonials: []
    };

    const testimonialElements = document.querySelectorAll('.testimonial-card');
    testimonialElements.forEach(element => {
      const testimonial = {
        content: element.querySelector('blockquote')?.textContent?.trim() || '',
        author: element.querySelector('.author-name')?.textContent?.trim() || '',
        role: element.querySelector('.author-role')?.textContent?.trim() || '',
        avatar: element.querySelector('img')?.getAttribute('src') || ''
      };
      testimonialsSection.testimonials.push(testimonial);
    });

    // Trích xuất phần CTA
    const ctaSection = {
      title: document.querySelector('.cta-section h2')?.textContent?.trim() || 'Sẵn sàng để bắt đầu?',
      subtitle: document.querySelector('.cta-section p')?.textContent?.trim() || 'Đăng ký ngay hôm nay và bắt đầu hành trình quản lý tài chính của bạn',
      buttonText: document.querySelector('.cta-section a.btn')?.textContent?.trim() || 'Đăng ký miễn phí',
      buttonUrl: document.querySelector('.cta-section a.btn')?.getAttribute('href') || '/register'
    };

    // Trích xuất footer
    const footer = {
      logo: document.querySelector('footer img')?.getAttribute('src') || '/images/logos/logo.png',
      description: document.querySelector('footer p')?.textContent?.trim() || 'VanLang Budget - Giải pháp quản lý tài chính cá nhân toàn diện',
      links: [],
      socialLinks: [],
      copyright: document.querySelector('footer .copyright')?.textContent?.trim() || '© 2024 VanLang Budget. Tất cả quyền được bảo lưu.'
    };

    // Trích xuất các liên kết trong footer
    const linkElements = document.querySelectorAll('footer .footer-links a');
    linkElements.forEach(element => {
      const link = {
        text: element.textContent.trim(),
        url: element.getAttribute('href')
      };
      footer.links.push(link);
    });

    // Trích xuất các liên kết mạng xã hội
    const socialElements = document.querySelectorAll('footer .social-links a');
    socialElements.forEach(element => {
      const social = {
        icon: element.querySelector('i')?.className || '',
        url: element.getAttribute('href')
      };
      footer.socialLinks.push(social);
    });

    return {
      hero,
      featuresSection,
      testimonialsSection,
      ctaSection,
      footer
    };
  });
};

/**
 * Trích xuất dữ liệu từ trang Giới thiệu
 * @param {Page} page Đối tượng Page của Puppeteer
 * @returns {Object} Dữ liệu trang Giới thiệu
 */
const extractAboutData = async (page) => {
  return await page.evaluate(() => {
    return {
      title: document.querySelector('.about-header h1')?.textContent?.trim() || 'Về chúng tôi',
      subtitle: document.querySelector('.about-header p')?.textContent?.trim() || 'Hành trình của VanLang Budget',
      description: document.querySelector('.about-content p')?.textContent?.trim() || 'VanLang Budget được phát triển bởi một nhóm những người đam mê tài chính cá nhân với mục tiêu giúp mọi người quản lý tài chính hiệu quả hơn.',
      mission: {
        title: document.querySelector('.mission h3')?.textContent?.trim() || 'Sứ mệnh của chúng tôi',
        content: document.querySelector('.mission p')?.textContent?.trim() || 'Giúp mọi người đạt được tự do tài chính thông qua các công cụ quản lý tài chính thông minh và trực quan.'
      },
      vision: {
        title: document.querySelector('.vision h3')?.textContent?.trim() || 'Tầm nhìn của chúng tôi',
        content: document.querySelector('.vision p')?.textContent?.trim() || 'Trở thành ứng dụng quản lý tài chính cá nhân hàng đầu tại Việt Nam, giúp hàng triệu người kiểm soát chi tiêu, tiết kiệm hiệu quả và đạt được mục tiêu tài chính.'
      },
      teamImage: document.querySelector('.about-team img')?.getAttribute('src') || '/images/about/team.jpg',
      backgroundImage: document.querySelector('.about-header')?.style.backgroundImage?.replace('url("', '').replace('")', '') || '/images/about/background.jpg'
    };
  });
};

/**
 * Trích xuất dữ liệu từ trang Tính năng
 * @param {Page} page Đối tượng Page của Puppeteer
 * @returns {Object} Dữ liệu trang Tính năng
 */
const extractFeaturesData = async (page) => {
  return await page.evaluate(() => {
    const features = [];
    const featureElements = document.querySelectorAll('.feature-item');
    
    featureElements.forEach(element => {
      const feature = {
        title: element.querySelector('h3')?.textContent?.trim() || '',
        description: element.querySelector('p')?.textContent?.trim() || '',
        icon: element.querySelector('img')?.getAttribute('src') || element.querySelector('i')?.className || '',
        image: element.querySelector('.feature-image img')?.getAttribute('src') || ''
      };
      features.push(feature);
    });

    return {
      title: document.querySelector('.features-header h1')?.textContent?.trim() || 'Tính năng',
      subtitle: document.querySelector('.features-header p')?.textContent?.trim() || 'Khám phá các tính năng mạnh mẽ của VanLang Budget',
      description: document.querySelector('.features-intro p')?.textContent?.trim() || 'VanLang Budget cung cấp đầy đủ các tính năng cần thiết để quản lý tài chính cá nhân một cách hiệu quả.',
      features: features
    };
  });
};

/**
 * Trích xuất dữ liệu từ trang Lộ trình
 * @param {Page} page Đối tượng Page của Puppeteer
 * @returns {Object} Dữ liệu trang Lộ trình
 */
const extractRoadmapData = async (page) => {
  return await page.evaluate(() => {
    const milestones = [];
    const milestoneElements = document.querySelectorAll('.milestone-item');
    
    milestoneElements.forEach(element => {
      const milestone = {
        date: element.querySelector('.milestone-date')?.textContent?.trim() || '',
        title: element.querySelector('.milestone-title')?.textContent?.trim() || '',
        description: element.querySelector('.milestone-description')?.textContent?.trim() || '',
        completed: element.classList.contains('completed')
      };
      milestones.push(milestone);
    });

    const upcomingFeatures = [];
    const upcomingElements = document.querySelectorAll('.upcoming-feature');
    
    upcomingElements.forEach(element => {
      const feature = {
        title: element.querySelector('.feature-title')?.textContent?.trim() || '',
        description: element.querySelector('.feature-description')?.textContent?.trim() || '',
        estimatedRelease: element.querySelector('.estimated-release')?.textContent?.trim() || ''
      };
      upcomingFeatures.push(feature);
    });

    return {
      title: document.querySelector('.roadmap-header h1')?.textContent?.trim() || 'Lộ trình phát triển',
      subtitle: document.querySelector('.roadmap-header p')?.textContent?.trim() || 'Kế hoạch phát triển của VanLang Budget',
      description: document.querySelector('.roadmap-intro p')?.textContent?.trim() || 'Chúng tôi liên tục cải tiến và phát triển VanLang Budget để mang đến trải nghiệm tốt nhất cho người dùng. Dưới đây là lộ trình phát triển của chúng tôi trong thời gian tới.',
      milestones: milestones,
      upcomingFeatures: upcomingFeatures
    };
  });
};

/**
 * Trích xuất dữ liệu từ trang Bảng giá
 * @param {Page} page Đối tượng Page của Puppeteer
 * @returns {Object} Dữ liệu trang Bảng giá
 */
const extractPricingData = async (page) => {
  return await page.evaluate(() => {
    const plans = [];
    const planElements = document.querySelectorAll('.pricing-plan');
    
    planElements.forEach(element => {
      const features = [];
      const featureElements = element.querySelectorAll('.plan-features li');
      
      featureElements.forEach(featureElement => {
        features.push(featureElement.textContent.trim());
      });

      const plan = {
        name: element.querySelector('.plan-name')?.textContent?.trim() || '',
        price: element.querySelector('.plan-price')?.textContent?.trim().replace(/[^\d.,]/g, '') || '',
        currency: element.querySelector('.plan-currency')?.textContent?.trim() || 'VND',
        period: element.querySelector('.plan-period')?.textContent?.trim() || 'tháng',
        description: element.querySelector('.plan-description')?.textContent?.trim() || '',
        features: features,
        cta: element.querySelector('.plan-cta')?.textContent?.trim() || 'Đăng ký ngay',
        popular: element.classList.contains('popular')
      };
      plans.push(plan);
    });

    const faq = [];
    const faqElements = document.querySelectorAll('.faq-item');
    
    faqElements.forEach(element => {
      const item = {
        question: element.querySelector('.faq-question')?.textContent?.trim() || '',
        answer: element.querySelector('.faq-answer')?.textContent?.trim() || ''
      };
      faq.push(item);
    });

    return {
      title: document.querySelector('.pricing-header h1')?.textContent?.trim() || 'Bảng giá',
      subtitle: document.querySelector('.pricing-header p')?.textContent?.trim() || 'Lựa chọn gói phù hợp với nhu cầu của bạn',
      description: document.querySelector('.pricing-intro p')?.textContent?.trim() || 'VanLang Budget cung cấp nhiều gói dịch vụ khác nhau để đáp ứng nhu cầu của mọi người dùng, từ cá nhân đến doanh nghiệp nhỏ.',
      plans: plans,
      faq: faq
    };
  });
};

/**
 * Trích xuất dữ liệu từ trang Liên hệ
 * @param {Page} page Đối tượng Page của Puppeteer
 * @returns {Object} Dữ liệu trang Liên hệ
 */
const extractContactData = async (page) => {
  return await page.evaluate(() => {
    return {
      title: document.querySelector('.contact-header h1')?.textContent?.trim() || 'Liên hệ',
      subtitle: document.querySelector('.contact-header p')?.textContent?.trim() || 'Chúng tôi luôn sẵn sàng hỗ trợ bạn',
      description: document.querySelector('.contact-intro p')?.textContent?.trim() || 'Nếu bạn có bất kỳ câu hỏi nào về VanLang Budget hoặc cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi. Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn.',
      contactInfo: {
        email: document.querySelector('.contact-email')?.textContent?.trim() || 'support@vanglangbudget.com',
        phone: document.querySelector('.contact-phone')?.textContent?.trim() || '+84 28 1234 5678',
        address: document.querySelector('.contact-address')?.textContent?.trim() || '123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh, Việt Nam',
        workingHours: document.querySelector('.working-hours')?.textContent?.trim() || 'Thứ Hai - Thứ Sáu: 9:00 - 17:00'
      },
      mapImage: document.querySelector('.contact-map img')?.getAttribute('src') || '/images/contact/map.png',
      contactImage: document.querySelector('.contact-image img')?.getAttribute('src') || '/images/contact/contact.jpg'
    };
  });
};

/**
 * Đồng bộ dữ liệu từ frontend vào admin
 */
const syncFromFrontend = async () => {
  console.log('=== BẮT ĐẦU ĐỒNG BỘ DỮ LIỆU TỪ FRONTEND ===');
  console.log('Thời gian bắt đầu:', new Date().toLocaleString());
  console.log('');

  try {
    // Khởi tạo trình duyệt
    const browser = await puppeteer.launch({
      headless: true, // Chạy ẩn danh
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Đồng bộ từng trang
    for (const page of PAGES) {
      console.log(`Đang đồng bộ dữ liệu từ ${page.url}...`);
      
      // Mở trang
      const browserPage = await browser.newPage();
      await browserPage.goto(page.url, { waitUntil: 'networkidle2' });

      // Trích xuất dữ liệu
      let data;
      switch (page.endpoint) {
        case 'homepage':
          data = await extractHomepageData(browserPage);
          break;
        case 'about':
          data = await extractAboutData(browserPage);
          break;
        case 'features':
          data = await extractFeaturesData(browserPage);
          break;
        case 'roadmap':
          data = await extractRoadmapData(browserPage);
          break;
        case 'pricing':
          data = await extractPricingData(browserPage);
          break;
        case 'contact':
          data = await extractContactData(browserPage);
          break;
        default:
          data = {};
      }

      // Lưu dữ liệu vào file JSON để kiểm tra
      const dataPath = path.join(__dirname, `${page.endpoint}-data.json`);
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      console.log(`Đã lưu dữ liệu vào file: ${dataPath}`);

      // Gửi dữ liệu lên API
      const viResult = await postToApi(`${SITE_CONTENT_ENDPOINT}/${page.endpoint}`, {
        content: data,
        language: 'vi'
      });
      
      console.log(`Kết quả đồng bộ ${page.endpoint} tiếng Việt:`, viResult ? 'Thành công' : 'Thất bại');

      // Đóng trang
      await browserPage.close();
    }

    // Đóng trình duyệt
    await browser.close();

    console.log('');
    console.log('=== ĐỒNG BỘ DỮ LIỆU TỪ FRONTEND HOÀN TẤT ===');
    console.log('Thời gian kết thúc:', new Date().toLocaleString());
  } catch (error) {
    console.error('=== LỖI KHI ĐỒNG BỘ DỮ LIỆU TỪ FRONTEND ===');
    console.error('Chi tiết lỗi:', error.message);
    console.error('');
    console.error('Vui lòng kiểm tra:');
    console.error('1. Frontend đang chạy trên cổng 3000');
    console.error('2. Backend đang chạy trên cổng 4000');
    console.error('3. Puppeteer đã được cài đặt (npm install puppeteer)');
    process.exit(1);
  }
};

// Chạy hàm đồng bộ
syncFromFrontend();
