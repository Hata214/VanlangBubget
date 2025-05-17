'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import AddSavingsInvestment from '@/components/investments/savings/AddSavingsInvestment';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { useRouter } from 'next/navigation';

export default function AddSavingsPage() {
    const t = useTranslations('Investments');
    const router = useRouter();
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSuccess = () => {
        setIsSuccess(true);
        // Chuyển hướng về trang danh sách đầu tư sau khi thêm thành công
        setTimeout(() => {
            router.push('/investments');
        }, 1500);
    };

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/investments">
                            <Button variant="ghost" size="sm" className="mr-2">
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                {t('back')}
                            </Button>
                        </Link>

                        <h1 className="text-2xl font-bold">Thêm khoản tiết kiệm ngân hàng</h1>
                    </div>
                </div>

                {isSuccess && (
                    <Alert variant="success" className="mb-6">
                        <AlertTitle>Thêm khoản tiết kiệm thành công</AlertTitle>
                        <AlertDescription>
                            Khoản tiết kiệm đã được thêm vào danh sách đầu tư của bạn. Đang chuyển hướng...
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin khoản tiết kiệm ngân hàng</CardTitle>
                        <CardDescription>
                            Điền thông tin chi tiết về khoản tiết kiệm của bạn
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddSavingsInvestment onSuccess={handleSuccess} />
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
