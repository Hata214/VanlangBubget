'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/components/ToastProvider';
import { Button } from '@/components/ui/Button';
import InvestmentList from '@/components/investments/common/InvestmentList';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, TrendingUp, Bitcoin, Coins, Plus } from 'lucide-react';
import { getInvestments, getInvestmentSummary } from '@/services/investmentService';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import InvestmentFormsContainer from '@/components/investments/InvestmentFormsContainer';
import { Badge } from '@/components/ui/Badge';
import axios from 'axios';
import { API_URL, getToken, getAuthHeader, TOKEN_COOKIE_NAME } from '@/services/api';
import InvestmentSummaryCard from '@/components/investments/common/InvestmentSummaryCard';
import InvestmentFilter from '@/components/investments/common/InvestmentFilter';

// Định nghĩa kiểu dữ liệu cho response API
interface InvestmentData {
    success: boolean;
    message: any[];
    data: string;
    status: string;
    error?: string;
}

export default function InvestmentsPage() {
    const t = useTranslations('Investments');
    const router = useRouter();
    const { toast } = useToast();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [investments, setInvestments] = useState<Array<any>>([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [error, setError] = useState<Error | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showDebug, setShowDebug] = useState(false); // Debug mode - tắt mặc định
    const [authChecked, setAuthChecked] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    // Dùng phương thức an toàn để lấy dữ liệu, tránh vòng lặp vô hạn
    const fetchInvestmentsData = async () => {
        try {
            console.log('Calling investment API...');

            // Lấy token từ nhiều nguồn khác nhau để đảm bảo
            const apiToken = getToken();
            const tokenFromStorage = localStorage.getItem(TOKEN_COOKIE_NAME);
            const tokenFromCookie = typeof document !== 'undefined' ?
                document.cookie.split(';').find(c => c.trim().startsWith(`${TOKEN_COOKIE_NAME}=`)) : null;

            console.log('Token available:',
                apiToken ? 'API token found' : 'No API token',
                tokenFromStorage ? 'Storage token found' : 'No storage token',
                tokenFromCookie ? 'Cookie token found' : 'No cookie token'
            );

            let tokenToUse = apiToken;

            // Parse token nếu là JSON
            if (tokenToUse && typeof tokenToUse === 'string' && tokenToUse.startsWith('{')) {
                try {
                    const parsedToken = JSON.parse(tokenToUse);
                    if (parsedToken.accessToken) {
                        tokenToUse = parsedToken.accessToken;
                    }
                } catch (e) {
                    console.error('Lỗi khi parse token:', e);
                }
            }

            const authHeader = tokenToUse ? `Bearer ${tokenToUse}` : '';
            console.log('Using auth header:', authHeader ? 'Auth header set' : 'No auth header');

            // Sử dụng axios trực tiếp thay vì qua api service để tránh vòng lặp
            const response = await axios.get(`${API_URL}/api/investments`, {
                params: { page: 1, limit: 100 },
                withCredentials: true, // Gửi cookies với request
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                }
            });

            console.log('API Investment response:', response.data);

            // Xử lý nhiều định dạng dữ liệu từ API
            if (response.data) {
                if (response.data.status === 'success' && Array.isArray(response.data.message)) {
                    console.log('Format 1: success.message array', response.data.message.length);
                    return response.data.message;
                } else if (response.data.status === 'success' && Array.isArray(response.data.data)) {
                    console.log('Format 2: success.data array', response.data.data.length);
                    return response.data.data;
                } else if (Array.isArray(response.data.message)) {
                    console.log('Format 3: message array', response.data.message.length);
                    return response.data.message;
                } else if (Array.isArray(response.data.data)) {
                    console.log('Format 4: data array', response.data.data.length);
                    return response.data.data;
                } else if (Array.isArray(response.data)) {
                    console.log('Format 5: direct array', response.data.length);
                    return response.data;
                }
            }

            // Nếu không khớp với định dạng nào, in log chi tiết và trả về mảng rỗng
            console.warn("Dữ liệu không có định dạng mong đợi:", response.data);
            return [];
        } catch (error) {
            console.error("Lỗi khi gọi API investments:", error);
            if (axios.isAxiosError(error)) {
                console.error("Chi tiết lỗi:", error.response?.data);
                console.error("Status code:", error.response?.status);
                console.error("Headers:", error.response?.headers);
            }
            return [];
        }
    };

    useEffect(() => {
        // Chỉ kiểm tra xác thực sau khi AuthContext đã hoàn thành việc tải
        if (!authLoading) {
            setAuthChecked(true);

            // Không check xác thực để tránh redirect loop
            const fetchData = async () => {
                setLoading(true);
                setError(null);
                try {
                    // Sử dụng phương thức an toàn
                    const investmentData = await fetchInvestmentsData();

                    if (Array.isArray(investmentData)) {
                        setInvestments(investmentData);
                    } else {
                        console.warn('Format dữ liệu không phải là mảng:', investmentData);
                        setInvestments([]);
                    }
                } catch (err) {
                    console.error('Error fetching investment data:', err);
                    setError(err instanceof Error ? err : new Error('Unknown error'));
                    // Thông báo lỗi nhưng vẫn tiếp tục với UI
                    toast({
                        type: 'error',
                        title: t('errorLoadingTitle'),
                        description: t('errorLoadingDescription')
                    });
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [authLoading, toast, t, refreshTrigger]);

    const handleRefreshData = (switchToAddTab = false) => {
        setRefreshTrigger(prev => prev + 1);
        if (switchToAddTab) {
            setShowAddForm(true);
        }
    };

    const handleAddSuccess = () => {
        setShowAddForm(false);
        setRefreshTrigger(prev => prev + 1);
        toast({
            type: 'success',
            title: t('addSuccess'),
            description: t('addSuccessDescription')
        });
    };

    // Debug component để hiển thị raw data
    const DebugInvestments = ({ data }: { data: any[] }) => {
        if (!showDebug) return null;

        return (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <div className="flex justify-between mb-2">
                    <h3 className="font-bold">{t('debug.title')} ({data.length} {t('debug.items')})</h3>
                    <Button size="sm" onClick={() => setShowDebug(false)}>{t('debug.close')}</Button>
                </div>
                {data.length === 0 ? (
                    <p className="text-red-500">{t('debug.noData')}</p>
                ) : (
                    <pre className="text-xs overflow-auto max-h-40 bg-gray-900 text-white p-2 rounded">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                )}
            </div>
        );
    };

    // Hàm lọc các khoản đầu tư theo loại
    const getFilteredInvestments = () => {
        if (!activeFilter) return investments;
        return investments.filter(investment =>
            (investment.type || '').toLowerCase() === activeFilter.toLowerCase()
        );
    };

    const filteredInvestments = getFilteredInvestments();

    const content = (
        <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('description')}</p>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t('yourInvestments')}</h2>
                <div className="flex gap-2">
                    <Button onClick={() => setShowAddForm(!showAddForm)}>
                        <Plus className="h-4 w-4 mr-1" />
                        {showAddForm ? t('closeForm') : t('addInvestment')}
                    </Button>
                    <Button variant="outline" onClick={() => setShowDebug(!showDebug)}>
                        {showDebug ? t('toggleDebugClose') : t('toggleDebugOpen')}
                    </Button>
                </div>
            </div>

            {showAddForm && (
                <div className="mb-6">
                    <InvestmentFormsContainer onSuccess={handleAddSuccess} />
                </div>
            )}

            {/* Thêm component tổng quan danh mục đầu tư */}
            {!loading && investments.length > 0 && (
                <InvestmentSummaryCard investments={investments} />
            )}

            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium text-amber-800 mb-3">{t('goldInvestmentGuide.title')}</h2>
                <ul className="space-y-2 list-disc pl-5 text-amber-700">
                    <li>{t('goldInvestmentGuide.bullet1')}</li>
                    <li>{t('goldInvestmentGuide.bullet2')}</li>
                    <li>{t('goldInvestmentGuide.bullet3')}</li>
                    <li>{t('goldInvestmentGuide.bullet4')}</li>
                </ul>
            </div>

            {loading && authChecked && (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">{t('common.loading', { ns: 'common' })}</span>
                </div>
            )}

            {!loading && !investments.length && authChecked && (
                <Card className="text-center py-8">
                    <CardHeader>
                        <CardTitle>{t('noInvestments')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">{t('investmentListDescription')}</p> {/* Hoặc một mô tả phù hợp hơn khi chưa có gì */}
                        <Button onClick={() => setShowAddForm(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            {t('addYourFirst')}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Investment List and Filters Section */}
            {authChecked && !loading && investments.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{t('investmentsList')}</CardTitle>
                            {/* <InvestmentFilter setActiveFilter={setActiveFilter} /> */}
                        </div>
                        <CardDescription>{t('investmentListDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InvestmentFilter
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                        />
                        <InvestmentList
                            investments={filteredInvestments}
                            onRefresh={handleRefreshData}
                        />
                    </CardContent>
                </Card>
            )}

            <DebugInvestments data={investments} />

        </div>
    );

    return <MainLayout>{content}</MainLayout>;
} 