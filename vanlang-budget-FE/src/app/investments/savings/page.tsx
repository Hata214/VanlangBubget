'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, PlusCircle, Inbox, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";

export default function SavingsPage() {
    const t = useTranslations('Investments');

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

                        <h1 className="text-2xl font-bold">Tiết kiệm ngân hàng</h1>
                    </div>
                </div>

                <Alert variant="warning" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Thông báo quan trọng</AlertTitle>
                    <AlertDescription>
                        Tính năng xem lãi suất ngân hàng trực tiếp hiện đang được phát triển. Vui lòng tự nhập thông tin khoản tiết kiệm của bạn thông qua nút &quot;Thêm khoản tiết kiệm mới&quot; bên dưới.
                    </AlertDescription>
                </Alert>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-xl">Thêm khoản tiết kiệm mới</CardTitle>
                        <CardDescription>
                            Thêm khoản tiết kiệm ngân hàng của bạn để theo dõi trong danh mục đầu tư
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="mb-4 rounded-full bg-blue-100 p-3">
                                <Inbox className="h-10 w-10 text-blue-600" />
                            </div>
                            <h3 className="mb-2 text-lg font-medium">Chưa có khoản tiết kiệm nào</h3>
                            <p className="mb-4 text-sm text-muted-foreground max-w-md">
                                Thêm khoản tiết kiệm ngân hàng của bạn để quản lý và theo dõi lãi suất trong danh mục đầu tư của bạn.
                            </p>
                            <Link href="/investments/savings/add" passHref>
                                <Button className="bg-blue-500 hover:bg-blue-600">
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Thêm khoản tiết kiệm mới
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-medium text-blue-800 mb-3">Hướng dẫn quản lý tiết kiệm</h2>
                    <ul className="space-y-2 list-disc pl-5 text-blue-700">
                        <li>Thêm chi tiết về các khoản tiết kiệm ngân hàng của bạn</li>
                        <li>Theo dõi lãi suất và số tiền lãi dự kiến theo thời gian</li>
                        <li>Nhận thông báo khi khoản tiết kiệm sắp đáo hạn</li>
                        <li>So sánh hiệu quả giữa các khoản tiết kiệm khác nhau</li>
                        <li>Xem tổng quan về danh mục tiết kiệm trong phần &quot;Danh mục đầu tư&quot;</li>
                    </ul>
                </div>
            </div>
        </MainLayout>
    );
}
