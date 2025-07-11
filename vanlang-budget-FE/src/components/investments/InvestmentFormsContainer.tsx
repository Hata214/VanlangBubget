'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Home, Coins, TrendingUp, ExternalLink, PiggyBank } from 'lucide-react';
import { StockInvestForm } from './stocks/StockInvestForm';
import AddGoldInvestment from './gold/AddGoldInvestment';
import AddRealEstateInvestment from './realestate/AddRealEstateInvestment';
import AddSavingsInvestment from './savings/AddSavingsInvestment';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface InvestmentFormsContainerProps {
    onSuccess: () => void;
}

export default function InvestmentFormsContainer({ onSuccess }: InvestmentFormsContainerProps) {
    const t = useTranslations('Investments');
    const [activeTab, setActiveTab] = useState('stock');

    const renderMarketButton = () => {
        switch (activeTab) {
            case 'stock':
                return (
                    <Link href="/investments/stocks" passHref>
                        <Button variant="outline" size="sm" className="flex items-center text-blue-600 border-blue-200 hover:bg-blue-50">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            {t('stocks.stockMarketView')}
                            <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                    </Link>
                );
            case 'gold':
                return null;
            case 'realestate':
                return null;
            case 'savings':
                return null;
            default:
                return null;
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>{t('addInvestment')}</CardTitle>
                        <CardDescription>{t('addInvestmentDescription')}</CardDescription>
                    </div>
                    <div className="mt-2 sm:mt-0">
                        {renderMarketButton()}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="stock" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                        <TabsTrigger value="stock" className="flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                            {t('stocks.title')}
                        </TabsTrigger>
                        <TabsTrigger value="gold" className="flex items-center">
                            <Coins className="h-4 w-4 mr-2 text-yellow-500" />
                            {t('goldType')}
                        </TabsTrigger>
                        <TabsTrigger value="realestate" className="flex items-center">
                            <Home className="h-4 w-4 mr-2 text-green-500" />
                            {t('realestate.title')}
                        </TabsTrigger>
                        <TabsTrigger value="savings" className="flex items-center">
                            <PiggyBank className="h-4 w-4 mr-2 text-blue-400" />
                            {t('savings.title')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="stock">
                        <StockInvestForm onSuccess={onSuccess} />
                    </TabsContent>

                    <TabsContent value="gold">
                        <AddGoldInvestment onSuccess={onSuccess} />
                    </TabsContent>

                    <TabsContent value="realestate">
                        <AddRealEstateInvestment onSuccess={onSuccess} />
                    </TabsContent>

                    <TabsContent value="savings">
                        <AddSavingsInvestment onSuccess={onSuccess} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
