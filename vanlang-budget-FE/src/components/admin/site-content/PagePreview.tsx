'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl'; // Thêm import này



// Interfaces for content types

interface FeatureItem {
    title: string;
    description: string;
    icon?: string;
}

interface MilestoneItem {
    title: string;
    description: string;
    date: string;
}

interface PlanItem {
    name: string;
    description: string;
    price: string;
    features: string[];
    popular?: boolean;
    popularLabel?: string;
    buttonText?: string;
}

interface FAQItem {
    question: string;
    answer: string;
}

interface PagePreviewProps {
    page: string;
    language: 'vi' | 'en';
    content: any;
    viewMode: 'desktop' | 'tablet' | 'mobile';
    isEditMode: boolean;
    editingField: string | null;
    onContentChange: (field: string, value: any) => void;
    onEditField: (field: string | null) => void;
    isLoading: boolean;
}

export default function PagePreview({
    page,
    language,
    content,
    viewMode,
    isEditMode,
    editingField,
    onEditField,
    isLoading
}: PagePreviewProps) {
    const t = useTranslations(); // Di chuyển lên đây
    const previewRef = useRef<HTMLDivElement>(null);
    const [renderKey, setRenderKey] = useState(0);

    // Force re-render when content changes
    useEffect(() => {
        console.log('🔄 PagePreview: Content updated, forcing re-render');
        console.log('📄 PagePreview: Page:', page);
        console.log('🌐 PagePreview: Language:', language);
        console.log('📝 PagePreview: Content:', content);
        console.log('📝 PagePreview: Content structure:', JSON.stringify(content, null, 2));

        // For features page, check specific content
        if (page === 'features') {
            console.log('🎯 Features page - Title:', content?.title);
            console.log('🎯 Features page - Subtitle:', content?.subtitle);
            console.log('🎯 Features page - Features array:', content?.features);
            console.log('🎯 Features page - Content keys:', Object.keys(content || {}));
            console.log('🎯 Features page - Title value type:', typeof content?.title);
            console.log('🎯 Features page - Title exact value:', JSON.stringify(content?.title));
        }

        // For roadmap page, check specific content
        if (page === 'roadmap') {
            console.log('🗺️ Roadmap page - Title:', content?.title);
            console.log('🗺️ Roadmap page - Description:', content?.description);
            console.log('🗺️ Roadmap page - Milestones array:', content?.milestones);
            console.log('🗺️ Roadmap page - Content keys:', Object.keys(content || {}));
            console.log('🗺️ Roadmap page - Title value type:', typeof content?.title);
            console.log('🗺️ Roadmap page - Title exact value:', JSON.stringify(content?.title));
        }

        setRenderKey(prev => prev + 1);
    }, [content, page, language]);

    // Get viewport dimensions based on view mode
    const getViewportDimensions = () => {
        switch (viewMode) {
            case 'mobile':
                return { width: '375px', height: '100%' };
            case 'tablet':
                return { width: '768px', height: '100%' };
            case 'desktop':
            default:
                return { width: '100%', height: '100%' };
        }
    };

    const dimensions = getViewportDimensions();

    // Handle click on editable elements
    const handleEditableClick = (event: React.MouseEvent) => {
        if (!isEditMode) return;

        const target = event.target as HTMLElement;
        const editableElement = target.closest('.editable-content');

        if (editableElement) {
            event.preventDefault();
            event.stopPropagation();

            const field = editableElement.getAttribute('data-field');
            if (field) {
                onEditField(field);
            }
        }
    };

    // Render editable content wrapper
    const renderEditableContent = (field: string, value: any, className: string = '') => {
        const isEditing = editingField === field;

        // Debug logging for header fields
        if (page === 'header' && ['nav1', 'nav2', 'nav3', 'nav4', 'logo'].includes(field)) {
            console.log(`🔍 renderEditableContent - field: ${field}, value: ${value}, content.${field}: ${content?.[field]}`);
        }

        return (
            <span
                className={`editable-content ${className} ${isEditMode
                    ? 'cursor-pointer hover:bg-blue-50 hover:outline hover:outline-2 hover:outline-blue-300 transition-all duration-200'
                    : ''
                    } ${isEditing
                        ? 'bg-blue-100 outline outline-2 outline-blue-500'
                        : ''
                    }`}
                data-field={field}
                onClick={handleEditableClick}
                title={isEditMode ? `Nhấp để chỉnh sửa: ${field}` : undefined}
            >
                {value || (isEditMode ? <span className="text-gray-400 italic">Nhấp để thêm nội dung</span> : '')}
            </span>
        );
    };

    // Render different page types
    const renderPageContent = () => {
        // Extract base page type (remove any sub-section suffixes)
        const basePage = page.split('-')[0];

        switch (basePage) {
            case 'homepage':
                return renderHomepage();
            case 'about':
                return renderAboutPage();
            case 'features':
                return renderFeaturesPage();
            case 'roadmap':
                return renderRoadmapPage();
            case 'pricing':
                return renderPricingPage();
            case 'contact':
                return renderContactPage();
            case 'header':
                return renderHeaderContent();
            case 'footer':
                return renderFooterContent();
            default:
                return renderDefaultPage();
        }
    };

    const renderHomepage = () => (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            {renderEditableContent('hero.title', content?.hero?.title || 'Quản lý tài chính cá nhân một cách thông minh')}
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-blue-100">
                            {renderEditableContent('hero.subtitle', content?.hero?.subtitle || 'VanLang Budget giúp bạn theo dõi chi tiêu, quản lý ngân sách và đạt được mục tiêu tài chính một cách dễ dàng.')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                                {renderEditableContent('hero.buttonText', content?.hero?.buttonText || 'Bắt đầu ngay')}
                            </button>
                        </div>
                    </div>
                </div>
            </section>



            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {renderEditableContent('features.title', content?.features?.title || 'Tính năng nổi bật')}
                        </h2>
                        <p className="text-lg text-gray-600">
                            {renderEditableContent('features.description', content?.features?.description || 'Những công cụ mạnh mẽ giúp bạn quản lý tài chính hiệu quả')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                    <span className="text-blue-600 font-bold">{index + 1}</span>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">
                                    {renderEditableContent(`features.items.${index}.title`, content?.features?.items?.[index]?.title || `Tính năng ${index + 1}`)}
                                </h3>
                                <p className="text-gray-600">
                                    {renderEditableContent(`features.items.${index}.description`, content?.features?.items?.[index]?.description || `Mô tả tính năng ${index + 1}`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {renderEditableContent('testimonials.title', content?.testimonials?.title || 'Khách hàng nói gì về chúng tôi')}
                        </h2>
                        <p className="text-lg text-gray-600">
                            {renderEditableContent('testimonials.description', content?.testimonials?.description || 'Trải nghiệm từ người dùng thực tế')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[0, 1, 2].map((index) => (
                            <div key={index} className="bg-gray-50 p-8 rounded-lg">
                                <div className="flex mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span key={star} className="text-yellow-400 text-xl">★</span>
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-6 italic">
                                    &quot;{renderEditableContent(`testimonials.items.${index}.content`, content?.testimonials?.items?.[index]?.content || `Đánh giá ${index + 1}`)}&quot;
                                </p>
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {renderEditableContent(`testimonials.items.${index}.author`, content?.testimonials?.items?.[index]?.author || `Khách hàng ${index + 1}`)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {renderEditableContent(`testimonials.items.${index}.title`, content?.testimonials?.items?.[index]?.title || `Vị trí ${index + 1}`)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {renderEditableContent('pricing.title', content?.pricing?.title || 'Bảng giá')}
                        </h2>
                        <p className="text-lg text-gray-600">
                            {renderEditableContent('pricing.description', content?.pricing?.description || 'Lựa chọn gói phù hợp với nhu cầu của bạn')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {[0, 1].map((index) => (
                            <div key={index} className={`bg-white rounded-lg shadow-md overflow-hidden border ${index === 1 ? 'border-blue-500' : 'border-gray-200'}`}>
                                <div className={`p-6 ${index === 1 ? 'bg-blue-600 text-white' : 'bg-gray-50'}`}>
                                    <h3 className="text-xl font-bold mb-2">
                                        {renderEditableContent(`pricing.plans.${index}.name`, content?.pricing?.plans?.[index]?.name || `Gói ${index + 1}`)}
                                    </h3>
                                    <p className="mb-4">
                                        {renderEditableContent(`pricing.plans.${index}.description`, content?.pricing?.plans?.[index]?.description || `Mô tả gói ${index + 1}`)}
                                    </p>
                                    <p className="text-3xl font-bold">
                                        {renderEditableContent(`pricing.plans.${index}.price`, content?.pricing?.plans?.[index]?.price || 'Miễn phí')}
                                    </p>
                                </div>
                                <div className="p-6">
                                    <ul className="space-y-3">
                                        {(content?.pricing?.plans?.[index]?.features || ['Tính năng 1', 'Tính năng 2', 'Tính năng 3']).map((feature: string, featureIndex: number) => (
                                            <li key={featureIndex} className="flex items-center">
                                                <span className="text-green-500 mr-2">✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <button className={`w-full mt-6 py-3 px-4 rounded-lg font-medium ${index === 1 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                        Chọn gói này
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600 text-white">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        {renderEditableContent('cta.title', content?.cta?.title || 'Sẵn sàng bắt đầu?')}
                    </h2>
                    <p className="text-xl mb-8 text-blue-100">
                        {renderEditableContent('cta.description', content?.cta?.description || 'Tham gia cùng hàng nghìn người dùng đã tin tưởng VanLang Budget')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                            {renderEditableContent('cta.primaryButtonText', content?.cta?.primaryButtonText || 'Bắt đầu miễn phí')}
                        </button>
                        <button className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                            {renderEditableContent('cta.secondaryButtonText', content?.cta?.secondaryButtonText || 'Liên hệ tư vấn')}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );

    const renderAboutPage = () => {
        // Get content for current language - extract từ nested structure
        let aboutData = content || {};

        // Nếu content có structure {vi: {...}} thì extract language content
        if (aboutData[language]) {
            aboutData = aboutData[language];
        }

        console.log('📖 renderAboutPage called');
        console.log('📖 Current language:', language);
        console.log('📖 Raw content:', content);
        console.log('📖 About data after extraction:', aboutData);

        return (
            <div className="min-h-screen bg-white py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            {renderEditableContent('title', aboutData?.title || 'Về Chúng Tôi')}
                        </h1>
                        <p className="text-xl text-gray-600">
                            {renderEditableContent('subtitle', aboutData?.subtitle || 'Hành trình của VanLang Budget')}
                        </p>
                    </div>

                    <div className="prose prose-lg mx-auto mb-12">
                        <div className="text-gray-700 leading-relaxed text-lg">
                            {renderEditableContent('description', aboutData?.description || 'VanLang Budget được phát triển bởi một nhóm những người đam mê tài chính cá nhân...')}
                        </div>
                    </div>

                    {/* Mission Section */}
                    <div className="mb-12">
                        <div className="bg-blue-50 rounded-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {renderEditableContent('mission.title', aboutData?.mission?.title || 'Sứ Mệnh')}
                            </h2>
                            <p className="text-gray-700 text-lg">
                                {renderEditableContent('mission.content', aboutData?.mission?.content || 'Giúp mọi người đạt được sự tự do tài chính thông qua các công cụ quản lý tài chính thông minh và trực quan.')}
                            </p>
                        </div>
                    </div>

                    {/* Vision Section */}
                    <div className="mb-12">
                        <div className="bg-green-50 rounded-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {renderEditableContent('vision.title', aboutData?.vision?.title || 'Tầm Nhìn')}
                            </h2>
                            <p className="text-gray-700 text-lg">
                                {renderEditableContent('vision.content', aboutData?.vision?.content || 'Trở thành ứng dụng quản lý tài chính cá nhân hàng đầu tại Việt Nam, giúp hàng triệu người kiểm soát chi tiêu, tiết kiệm hiệu quả và đạt được các mục tiêu tài chính.')}
                            </p>
                        </div>
                    </div>

                    {/* Values Section */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                            {renderEditableContent('values.title', aboutData?.values?.title || 'Giá Trị Cốt Lõi')}
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {(aboutData?.values?.items || [
                                { title: 'Đơn Giản', description: 'Giao diện trực quan, dễ sử dụng cho mọi đối tượng người dùng.' },
                                { title: 'Bảo Mật', description: 'Bảo vệ thông tin tài chính cá nhân với các tiêu chuẩn bảo mật cao nhất.' },
                                { title: 'Hiệu Quả', description: 'Cung cấp các công cụ mạnh mẽ giúp quản lý tài chính một cách hiệu quả.' }
                            ]).map((item: any, index: number) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                        {renderEditableContent(`values.items.${index}.title`, item.title || '')}
                                    </h3>
                                    <p className="text-gray-600">
                                        {renderEditableContent(`values.items.${index}.description`, item.description || '')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFeaturesPage = () => {
        // Get content for current language - sử dụng content trực tiếp
        const featuresData = content || {};
        const featuresArray = featuresData.features || [];

        console.log('🎯 renderFeaturesPage called');
        console.log('🎯 Current language:', language);
        console.log('🎯 Raw content:', content);
        console.log('🎯 Features data:', featuresData);
        console.log('🎯 Features array:', featuresArray);
        console.log('🎯 Title from featuresData:', featuresData.title);
        console.log('🎯 Subtitle from featuresData:', featuresData.subtitle);

        return (
            <div className="min-h-screen bg-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            {renderEditableContent('title', featuresData.title || 'Tính năng nổi bật')}
                        </h1>
                        <p className="text-xl text-gray-600">
                            {renderEditableContent('subtitle', featuresData.subtitle || 'Công cụ quản lý tài chính mạnh mẽ')}
                        </p>
                        <p className="text-lg text-gray-500 mt-4">
                            {renderEditableContent('description', featuresData.description || 'Những công cụ giúp bạn quản lý tài chính hiệu quả')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuresArray.length > 0 ? featuresArray.map((feature: FeatureItem, index: number) => (
                            <div key={index} className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                <div className="text-4xl mb-4">
                                    {feature.icon || '🔧'}
                                </div>
                                <h3 className="text-xl font-semibold mb-3">
                                    {renderEditableContent(`features.${index}.title`, feature.title || `Tính năng ${index + 1}`)}
                                </h3>
                                <p className="text-gray-600">
                                    {renderEditableContent(`features.${index}.description`, feature.description || `Mô tả tính năng ${index + 1}`)}
                                </p>
                            </div>
                        )) : [1, 2, 3, 4, 5, 6].map((index) => (
                            <div key={index} className="bg-gray-50 p-6 rounded-lg">
                                <h3 className="text-xl font-semibold mb-3">
                                    {renderEditableContent(`features.item${index}.title`, `Tính năng ${index}`)}
                                </h3>
                                <p className="text-gray-600">
                                    {renderEditableContent(`features.item${index}.description`, `Mô tả tính năng ${index}`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderRoadmapPage = () => {
        // Get content for current language - sử dụng content trực tiếp
        const roadmapData = content || {};
        const milestonesArray = roadmapData.milestones || [];

        console.log('🎯 renderRoadmapPage called');
        console.log('🎯 Current language:', language);
        console.log('🎯 Raw content:', content);
        console.log('🎯 Roadmap data:', roadmapData);
        console.log('🎯 Milestones array:', milestonesArray);
        console.log('🎯 Title from roadmapData:', roadmapData.title);
        console.log('🎯 Description from roadmapData:', roadmapData.description);
        console.log('🎯 Roadmap content keys:', Object.keys(roadmapData || {}));
        console.log('🎯 Title value type:', typeof roadmapData?.title);
        console.log('🎯 Title exact value:', JSON.stringify(roadmapData?.title));

        return (
            <div className="min-h-screen bg-white py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            {renderEditableContent('title', roadmapData.title || 'Lộ trình phát triển')}
                        </h1>
                        <p className="text-xl text-gray-600">
                            {renderEditableContent('description', roadmapData.description || 'Kế hoạch phát triển sản phẩm')}
                        </p>
                    </div>

                    <div className="space-y-8">
                        {milestonesArray.length > 0 ? milestonesArray.map((milestone: MilestoneItem, index: number) => (
                            <div key={index} className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                    {index + 1}
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-xl font-semibold mb-2">
                                        {renderEditableContent(`milestones.${index}.title`, milestone.title || `Giai đoạn ${index + 1}`)}
                                    </h3>
                                    <p className="text-gray-600">
                                        {renderEditableContent(`milestones.${index}.description`, milestone.description || `Mô tả giai đoạn ${index + 1}`)}
                                    </p>
                                    <p className="text-sm text-blue-600 mt-2">
                                        {renderEditableContent(`milestones.${index}.date`, milestone.date || `Q${index + 1} 2025`)}
                                    </p>
                                </div>
                            </div>
                        )) : [1, 2, 3, 4].map((index) => (
                            <div key={index} className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                    {index}
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-xl font-semibold mb-2">
                                        {renderEditableContent(`milestones.${index - 1}.title`, `Giai đoạn ${index}`)}
                                    </h3>
                                    <p className="text-gray-600">
                                        {renderEditableContent(`milestones.${index - 1}.description`, `Mô tả giai đoạn ${index}`)}
                                    </p>
                                    <p className="text-sm text-blue-600 mt-2">
                                        {renderEditableContent(`milestones.${index - 1}.date`, `Q${index} 2025`)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderPricingPage = () => {
        // Get content for current language - extract từ nested structure
        let pricingData = content || {};

        // Nếu content có structure {vi: {...}} thì extract language content
        if (pricingData[language]) {
            pricingData = pricingData[language];
        }

        const plansArray = pricingData.plans || [];

        console.log('💰 renderPricingPage called');
        console.log('💰 Current language:', language);
        console.log('💰 Raw content:', content);
        console.log('💰 Pricing data after extraction:', pricingData);
        console.log('💰 Plans array:', plansArray);
        console.log('💰 Title from pricingData:', pricingData.title);
        console.log('💰 Description from pricingData:', pricingData.description);

        return (
            <div className="min-h-screen bg-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            {renderEditableContent('title', pricingData.title || 'Bảng giá')}
                        </h1>
                        <p className="text-xl text-gray-600">
                            {renderEditableContent('description', pricingData.description || 'Chọn gói dịch vụ phù hợp với nhu cầu tài chính của bạn')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {plansArray.length > 0 ? plansArray.map((plan: PlanItem, index: number) => (
                            <div key={index} className={`bg-white border border-gray-200 rounded-lg p-6 shadow-md ${plan.popular ? 'ring-2 ring-indigo-500' : ''}`}>
                                {plan.popular && (
                                    <div className="bg-indigo-500 text-white text-xs font-bold uppercase py-1 text-center mb-4 -mx-6 -mt-6">
                                        {plan.popularLabel || 'Phổ biến nhất'}
                                    </div>
                                )}
                                <h3 className="text-xl font-bold mb-2">
                                    {renderEditableContent(`plans.${index}.name`, plan.name || `Gói ${index + 1}`)}
                                </h3>
                                <div className="text-3xl font-bold text-indigo-600 mb-4">
                                    {renderEditableContent(`plans.${index}.price`, plan.price || 'Miễn phí')}
                                </div>
                                <p className="text-gray-600 mb-6">
                                    {renderEditableContent(`plans.${index}.description`, plan.description || `Mô tả gói ${index + 1}`)}
                                </p>
                                <ul className="space-y-3 mb-6">
                                    {(plan.features || ['Tính năng 1', 'Tính năng 2', 'Tính năng 3']).map((feature: string, featureIndex: number) => (
                                        <li key={featureIndex} className="flex items-start">
                                            <span className="text-green-500 mr-2 mt-1">✓</span>
                                            <span>{renderEditableContent(`plans.${index}.features.${featureIndex}`, feature)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className={`w-full py-2 px-4 rounded-md font-medium ${plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} transition-colors`}>
                                    {renderEditableContent(`plans.${index}.buttonText`, plan.buttonText || 'Đăng ký ngay')}
                                </button>
                            </div>
                        )) : [0, 1].map((index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
                                <h3 className="text-xl font-bold mb-2">
                                    {renderEditableContent(`plans.${index}.name`, `Gói ${index + 1}`)}
                                </h3>
                                <div className="text-3xl font-bold text-indigo-600 mb-4">
                                    {renderEditableContent(`plans.${index}.price`, 'Miễn phí')}
                                </div>
                                <p className="text-gray-600 mb-6">
                                    {renderEditableContent(`plans.${index}.description`, `Mô tả gói ${index + 1}`)}
                                </p>
                                <ul className="space-y-3 mb-6">
                                    {[0, 1, 2].map((featureIndex) => (
                                        <li key={featureIndex} className="flex items-start">
                                            <span className="text-green-500 mr-2 mt-1">✓</span>
                                            <span>{renderEditableContent(`plans.${index}.features.${featureIndex}`, `Tính năng ${featureIndex + 1}`)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full py-2 px-4 rounded-md font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                                    {renderEditableContent(`plans.${index}.buttonText`, 'Đăng ký ngay')}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderContactPage = () => {
        // Get content for current language - extract từ nested structure
        let contactData = content || {};

        // Nếu content có structure {vi: {...}} thì extract language content
        if (contactData[language]) {
            contactData = contactData[language];
        }

        console.log('📞 renderContactPage called');
        console.log('📞 Current language:', language);
        console.log('📞 Raw content:', content);
        console.log('📞 Contact data after extraction:', contactData);

        return (
            <div className="min-h-screen bg-white py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            {renderEditableContent('title', contactData.title || 'Liên hệ với chúng tôi')}
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            {renderEditableContent('subtitle', contactData.subtitle || 'Chúng tôi luôn sẵn sàng hỗ trợ bạn')}
                        </p>
                    </div>

                    {/* Description */}
                    <div className="mb-16">
                        <div className="bg-gray-50 rounded-lg p-8">
                            <p className="text-lg leading-relaxed text-center">
                                {renderEditableContent('description', contactData.description || 'Nếu bạn có bất kỳ câu hỏi hoặc yêu cầu nào, đừng ngần ngại liên hệ với chúng tôi. Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn.')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
                        {/* Thông tin liên hệ */}
                        <div>
                            <h2 className="text-2xl font-bold mb-6">
                                {renderEditableContent('contactInfo.title', contactData.contactInfo?.title || 'Thông tin liên hệ')}
                            </h2>
                            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-6">
                                <div className="flex items-start">
                                    <div className="w-5 h-5 text-indigo-600 mt-1 mr-3">📧</div>
                                    <div>
                                        <p className="font-medium">
                                            {renderEditableContent('contactInfo.emailLabel', contactData.contactInfo?.emailLabel || 'Email')}
                                        </p>
                                        <p className="text-indigo-600">
                                            {renderEditableContent('contactInfo.email', contactData.contactInfo?.email || 'support@vanlangbudget.com')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-5 h-5 text-indigo-600 mt-1 mr-3">📞</div>
                                    <div>
                                        <p className="font-medium">
                                            {renderEditableContent('contactInfo.phoneLabel', contactData.contactInfo?.phoneLabel || 'Điện thoại')}
                                        </p>
                                        <p className="text-gray-600">
                                            {renderEditableContent('contactInfo.phone', contactData.contactInfo?.phone || '(+84) 123 456 789')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-5 h-5 text-indigo-600 mt-1 mr-3">📍</div>
                                    <div>
                                        <p className="font-medium">
                                            {renderEditableContent('contactInfo.addressLabel', contactData.contactInfo?.addressLabel || 'Địa chỉ')}
                                        </p>
                                        <p className="text-gray-600">
                                            {renderEditableContent('contactInfo.address', contactData.contactInfo?.address || 'Hà Nội, Việt Nam')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-5 h-5 text-indigo-600 mt-1 mr-3">🕒</div>
                                    <div>
                                        <p className="font-medium">
                                            {renderEditableContent('contactInfo.workingHoursLabel', contactData.contactInfo?.workingHoursLabel || 'Giờ làm việc')}
                                        </p>
                                        <p className="text-gray-600">
                                            {renderEditableContent('contactInfo.workingHours', contactData.contactInfo?.workingHours || 'Thứ Hai - Thứ Sáu: 9:00 - 17:00')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form liên hệ */}
                        <div className="lg:col-span-2">
                            <h2 className="text-2xl font-bold mb-6">
                                {renderEditableContent('contactForm.title', contactData.contactForm?.title || 'Gửi tin nhắn cho chúng tôi')}
                            </h2>
                            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {renderEditableContent('contactForm.nameLabel', contactData.contactForm?.nameLabel || 'Họ và tên')}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={contactData.contactForm?.namePlaceholder || 'Nhập họ và tên của bạn'}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {renderEditableContent('contactForm.emailLabel', contactData.contactForm?.emailLabel || 'Email')}
                                            </label>
                                            <input
                                                type="email"
                                                placeholder={contactData.contactForm?.emailPlaceholder || 'Nhập địa chỉ email của bạn'}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {renderEditableContent('contactForm.subjectLabel', contactData.contactForm?.subjectLabel || 'Chủ đề')}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={contactData.contactForm?.subjectPlaceholder || 'Nhập chủ đề tin nhắn'}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {renderEditableContent('contactForm.messageLabel', contactData.contactForm?.messageLabel || 'Tin nhắn')}
                                        </label>
                                        <textarea
                                            rows={6}
                                            placeholder={contactData.contactForm?.messagePlaceholder || 'Nhập tin nhắn của bạn'}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                    >
                                        {renderEditableContent('contactForm.submitButton', contactData.contactForm?.submitButton || 'Gửi tin nhắn')}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Social Media Section */}
                    {contactData.socialMedia && (
                        <div className="mb-16">
                            <h2 className="text-2xl font-bold mb-8 text-center">
                                {renderEditableContent('socialMedia.title', contactData.socialMedia?.title || 'Theo dõi chúng tôi')}
                            </h2>
                            <div className="flex justify-center space-x-6">
                                <a href={contactData.socialMedia.facebook} className="text-blue-600 hover:text-blue-800 text-2xl">
                                    📘 Facebook
                                </a>
                                <a href={contactData.socialMedia.twitter} className="text-blue-400 hover:text-blue-600 text-2xl">
                                    🐦 Twitter
                                </a>
                                <a href={contactData.socialMedia.linkedin} className="text-blue-700 hover:text-blue-900 text-2xl">
                                    💼 LinkedIn
                                </a>
                                <a href={contactData.socialMedia.instagram} className="text-pink-600 hover:text-pink-800 text-2xl">
                                    📷 Instagram
                                </a>
                            </div>
                        </div>
                    )}

                    {/* FAQ Section */}
                    <div>
                        <h2 className="text-2xl font-bold mb-8 text-center">
                            {renderEditableContent('faq.title', contactData.faq?.title || 'Câu hỏi thường gặp')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(contactData.faq?.questions || [
                                { question: "Câu hỏi 1", answer: "Trả lời 1" },
                                { question: "Câu hỏi 2", answer: "Trả lời 2" },
                                { question: "Câu hỏi 3", answer: "Trả lời 3" }
                            ]).map((faq: FAQItem, index: number) => (
                                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold mb-3">
                                        {renderEditableContent(`faq.questions.${index}.question`, faq.question)}
                                    </h3>
                                    <p className="text-gray-600">
                                        {renderEditableContent(`faq.questions.${index}.answer`, faq.answer)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderHeaderContent = () => {
        console.log('🔝 Rendering header content with:', content);
        console.log('🔝 Content keys:', content ? Object.keys(content) : 'No content');
        console.log('🔝 nav1 value:', content?.nav1);
        console.log('🔝 logo value:', content?.logo);
        console.log('🔝 Full content object:', JSON.stringify(content, null, 2));

        return (
            <div className="bg-white border-b border-gray-200 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {renderEditableContent('logo', content?.logo || 'VanLang Budget')}
                            </div>
                        </div>
                        <nav className="hidden md:flex space-x-8">
                            {['nav1', 'nav2', 'nav3', 'nav4'].map((navKey: string, index: number) => {
                                const defaultValues = ['Về chúng tôi', 'Tính năng', 'Bảng giá', 'Liên hệ'];
                                return (
                                    <a key={index} href="#" className="text-gray-700 hover:text-blue-600">
                                        {renderEditableContent(navKey, content?.[navKey] || defaultValues[index])}
                                    </a>
                                );
                            })}
                        </nav>
                        <div className="flex items-center space-x-4">
                            <button className="text-gray-700 hover:text-blue-600">
                                {renderEditableContent('loginButton', content?.loginButton || 'Đăng nhập')}
                            </button>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                {renderEditableContent('signupButton', content?.signupButton || 'Đăng ký')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFooterContent = () => {
        // const t = useTranslations(); // Xóa dòng này vì đã di chuyển lên trên
        console.log('🔻 Rendering footer content with:', content);
        console.log('🔻 Content keys:', content ? Object.keys(content) : 'No content');

        return (
            <div className="bg-gray-900 text-white p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                {renderEditableContent('companyName', content?.companyName || 'VanLang Budget')}
                            </h3>
                            <p className="text-gray-400">
                                {renderEditableContent('description', content?.description || 'Ứng dụng quản lý tài chính cá nhân thông minh')}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">{t('footer.links.title')}</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>{renderEditableContent('product1', content?.product1 || t('footer.links.features'))}</li> {/* Giả sử product1 là features */}
                                <li>{renderEditableContent('product2', content?.product2 || t('footer.links.roadmap'))}</li> {/* Giả sử product2 là roadmap */}
                                <li>{renderEditableContent('product3', content?.product3 || t('footer.links.pricing'))}</li> {/* Giả sử product3 là pricing */}
                                <li>{renderEditableContent('product4', content?.product4 || 'Mục tiêu tiết kiệm')}</li> {/* Cần key cụ thể nếu có */}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">{t('footer.legal.title')}</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>{renderEditableContent('company1', content?.company1 || t('footer.links.aboutUs'))}</li> {/* Giả sử company1 là aboutUs */}
                                <li>{renderEditableContent('company2', content?.company2 || t('footer.links.contact'))}</li> {/* Giả sử company2 là contact */}
                                <li>{renderEditableContent('company3', content?.company3 || 'Tuyển dụng')}</li> {/* Cần key cụ thể nếu có */}
                                <li>{renderEditableContent('company4', content?.company4 || 'Tin tức')}</li> {/* Cần key cụ thể nếu có */}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">{t('footer.app.title')}</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>{renderEditableContent('support1', content?.support1 || 'Trung tâm hỗ trợ')}</li> {/* Cần key cụ thể nếu có */}
                                <li>{renderEditableContent('support2', content?.support2 || 'Hướng dẫn sử dụng')}</li> {/* Cần key cụ thể nếu có */}
                                <li>{renderEditableContent('support3', content?.support3 || 'FAQ')}</li> {/* Cần key cụ thể nếu có */}
                                <li>{renderEditableContent('support4', content?.support4 || 'Báo lỗi')}</li> {/* Cần key cụ thể nếu có */}
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <p className="text-gray-400 text-center md:text-left">
                                {renderEditableContent('copyright', content?.copyright || '© 2024 VanLang Budget. Tất cả quyền được bảo lưu.')}
                            </p>
                            <div className="flex space-x-4 mt-4 md:mt-0">
                                <a href="#" className="text-gray-400 hover:text-white">
                                    {renderEditableContent('socialFacebook', content?.socialFacebook || 'Facebook')}
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white">
                                    {renderEditableContent('socialTwitter', content?.socialTwitter || 'Twitter')}
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white">
                                    {renderEditableContent('socialLinkedin', content?.socialLinkedin || 'LinkedIn')}
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white">
                                    {renderEditableContent('socialInstagram', content?.socialInstagram || 'Instagram')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDefaultPage = () => {
        const basePage = page.split('-')[0];
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Trang {basePage}
                    </h1>
                    <p className="text-gray-600">
                        Nội dung đang được phát triển...
                    </p>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải nội dung...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-gray-100 p-4">
            <div
                key={renderKey} // Force re-render when content changes
                className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
                style={{
                    width: dimensions.width,
                    minHeight: dimensions.height,
                    maxWidth: viewMode === 'desktop' ? '100%' : dimensions.width
                }}
                ref={previewRef}
            >
                {renderPageContent()}
            </div>
        </div>
    );
}
