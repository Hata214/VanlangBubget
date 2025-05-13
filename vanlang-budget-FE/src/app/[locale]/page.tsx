'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import SectionContent from '@/components/common/SectionContent'

export default function HomePage() {
    const t = useTranslations('home');

    return (
        <main>
            {/* Hero Section */}
            <SectionContent
                sectionKey="hero"
                categoryFields={['title', 'subtitle', 'description', 'cta', 'secondaryCta', 'image']}
                render={(content) => (
                    <section className="hero-section">
                        <div className="container mx-auto px-4 py-16 md:py-24">
                            <div className="flex flex-col md:flex-row items-center">
                                <div className="md:w-1/2 mb-8 md:mb-0">
                                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                        {content.title}
                                    </h1>
                                    <p className="text-lg mb-6">
                                        {content.description}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Link href="/register" className="btn-primary">
                                            {content.cta}
                                        </Link>
                                        <Link href="/features" className="btn-secondary">
                                            {content.secondaryCta}
                                        </Link>
                                    </div>
                                </div>
                                <div className="md:w-1/2">
                                    <img
                                        src={content.image}
                                        alt="VanLang Budget Hero"
                                        className="w-full h-auto rounded-lg shadow-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            />

            {/* Features Section */}
            <SectionContent
                sectionKey="features"
                categoryFields={['title', 'subtitle', 'feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6']}
                render={(content) => (
                    <section className="features-section bg-gray-50 py-16">
                        <div className="container mx-auto px-4">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold mb-4">{content.title}</h2>
                                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                    {content.subtitle}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6'].map((featureKey) => (
                                    content[featureKey] && (
                                        <div key={featureKey} className="bg-white p-6 rounded-lg shadow-md">
                                            <div className="text-primary mb-4">
                                                {/* Biểu tượng tính năng */}
                                                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2">{content[featureKey].title}</h3>
                                            <p className="text-gray-600">{content[featureKey].description}</p>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            />

            {/* Testimonials Section */}
            <SectionContent
                sectionKey="testimonials"
                categoryFields={['title', 'subtitle', 'testimonial1', 'testimonial2', 'testimonial3']}
                render={(content) => (
                    <section className="testimonials-section py-16">
                        <div className="container mx-auto px-4">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold mb-4">{content.title}</h2>
                                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                    {content.subtitle}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {['testimonial1', 'testimonial2', 'testimonial3'].map((testimonialKey) => (
                                    content[testimonialKey] && (
                                        <div key={testimonialKey} className="bg-white p-6 rounded-lg shadow-md">
                                            <div className="flex items-center mb-4">
                                                <img
                                                    src={content[testimonialKey].avatar || '/images/avatar-placeholder.png'}
                                                    alt={content[testimonialKey].name}
                                                    className="w-12 h-12 rounded-full mr-4"
                                                />
                                                <div>
                                                    <h4 className="font-semibold">{content[testimonialKey].name}</h4>
                                                    <p className="text-sm text-gray-600">{content[testimonialKey].position}</p>
                                                </div>
                                            </div>
                                            <p className="text-gray-700 italic">"{content[testimonialKey].content}"</p>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            />

            {/* Pricing Section */}
            <SectionContent
                sectionKey="pricing"
                categoryFields={['title', 'subtitle', 'free', 'premium', 'business']}
                render={(content) => (
                    <section className="pricing-section bg-gray-50 py-16">
                        <div className="container mx-auto px-4">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold mb-4">{content.title}</h2>
                                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                    {content.subtitle}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {['free', 'premium', 'business'].map((planKey) => (
                                    content[planKey] && (
                                        <div key={planKey} className={`bg-white p-6 rounded-lg shadow-md ${planKey === 'premium' ? 'border-2 border-primary' : ''}`}>
                                            <h3 className="text-xl font-bold mb-2">{content[planKey].name}</h3>
                                            <div className="text-3xl font-bold mb-4">{content[planKey].price}</div>
                                            <p className="text-gray-600 mb-6">{content[planKey].description}</p>

                                            <ul className="mb-8 space-y-2">
                                                {content[planKey].features?.map((feature: string, index: number) => (
                                                    <li key={index} className="flex items-center">
                                                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                        </svg>
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>

                                            <Link
                                                href={planKey === 'business' ? '/contact' : '/register'}
                                                className={`block text-center py-2 px-4 rounded ${planKey === 'premium'
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                                    }`}
                                            >
                                                {content[planKey].cta}
                                            </Link>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            />

            {/* CTA Section */}
            <section className="cta-section bg-primary text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">Bắt đầu quản lý tài chính ngay hôm nay</h2>
                    <p className="text-lg mb-8 max-w-2xl mx-auto">
                        Đăng ký miễn phí và bắt đầu hành trình quản lý tài chính thông minh với VanLang Budget.
                    </p>
                    <Link href="/register" className="bg-white text-primary font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition duration-300">
                        Đăng ký ngay
                    </Link>
                </div>
            </section>
        </main>
    );
} 