'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, PlusCircle, Inbox, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";

export default function GoldPage() {
    const t = useTranslations('Investments');
    const goldT = useTranslations('Investments.gold');

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

                        <h1 className="text-2xl font-bold">{goldT('title')}</h1>
                    </div>
                </div>

                <Alert variant="warning" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Thông báo quan trọng</AlertTitle>
                    <AlertDescription>
                        Tính năng xem giá vàng trực tiếp hiện đã bị vô hiệu hóa. Vui lòng tự nhập thông tin vàng của bạn thông qua nút "Thêm đầu tư vàng mới" bên dưới.
                    </AlertDescription>
                </Alert>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-xl">{goldT('addNewGold')}</CardTitle>
                        <CardDescription>
                            Thêm khoản đầu tư vàng của bạn để theo dõi trong danh mục đầu tư
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="mb-4 rounded-full bg-amber-100 p-3">
                                <Inbox className="h-10 w-10 text-amber-600" />
                            </div>
                            <h3 className="mb-2 text-lg font-medium">Chưa có khoản đầu tư vàng nào</h3>
                            <p className="mb-4 text-sm text-muted-foreground max-w-md">
                                Thêm khoản đầu tư vàng của bạn để quản lý và theo dõi giá trị đầu tư trong danh mục của bạn.
                            </p>
                            <Link href="/investments/gold/add" passHref>
                                <Button className="bg-amber-500 hover:bg-amber-600">
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    {goldT('addNewGold')}
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-medium text-amber-800 mb-3">Hướng dẫn đầu tư vàng</h2>
                    <ul className="space-y-2 list-disc pl-5 text-amber-700">
                        <li>Thêm chi tiết về các khoản đầu tư vàng bạn đã mua</li>
                        <li>Theo dõi giá trị đầu tư vàng của bạn theo thời gian</li>
                        <li>Xem tổng quan về danh mục đầu tư vàng trong phần "Danh mục đầu tư"</li>
                        <li>Cập nhật giá vàng hiện tại theo thông tin bạn có để theo dõi lợi nhuận/lỗ</li>
                    </ul>
                </div>
            </div>
        </MainLayout>
    );
} 