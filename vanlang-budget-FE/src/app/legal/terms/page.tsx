import { Metadata } from 'next'
import Link from 'next/link'
import { termsMetadata } from '../metadata'

export const metadata: Metadata = termsMetadata
import PublicLayout from '@/components/layout/PublicLayout'
import { FileText, ArrowLeft, Calendar, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { useTranslations } from 'next-intl'

export default function TermsPage() {
    const t = useTranslations('legal')

    const sections = [
        {
            id: 'introduction',
            title: t('terms.sections.introduction.title'),
            content: t('terms.sections.introduction.content')
        },
        {
            id: 'account',
            title: t('terms.sections.account.title'),
            content: t.raw('terms.sections.account.items') as string[]
        },
        {
            id: 'responsibility',
            title: t('terms.sections.responsibility.title'),
            content: t.raw('terms.sections.responsibility.items') as string[]
        },
        {
            id: 'intellectualProperty',
            title: t('terms.sections.intellectualProperty.title'),
            content: t.raw('terms.sections.intellectualProperty.items') as string[]
        },
        {
            id: 'liability',
            title: t('terms.sections.liability.title'),
            content: t.raw('terms.sections.liability.items') as string[]
        },
        {
            id: 'termination',
            title: t('terms.sections.termination.title'),
            content: t.raw('terms.sections.termination.items') as string[]
        },
        {
            id: 'changes',
            title: t('terms.sections.changes.title'),
            content: t('terms.sections.changes.content')
        }
    ]

    return (
        <PublicLayout>
            <div className="min-h-screen py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/legal" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t('backToLegal')}
                        </Link>

                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">
                                    {t('terms.title')}
                                </h1>
                                <p className="text-muted-foreground">{t('terms.subtitle')}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {t('lastUpdated')}
                            </div>
                            <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-1" />
                                {t('contactEmail')}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="text-xl text-indigo-600 dark:text-indigo-400">
                                {t('terms.title')} – {t('terms.subtitle')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            {sections.map((section, index) => (
                                <div key={section.id} className="mb-8">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">
                                        {section.title}
                                    </h3>

                                    {Array.isArray(section.content) ? (
                                        <ul className="space-y-2 text-muted-foreground">
                                            {section.content.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-start">
                                                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-muted-foreground leading-relaxed">
                                            {section.content}
                                        </p>
                                    )}

                                    {index < sections.length - 1 && <Separator className="mt-6" />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Contact Section */}
                    <Card className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800">
                        <CardContent className="p-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                                    {t('questionsAboutTerms')}
                                </h3>
                                <p className="text-indigo-700 dark:text-indigo-300 mb-4">
                                    {t('questionsAboutTermsDesc')}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Link href="/contact">
                                        <Button variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-900/50">
                                            {t('contactPage')}
                                        </Button>
                                    </Link>
                                    <a href={`mailto:${t('contactEmail')}`}>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                            <Mail className="w-4 h-4 mr-2" />
                                            {t('sendEmail')}
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-8 pt-8 border-t border-border">
                        <Link href="/legal">
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t('title')}
                            </Button>
                        </Link>
                        <Link href="/legal/privacy">
                            <Button>
                                {t('privacy.title')}
                                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
} 