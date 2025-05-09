'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import AddGoldInvestment from '@/components/investments/gold/AddGoldInvestment';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { useRouter } from 'next/navigation';

export default function AddGoldPage() {
    const t = useTranslations('Investments');
    const goldT = useTranslations('Investments.gold');
    const router = useRouter();
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSuccess = () => {
        setIsSuccess(true);
        // Sau 2 giây, chuyển hướng về trang danh sách đầu tư
        setTimeout(() => {
            router.push('/investments');
        }, 2000);
    };

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/investments/gold">
                            <Button variant="ghost" size="sm" className="mr-2">
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                {t('back')}
                            </Button>
                        </Link>

                        <h1 className="text-2xl font-bold">{goldT('addNewGold')}</h1>
                    </div>
                </div>

                {isSuccess ? (
                    <Alert variant="success" className="mb-6">
                        <AlertTitle>Thành công</AlertTitle>
                        <AlertDescription>
                            Khoản đầu tư vàng đã được thêm thành công. Đang chuyển hướng...
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert variant="info" className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Lưu ý</AlertTitle>
                        <AlertDescription>
                            Vui lòng nhập đầy đủ thông tin về khoản đầu tư vàng của bạn. Những thông tin này sẽ được lưu trữ để bạn có thể theo dõi giá trị đầu tư của mình.
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin khoản đầu tư vàng</CardTitle>
                        <CardDescription>
                            Điền thông tin chi tiết về khoản đầu tư vàng của bạn
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddGoldInvestment onSuccess={handleSuccess} />
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
} 