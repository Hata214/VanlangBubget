'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import {
    BarChart3,
    BarChart4,
    Check,
    CheckCircle,
    ChevronRight,
    Clock,
    Code,
    CreditCard,
    Fingerprint,
    LayoutDashboard,
    LineChart,
    Lock,
    PiggyBank,
    Shield,
    Smartphone,
    Star,
    TrendingUp,
    Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import PublicLayout from '@/components/layout/PublicLayout'

export default function HomePage() {
    const t = useTranslations()
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

    const features = [
        {
            icon: <BarChart3 className="h-8 w-8 text-primary" />,
            title: t('home.features.expenseTracking.title'),
            description: t('home.features.expenseTracking.description')
        },
        {
            icon: <PiggyBank className="h-8 w-8 text-primary" />,
            title: t('home.features.budgetManagement.title'),
            description: t('home.features.budgetManagement.description')
        },
        {
            icon: <LineChart className="h-8 w-8 text-primary" />,
            title: t('home.features.financialAnalysis.title'),
            description: t('home.features.financialAnalysis.description')
        },
        {
            icon: <Clock className="h-8 w-8 text-primary" />,
            title: t('home.features.futurePlanning.title'),
            description: t('home.features.futurePlanning.description')
        },
        {
            icon: <CreditCard className="h-8 w-8 text-primary" />,
            title: t('home.features.loanManagement.title'),
            description: t('home.features.loanManagement.description')
        },
        {
            icon: <Shield className="h-8 w-8 text-primary" />,
            title: t('home.features.dataSecurity.title'),
            description: t('home.features.dataSecurity.description')
        }
    ];

    const testimonials = [
        {
            content: "",
            author: "",
            role: ""
        },
        {
            content: "",
            author: "",
            role: ""
        },
        {
            content: "",
            author: "",
            role: ""
        }
    ];

    const faqs: { question: string; answer: string }[] = t.raw('home.faq.questions') as { question: string; answer: string }[];

    interface PricingPlan {
        name: string;
        price: string;
        description: string;
        features: string[];
    }

    const pricingPlans: PricingPlan[] = [
        {
            name: t('home.pricing.basic.title'),
            price: t('home.pricing.basic.price'),
            description: t('home.pricing.basic.description'),
            features: t.raw('home.pricing.basic.features') as string[]
        },
        {
            name: t('home.pricing.premium.title'),
            price: t('home.pricing.premium.price'),
            description: t('home.pricing.premium.description'),
            features: t.raw('home.pricing.premium.features') as string[]
        }
    ];

    return (
        <PublicLayout>
            <div className="relative isolate bg-background">
                {/* Hero Section */}
                <section className="relative">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-8">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
                                    {t('home.hero.title')}
                                </h1>
                                <p className="text-lg text-muted-foreground">
                                    {t('home.hero.description')}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link
                                        href={isAuthenticated ? "/dashboard" : "/register"}
                                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                    >
                                        {t('home.hero.getStarted')}
                                        <ChevronRight className="ml-2 -mr-1 h-4 w-4" />
                                    </Link>
                                    <Link
                                        href="/contact"
                                        className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-md shadow-sm text-base font-medium text-primary dark:text-white bg-background dark:bg-slate-800 hover:bg-muted dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                    >
                                        {t('home.cta.contact')}
                                    </Link>
                                </div>
                            </div>
                            <div className="relative hidden md:block">
                                <div className="absolute -top-4 -left-4 w-72 h-72 bg-primary/10 dark:bg-primary/20 rounded-full mix-blend-multiply dark:mix-blend-lighten opacity-50 animate-blob"></div>
                                <div className="absolute -bottom-8 right-4 w-72 h-72 bg-pink-100 dark:bg-pink-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten opacity-50 animate-blob animation-delay-2000"></div>
                                <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-purple-100 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-lighten opacity-50 animate-blob animation-delay-4000"></div>
                                <div className="relative animate-float">
                                    <Image
                                        src="/images/VLB-Photoroom.png"
                                        alt="VangLang Budget Logo"
                                        width={400}
                                        height={400}
                                        className="object-contain drop-shadow-lg dark:drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="bg-primary">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <p className="text-4xl md:text-5xl font-bold text-primary-foreground">--</p>
                                <p className="mt-2 text-lg text-primary-foreground/80">{t('home.stats.monthlyUsers')}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-4xl md:text-5xl font-bold text-primary-foreground">--</p>
                                <p className="mt-2 text-lg text-primary-foreground/80">{t('home.stats.transactionsManaged')}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-4xl md:text-5xl font-bold text-primary-foreground">--</p>
                                <p className="mt-2 text-lg text-primary-foreground/80">{t('home.stats.savingsIncrease')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-16 md:py-24 bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                                {t('home.features.title')}
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                {t('home.features.subtitle')}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <div key={index} className="p-6 bg-card rounded-lg shadow-md border border-border hover:shadow-lg transition-shadow duration-300">
                                    <div className="mb-4">{feature.icon}</div>
                                    <h3 className="text-xl font-semibold text-primary mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* App Screenshots Section */}
                <section className="bg-muted/50 py-16 md:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                                {t('home.screenshots.title')}
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                {t('home.screenshots.subtitle')}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-card p-2 rounded-xl shadow-md overflow-hidden border border-border">
                                <div className="aspect-video rounded-lg bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
                                    <BarChart4 className="h-16 w-16 text-indigo-500" />
                                    <span className="ml-2 text-lg font-medium text-indigo-700 dark:text-indigo-300">{t('home.screenshots.financialOverview')}</span>
                                </div>
                            </div>
                            <div className="bg-card p-2 rounded-xl shadow-md overflow-hidden border border-border">
                                <div className="aspect-video rounded-lg bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                                    <TrendingUp className="h-16 w-16 text-green-500" />
                                    <span className="ml-2 text-lg font-medium text-green-700 dark:text-green-300">{t('home.screenshots.incomeAnalysis')}</span>
                                </div>
                            </div>
                            <div className="bg-card p-2 rounded-xl shadow-md overflow-hidden border border-border">
                                <div className="aspect-video rounded-lg bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                                    <CreditCard className="h-16 w-16 text-red-500" />
                                    <span className="ml-2 text-lg font-medium text-red-700 dark:text-red-300">{t('home.screenshots.expenseManagement')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-16 md:py-24 bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                                {t('home.testimonials.title')}
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">

                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {testimonials.map((testimonial, index) => (
                                <div key={index} className="bg-card p-8 rounded-lg shadow-md border border-border">
                                    <div className="flex mb-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} className="h-5 w-5 text-amber-400 fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-foreground mb-6">{testimonial.content ? `"${testimonial.content}"` : ""}</p>
                                    <div>
                                        <p className="font-semibold text-primary">{testimonial.author}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="bg-muted/50 py-16 md:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                                {t('home.pricing.title')}
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                {t('home.pricing.subtitle')}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {pricingPlans.map((plan, index) => (
                                <div key={index} className={`bg-card rounded-lg shadow-md overflow-hidden border ${index === 1 ? 'border-primary' : 'border-border'}`}>
                                    <div className={`p-6 ${index === 1 ? 'bg-primary' : 'bg-muted dark:bg-muted/60'}`}>
                                        <h3 className={`text-xl font-bold ${index === 1 ? 'text-primary-foreground' : 'text-foreground'}`}>{plan.name}</h3>
                                        <p className={`mt-2 ${index === 1 ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>{plan.description}</p>
                                        <p className={`mt-4 text-3xl font-bold ${index === 1 ? 'text-primary-foreground' : 'text-foreground'}`}>{plan.price}</p>
                                    </div>
                                    <div className="p-6">
                                        <ul className="space-y-4">
                                            {plan.features.map((feature, featureIndex) => (
                                                <li key={featureIndex} className="flex items-start">
                                                    <Check className={`h-5 w-5 mr-2 ${index === 1 ? 'text-primary' : 'text-green-500 dark:text-green-400'}`} />
                                                    <span className="text-foreground">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-8">
                                            <Link
                                                href={index === 0 ? (isAuthenticated ? "/dashboard" : "/register") : "#"}
                                                className={`block w-full py-3 px-4 rounded-md text-center font-medium ${index === 1
                                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                    : 'bg-primary/10 text-primary dark:text-primary-foreground hover:bg-primary/20'
                                                    }`}
                                            >
                                                {index === 0 ? t('home.pricing.basic.action') : t('home.pricing.premium.action')}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-16 md:py-24 bg-background">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                                {t('home.faq.title')}
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                {t('home.faq.subtitle')}
                            </p>
                        </div>
                        <div className="space-y-8">
                            {faqs.map((faq, index) => (
                                <div key={index} className="bg-card shadow-md rounded-lg p-6 border border-border">
                                    <h3 className="text-lg font-semibold text-foreground mb-2">{faq.question}</h3>
                                    <p className="text-muted-foreground">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 md:py-24 bg-card">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
                            {t('home.cta.title')}
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                                <button className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                    {t('home.cta.getStarted')} <ChevronRight className="ml-2 h-4 w-4" />
                                </button>
                            </Link>
                            <Link href="/contact">
                                <button className="inline-flex items-center px-6 py-3 border border-border rounded-md shadow-sm text-base font-medium text-primary dark:text-white bg-background dark:bg-slate-800 hover:bg-muted dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                    {t('home.cta.contact')} <ChevronRight className="ml-2 h-4 w-4" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            {/* Add some custom CSS styles for animations */}
            <style jsx global>{`
                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @keyframes float {
                    0% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    50% {
                        transform: translateY(-10px) rotate(1deg);
                    }
                    100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                @media (prefers-reduced-motion) {
                    .animate-blob, .animate-float {
                        animation: none;
                    }
                }
            `}</style>
        </PublicLayout>
    )
} 