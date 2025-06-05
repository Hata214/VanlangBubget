'use client';

import { useTranslations } from 'next-intl';
import PublicLayout from '@/components/layout/PublicLayout'; // Giả sử bạn muốn sử dụng layout chung
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';

interface PricingPlan {
    id: string;
    name: string;
    price: string;
    description: string;
    features: string[];
    isFeatured?: boolean; // Gói nổi bật
}

export default function PricingPage() {
    const t = useTranslations('PricingPage'); // Namespace cho translations

    // Dữ liệu mẫu cho các gói giá - bạn có thể lấy từ API hoặc file JSON
    const pricingPlans: PricingPlan[] = [
        {
            id: 'basic',
            name: t('planBasic.name'),
            price: t('planBasic.price'),
            description: t('planBasic.description'),
            features: [
                t('planBasic.feature1'),
                t('planBasic.feature2'),
                t('planBasic.feature3'),
            ],
        },
        {
            id: 'premium',
            name: t('planPremium.name'),
            price: t('planPremium.price'),
            description: t('planPremium.description'),
            features: [
                t('planPremium.feature1'),
                t('planPremium.feature2'),
                t('planPremium.feature3'),
                t('planPremium.feature4'),
            ],
            isFeatured: true,
        },
        // Thêm các gói giá khác nếu cần
    ];

    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6 text-center">{t('title')}</h1>
                <p className="text-lg text-muted-foreground mb-10 text-center max-w-2xl mx-auto">
                    {t('description')}
                </p>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {pricingPlans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-card p-8 rounded-lg shadow-lg border ${plan.isFeatured ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
                        >
                            <h2 className="text-2xl font-semibold text-primary mb-2">{plan.name}</h2>
                            <p className="text-3xl font-bold text-foreground mb-1">{plan.price}</p>
                            <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center">
                                        <Check className={`h-5 w-5 mr-2 ${plan.isFeatured ? 'text-primary' : 'text-green-500'}`} />
                                        <span className="text-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button
                                className={`w-full ${plan.isFeatured ? '' : 'bg-primary/10 text-primary hover:bg-primary/20 dark:text-primary-foreground'}`}
                                variant={plan.isFeatured ? 'default' : 'outline'}
                            >
                                {t('choosePlanButton')}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}
