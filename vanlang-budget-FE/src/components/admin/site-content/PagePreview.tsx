'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

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
    onContentChange,
    onEditField,
    isLoading
}: PagePreviewProps) {
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

            {/* Statistics Section */}
            <section className="py-16 bg-blue-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        {[0, 1, 2].map((index) => (
                            <div key={index}>
                                <div className="text-4xl md:text-5xl font-bold mb-2">
                                    {renderEditableContent(`statistics.items.${index}.value`, content?.statistics?.items?.[index]?.value || '--')}
                                </div>
                                <div className="text-lg text-blue-100">
                                    {renderEditableContent(`statistics.items.${index}.label`, content?.statistics?.items?.[index]?.label || `Thống kê ${index + 1}`)}
                                </div>
                            </div>
                        ))}
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
                                    "{renderEditableContent(`testimonials.items.${index}.content`, content?.testimonials?.items?.[index]?.content || `Đánh giá ${index + 1}`)}"
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
                                        {(content?.pricing?.plans?.[index]?.features || ['Tính năng 1', 'Tính năng 2', 'Tính năng 3']).map((feature, featureIndex) => (
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

    const renderAboutPage = () => (
        <div className="min-h-screen bg-white py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        {renderEditableContent('title', content?.title || 'Về Chúng Tôi')}
                    </h1>
                    <p className="text-xl text-gray-600">
                        {renderEditableContent('subtitle', content?.subtitle || 'Hành trình của VanLang Budget')}
                    </p>
                </div>

                <div className="prose prose-lg mx-auto mb-12">
                    <div className="text-gray-700 leading-relaxed text-lg">
                        {renderEditableContent('description', content?.description || 'VanLang Budget được phát triển bởi một nhóm những người đam mê tài chính cá nhân...')}
                    </div>
                </div>

                {/* Mission Section */}
                {content?.mission && (
                    <div className="mb-12">
                        <div className="bg-blue-50 rounded-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {renderEditableContent('mission.title', content.mission.title || 'Sứ Mệnh')}
                            </h2>
                            <p className="text-gray-700 text-lg">
                                {renderEditableContent('mission.content', content.mission.content || '')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Vision Section */}
                {content?.vision && (
                    <div className="mb-12">
                        <div className="bg-green-50 rounded-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {renderEditableContent('vision.title', content.vision.title || 'Tầm Nhìn')}
                            </h2>
                            <p className="text-gray-700 text-lg">
                                {renderEditableContent('vision.content', content.vision.content || '')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Values Section */}
                {content?.values && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                            {renderEditableContent('values.title', content.values.title || 'Giá Trị Cốt Lõi')}
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {content.values.items?.map((item: any, index: number) => (
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
                )}
            </div>
        </div>
    );

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
                        {featuresArray.length > 0 ? featuresArray.map((feature, index) => (
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
                        {milestonesArray.length > 0 ? milestonesArray.map((milestone, index) => (
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
                        {plansArray.length > 0 ? plansArray.map((plan, index) => (
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
                                    {(plan.features || ['Tính năng 1', 'Tính năng 2', 'Tính năng 3']).map((feature, featureIndex) => (
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

    const renderContactPage = () => (
        <div className="min-h-screen bg-white py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        {renderEditableContent('contact.title', content?.contact?.title || 'Liên hệ')}
                    </h1>
                    <p className="text-xl text-gray-600">
                        {renderEditableContent('contact.subtitle', content?.contact?.subtitle || 'Chúng tôi luôn sẵn sàng hỗ trợ bạn')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Thông tin liên hệ</h3>
                        <div className="space-y-4">
                            <div>
                                <strong>Email:</strong> {renderEditableContent('contact.email', content?.contact?.email || 'contact@vanlangbudget.com')}
                            </div>
                            <div>
                                <strong>Điện thoại:</strong> {renderEditableContent('contact.phone', content?.contact?.phone || '+84 123 456 789')}
                            </div>
                            <div>
                                <strong>Địa chỉ:</strong> {renderEditableContent('contact.address', content?.contact?.address || 'Hà Nội, Việt Nam')}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-4">Gửi tin nhắn</h3>
                        <form className="space-y-4">
                            <input
                                type="text"
                                placeholder="Họ và tên"
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                            <textarea
                                placeholder="Tin nhắn"
                                rows={4}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            ></textarea>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Gửi tin nhắn
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderHeaderContent = () => (
        <div className="bg-white border-b border-gray-200 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {renderEditableContent('header.logo', content?.header?.logo || 'VanLang Budget')}
                        </div>
                    </div>
                    <nav className="hidden md:flex space-x-8">
                        {['Trang chủ', 'Tính năng', 'Bảng giá', 'Liên hệ'].map((item, index) => (
                            <a key={index} href="#" className="text-gray-700 hover:text-blue-600">
                                {renderEditableContent(`header.nav${index + 1}`, content?.header?.[`nav${index + 1}`] || item)}
                            </a>
                        ))}
                    </nav>
                    <div className="flex items-center space-x-4">
                        <button className="text-gray-700 hover:text-blue-600">
                            {renderEditableContent('header.loginButton', content?.header?.loginButton || 'Đăng nhập')}
                        </button>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            {renderEditableContent('header.signupButton', content?.header?.signupButton || 'Đăng ký')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderFooterContent = () => (
        <div className="bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">
                            {renderEditableContent('footer.companyName', content?.footer?.companyName || 'VanLang Budget')}
                        </h3>
                        <p className="text-gray-400">
                            {renderEditableContent('footer.description', content?.footer?.description || 'Ứng dụng quản lý tài chính cá nhân thông minh')}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Sản phẩm</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li>{renderEditableContent('footer.product1', content?.footer?.product1 || 'Quản lý chi tiêu')}</li>
                            <li>{renderEditableContent('footer.product2', content?.footer?.product2 || 'Lập ngân sách')}</li>
                            <li>{renderEditableContent('footer.product3', content?.footer?.product3 || 'Báo cáo tài chính')}</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Hỗ trợ</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li>{renderEditableContent('footer.support1', content?.footer?.support1 || 'Trung tâm trợ giúp')}</li>
                            <li>{renderEditableContent('footer.support2', content?.footer?.support2 || 'Liên hệ')}</li>
                            <li>{renderEditableContent('footer.support3', content?.footer?.support3 || 'FAQ')}</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Liên hệ</h4>
                        <div className="space-y-2 text-gray-400">
                            <p>{renderEditableContent('footer.email', content?.footer?.email || 'contact@vanlangbudget.com')}</p>
                            <p>{renderEditableContent('footer.phone', content?.footer?.phone || '+84 123 456 789')}</p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                    <p>{renderEditableContent('footer.copyright', content?.footer?.copyright || '© 2024 VanLang Budget. All rights reserved.')}</p>
                </div>
            </div>
        </div>
    );

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
        <div className="flex-1 bg-gray-100 p-4 overflow-auto">
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
