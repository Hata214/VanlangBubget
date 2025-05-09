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
import { Bitcoin, Coins, TrendingUp, ExternalLink } from 'lucide-react';
import { StockInvestForm } from './stocks/StockInvestForm';
import AddGoldInvestment from './gold/AddGoldInvestment';
import AddCryptoInvestment from './crypto/AddCryptoInvestment';
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
                            Xem thị trường chứng khoán
                            <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                    </Link>
                );
            case 'gold':
                return null;
            case 'crypto':
                return (
                    <Link href="/investments/crypto" passHref>
                        <Button variant="outline" size="sm" className="flex items-center text-purple-600 border-purple-200 hover:bg-purple-50">
                            <Bitcoin className="h-4 w-4 mr-2" />
                            Xem giá tiền điện tử
                            <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                    </Link>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{t('addInvestment')}</CardTitle>
                        <CardDescription>{t('addInvestmentDescription')}</CardDescription>
                    </div>
                    <div>
                        {renderMarketButton()}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="stock" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="stock" className="flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                            Cổ phiếu
                        </TabsTrigger>
                        <TabsTrigger value="gold" className="flex items-center">
                            <Coins className="h-4 w-4 mr-2 text-yellow-500" />
                            Vàng
                        </TabsTrigger>
                        <TabsTrigger value="crypto" className="flex items-center">
                            <Bitcoin className="h-4 w-4 mr-2 text-purple-500" />
                            Tiền điện tử
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="stock">
                        <StockInvestForm onSuccess={onSuccess} />
                    </TabsContent>

                    <TabsContent value="gold">
                        <AddGoldInvestment onSuccess={onSuccess} />
                    </TabsContent>

                    <TabsContent value="crypto">
                        <AddCryptoInvestment onSuccess={onSuccess} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
} 