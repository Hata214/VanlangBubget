'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ChevronLeft, Mail, Phone, MapPin, Clock, Send, HelpCircle } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'

interface FormField {
    name: string
    type: string
    required: boolean
}

export default function ContactPage() {
    const t = useTranslations();
    const [formData, setFormData] = useState<Record<string, string>>({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: ''
    });
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Định nghĩa các trường form từ ngôn ngữ
    const formFields: FormField[] = [
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
        { name: 'subject', type: 'text', required: true },
        { name: 'message', type: 'textarea', required: true },
        { name: 'category', type: 'select', required: true }
    ];

    // Định nghĩa các danh mục hỗ trợ và câu hỏi thường gặp từ translate
    const supportCategories = ['technical', 'feedback', 'business'];
    const faqItems = [0, 1, 2]; // Số lượng câu hỏi trong file ngôn ngữ

    const handleInputChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Giả lập gửi form
        setTimeout(() => {
            setIsSubmitting(false);
            setFormSubmitted(true);

            // Reset form sau khi gửi
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
                category: ''
            });

            // Ẩn thông báo thành công sau 5 giây
            setTimeout(() => {
                setFormSubmitted(false);
            }, 5000);
        }, 1500);
    };

    const renderFormField = (field: FormField) => {
        switch (field.type) {
            case 'text':
            case 'email':
                return (
                    <Input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        placeholder={t(`contact.form.placeholders.${field.name}`)}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                );
            case 'textarea':
                return (
                    <Textarea
                        id={field.name}
                        name={field.name}
                        placeholder={t(`contact.form.placeholders.${field.name}`)}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="min-h-[120px]"
                    />
                );
            case 'select':
                return (
                    <Select
                        value={formData[field.name] || ''}
                        onValueChange={(value) => handleInputChange(field.name, value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t(`contact.form.placeholders.${field.name}`)} />
                        </SelectTrigger>
                        <SelectContent>
                            {supportCategories.map((category, index) => (
                                <SelectItem key={index} value={category}>
                                    {t(`contact.supportCategories.${category}.title`)}
                                </SelectItem>
                            ))}
                            <SelectItem value="other">{t('contact.form.categoryOther')}</SelectItem>
                        </SelectContent>
                    </Select>
                );
            default:
                return null;
        }
    };

    return (
        <PublicLayout>
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <Link href="/" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span>{t('common.backToHome')}</span>
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('contact.title')}</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">{t('contact.subtitle')}</p>
                </div>

                {/* Mô tả */}
                <div className="mb-16">
                    <Card>
                        <CardContent className="p-8">
                            <p className="text-lg leading-relaxed">
                                {t('contact.description')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
                    {/* Thông tin liên hệ */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6">{t('contact.contactInfo.title')}</h2>
                        <Card className="overflow-hidden">
                            <CardContent className="p-6 space-y-6">
                                <div className="flex items-start">
                                    <Mail className="w-5 h-5 text-indigo-600 mt-1 mr-3" />
                                    <div>
                                        <p className="font-medium">{t('contact.contactInfo.emailLabel')}</p>
                                        <a href={`mailto:${t('contact.contactInfo.email')}`} className="text-indigo-600 hover:text-indigo-800">
                                            {t('contact.contactInfo.email')}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <Phone className="w-5 h-5 text-indigo-600 mt-1 mr-3" />
                                    <div>
                                        <p className="font-medium">{t('contact.contactInfo.phoneLabel')}</p>
                                        <a href={`tel:${t('contact.contactInfo.phone').replace(/\s+/g, '')}`} className="text-indigo-600 hover:text-indigo-800">
                                            {t('contact.contactInfo.phone')}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <MapPin className="w-5 h-5 text-indigo-600 mt-1 mr-3" />
                                    <div>
                                        <p className="font-medium">{t('contact.contactInfo.addressLabel')}</p>
                                        <p>{t('contact.contactInfo.address')}</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <Clock className="w-5 h-5 text-indigo-600 mt-1 mr-3" />
                                    <div>
                                        <p className="font-medium">{t('contact.contactInfo.workingHoursLabel')}</p>
                                        <p>{t('contact.contactInfo.workingHours')}</p>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="font-medium mb-4">{t('footer.app.followUs')}</p>
                                    <div className="flex space-x-4">
                                        {['facebook', 'twitter', 'linkedin', 'instagram'].map((platform, index) => (
                                            <a
                                                key={index}
                                                href={t(`contact.socialMedia.${platform}.url`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-500 hover:text-indigo-600"
                                            >
                                                <span className="sr-only">{t(`contact.socialMedia.${platform}.name`)}</span>
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                    {t(`contact.socialMedia.${platform}.name`).charAt(0)}
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Form liên hệ */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-6">{t('contact.form.title')}</h2>
                        <Card>
                            <CardContent className="p-6">
                                {formSubmitted && (
                                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
                                        <span className="block sm:inline">{t('contact.form.successMessage')}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {formFields.map((field, index) => (
                                        <div key={index} className="space-y-2">
                                            <Label htmlFor={field.name}>
                                                {t(`contact.form.fields.${field.name}`)}
                                                {field.required && <span className="text-red-500">*</span>}
                                            </Label>
                                            {renderFormField(field)}
                                        </div>
                                    ))}

                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <span className="mr-2">{t('common.loading')}</span>
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                {t('contact.form.submitButton')}
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Danh mục hỗ trợ */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold mb-6">{t('contact.supportCategories.title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {supportCategories.map((category, index) => (
                            <Card key={index}>
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-bold mb-2 text-indigo-600">
                                        {t(`contact.supportCategories.${category}.title`)}
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        {t(`contact.supportCategories.${category}.description`)}
                                    </p>
                                    <a
                                        href={`mailto:${t(`contact.supportCategories.${category}.email`)}`}
                                        className="text-indigo-600 hover:text-indigo-800 flex items-center"
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        {t(`contact.supportCategories.${category}.email`)}
                                    </a>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Câu hỏi thường gặp */}
                <div>
                    <div className="flex items-center mb-8">
                        <HelpCircle className="h-7 w-7 text-indigo-600 mr-3" />
                        <h2 className="text-2xl font-bold">{t('contact.faq.title')}</h2>
                    </div>
                    <div className="space-y-6">
                        {faqItems.map((item) => (
                            <Card key={item}>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold mb-2">
                                        {t(`contact.faq.questions.${item}.question`)}
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        {t(`contact.faq.questions.${item}.answer`)}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
} 