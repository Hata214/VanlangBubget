import { Metadata } from 'next'
import Link from 'next/link'
import PublicLayout from '@/components/layout/PublicLayout'
import { Scale, FileText, Shield, ArrowRight, Cookie } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { legalMetadata } from './metadata'
import { useTranslations } from 'next-intl'

export const metadata: Metadata = legalMetadata

export default function LegalPage() {
    const t = useTranslations('legal')

    const legalDocuments = [
        {
            title: t('terms.title'),
            description: 'Các quy định và điều khoản sử dụng dịch vụ VanLang Budget',
            href: '/legal/terms',
            icon: FileText,
            lastUpdated: '2025'
        },
        {
            title: t('privacy.title'),
            description: 'Cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn',
            href: '/legal/privacy',
            icon: Shield,
            lastUpdated: '2025'
        },
        {
            title: t('cookies.title'),
            description: 'Cách chúng tôi sử dụng cookie để cải thiện trải nghiệm người dùng',
            href: '/legal/cookies',
            icon: Cookie,
            lastUpdated: '2025'
        }
    ]

    return (
        <PublicLayout>
            <div className="min-h-[70vh] py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <Scale className="h-16 w-16 mx-auto text-indigo-600 dark:text-indigo-400 mb-6" />
                        <h1 className="text-4xl font-bold text-foreground mb-4">
                            {t('title')}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {t('description')}
                        </p>
                    </div>

                    {/* Legal Documents Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                        {legalDocuments.map((doc) => {
                            const IconComponent = doc.icon
                            return (
                                <Card key={doc.href} className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200 dark:hover:border-indigo-700">
                                    <CardHeader>
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                                <IconComponent className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {doc.title}
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground">
                                                    {t('lastUpdated')}
                                                </p>
                                            </div>
                                        </div>
                                        <CardDescription className="text-base">
                                            {doc.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href={doc.href}>
                                            <Button className="w-full group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                {t('readDocument')}
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Contact Section */}
                    <div className="text-center bg-gray-50 dark:bg-gray-900/50 rounded-lg p-8">
                        <h3 className="text-xl font-semibold text-foreground mb-3">
                            Có câu hỏi về các điều khoản?
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Nếu bạn có bất kỳ thắc mắc nào về các tài liệu pháp lý,
                            đừng ngại liên hệ với chúng tôi.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/contact">
                                <Button variant="outline" size="lg">
                                    {t('contactSupport')}
                                </Button>
                            </Link>
                            <a href={`mailto:${t('contactEmail')}`}>
                                <Button variant="outline" size="lg">
                                    {t('sendEmail')}: {t('contactEmail')}
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
} 