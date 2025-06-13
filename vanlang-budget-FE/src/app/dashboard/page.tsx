'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { Loading } from '@/components/ui/Loading'
import MainLayout from '@/components/layout/MainLayout'
import { BarChart } from '@/components/charts/BarChart'
import { PieChart } from '@/components/charts/PieChart'
import { RecentTransactions } from '@/components/transactions/RecentTransactions'
import { fetchIncomes } from '@/redux/features/incomeSlice'
import { fetchExpenses } from '@/redux/features/expenseSlice'
import { fetchLoans } from '@/redux/features/loanSlice'
import { Button } from '@/components/ui/Button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { authService } from '@/services/authService'
import { Modal } from '@/components/ui/Modal'
import axios from 'axios'
import { getAuthHeader } from '@/redux/features/notificationSlice'
import { getToken } from '@/services/api'
import notificationService from '@/services/notificationService'
import { useRouter } from 'next/navigation'

// Hằng số cho key lưu thời gian thông báo số dư âm
const NEGATIVE_BALANCE_NOTIFICATION_KEY = 'lastNegativeBalanceNotification';

export default function DashboardPage() {
    const t = useTranslations();
    const dispatch = useAppDispatch()
    const { incomes, totalIncome, isLoading: incomeLoading } = useAppSelector((state) => state.income)
    const { expenses, totalExpense, isLoading: expenseLoading } = useAppSelector((state) => state.expense)
    const { loans, totalLoan, isLoading: loanLoading } = useAppSelector((state) => state.loan)
    const { user } = useAppSelector((state) => state.auth);
    const router = useRouter();

    const isLoading = incomeLoading || expenseLoading || loanLoading

    // Trạng thái cho dialog xóa dữ liệu
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [resetError, setResetError] = useState('');

    // Thêm state để kiểm soát việc gửi thông báo
    const [hasNotifiedNegativeBalance, setHasNotifiedNegativeBalance] = useState(false);
    const [isSendingNotification, setIsSendingNotification] = useState(false);
    const [lastNotificationTime, setLastNotificationTime] = useState<string | null>(null);

    const balance = totalIncome - totalExpense

    useEffect(() => {
        dispatch(fetchIncomes())
        dispatch(fetchExpenses())
        dispatch(fetchLoans())

        // Lấy thời gian gửi thông báo lần cuối
        const savedTime = localStorage.getItem(NEGATIVE_BALANCE_NOTIFICATION_KEY);
        if (savedTime) {
            setLastNotificationTime(new Date(parseInt(savedTime)).toLocaleString('vi-VN'));
        }
    }, [dispatch])

    // Tạo thông báo khi số dư bị âm
    useEffect(() => {
        // Chỉ gửi thông báo khi:
        // 1. Đã tải dữ liệu xong
        // 2. Số dư thực sự âm
        // 3. Người dùng đã đăng nhập và có id
        // 4. Chưa gửi thông báo trong phiên làm việc hiện tại
        if (!isLoading && balance < 0 && user && user._id && !hasNotifiedNegativeBalance) {
            // Gửi thông báo qua API mà không cần kiểm tra thời gian 24 giờ
            const checkNegativeBalance = async () => {
                try {
                    console.log('Gửi thông báo số dư âm qua API');
                    await notificationService.checkNegativeBalance();
                    console.log('Đã gửi thông báo số dư âm thành công');

                    // Lưu thời gian gửi thông báo để hiển thị cho người dùng
                    const now = new Date().getTime();
                    localStorage.setItem(NEGATIVE_BALANCE_NOTIFICATION_KEY, now.toString());
                    setLastNotificationTime(new Date(now).toLocaleString('vi-VN'));
                } catch (error) {
                    console.error('Lỗi khi gửi thông báo số dư âm:', error);
                } finally {
                    // Đánh dấu đã hiện thông báo
                    setHasNotifiedNegativeBalance(true);
                }
            };

            checkNegativeBalance();
        }
    }, [balance, isLoading, user, hasNotifiedNegativeBalance]);

    // Hàm xử lý xóa dữ liệu
    const handleResetData = async () => {
        setIsResetting(true);
        setResetError('');

        try {
            console.log("Bắt đầu xóa dữ liệu với xác nhận:", confirmText);
            const result = await authService.resetUserData(confirmText);

            if (result.success) {
                // Đóng dialog
                setShowResetDialog(false);
                // Reset form
                setConfirmText('');
                // Hiển thị thông báo thành công
                alert('Đã xóa toàn bộ dữ liệu thành công!');

                // Tải lại dữ liệu
                dispatch(fetchIncomes());
                dispatch(fetchExpenses());
                dispatch(fetchLoans());
            } else {
                // Hiển thị lỗi
                setResetError(result.message);
            }
        } catch (error) {
            console.error("Lỗi khi xóa dữ liệu:", error);
            setResetError('Đã xảy ra lỗi khi xóa dữ liệu. Vui lòng thử lại sau.');
        } finally {
            setIsResetting(false);
        }
    };

    // Tính tổng tiền phải trả (gốc + lãi) - chỉ tính khoản vay chưa trả và quá hạn
    const totalLoanWithInterest = useMemo(() => {
        if (!Array.isArray(loans) || loans.length === 0) {
            return 0;
        }

        return loans.reduce((total, loan) => {
            // Chỉ tính những khoản vay có trạng thái ACTIVE hoặc OVERDUE (chưa trả và quá hạn)
            const loanStatus = loan.status?.toUpperCase() || '';
            if (loanStatus !== 'ACTIVE' && loanStatus !== 'OVERDUE') {
                return total;
            }

            // Tính số tiền lãi dựa trên thông tin khoản vay
            const startDate = new Date(loan.startDate);
            const dueDate = new Date(loan.dueDate);
            const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let interestMultiplier = 0;
            switch (loan.interestRateType) {
                case 'DAY':
                    interestMultiplier = diffDays;
                    break;
                case 'WEEK':
                    interestMultiplier = diffDays / 7;
                    break;
                case 'MONTH':
                    interestMultiplier = diffDays / 30;
                    break;
                case 'QUARTER':
                    interestMultiplier = diffDays / 90;
                    break;
                case 'YEAR':
                    interestMultiplier = diffDays / 365;
                    break;
            }

            const interestAmount = Math.round(loan.amount * (loan.interestRate / 100) * interestMultiplier);
            return total + loan.amount + interestAmount;
        }, 0);
    }, [loans]);

    const recentTransactions = useMemo(() => {
        const allTransactions = [
            ...(Array.isArray(incomes) ? incomes.map((income) => ({
                id: income.id,
                type: 'income' as const,
                amount: income.amount,
                description: income.description,
                category: income.category,
                date: income.date,
            })) : []),
            ...(Array.isArray(expenses) ? expenses.map((expense) => ({
                id: expense.id,
                type: 'expense' as const,
                amount: expense.amount,
                description: expense.description,
                category: expense.category,
                date: expense.date,
            })) : []),
            ...(Array.isArray(loans) ? loans.map((loan) => ({
                id: loan.id,
                type: 'loan' as const,
                amount: loan.amount,
                description: loan.description,
                category: loan.lender,
                date: loan.startDate,
            })) : []),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return allTransactions.slice(0, 10)
    }, [incomes, expenses, loans])

    const transactionsByCategory = useMemo(() => {
        const incomeColors = ['#22c55e', '#10b981', '#34d399', '#86efac'];  // Xanh lá - Thu nhập
        const expenseColors = ['#ef4444', '#f87171', '#fca5a5', '#fecaca']; // Đỏ - Chi tiêu
        const loanColors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];    // Tím - Khoản vay

        // Xác định kiểu dữ liệu cho object
        const allCategories: Record<string, number> = {};

        // Thêm dữ liệu thu nhập
        if (Array.isArray(incomes) && incomes.length > 0) {
            incomes.forEach(income => {
                let translatedCategory = income.category;
                if (['SALARY', 'BONUS', 'INVESTMENT', 'BUSINESS', 'SAVINGS', 'OTHER'].includes(income.category)) {
                    const normalizedCategory = income.category.toLowerCase();
                    translatedCategory = t(`income.category.${normalizedCategory}`);
                }
                allCategories[`income_${translatedCategory}`] = (allCategories[`income_${translatedCategory}`] || 0) + income.amount;
            });
        }

        // Thêm dữ liệu chi tiêu
        if (Array.isArray(expenses) && expenses.length > 0) {
            expenses.forEach(expense => {
                let translatedCategory = expense.category;
                if (['FOOD', 'TRANSPORT', 'SHOPPING', 'ENTERTAINMENT', 'BILLS', 'HEALTH', 'EDUCATION', 'OTHER'].includes(expense.category)) {
                    const normalizedCategory = expense.category.toLowerCase();
                    translatedCategory = t(`expense.category.${normalizedCategory}`);
                }
                allCategories[`expense_${translatedCategory}`] = (allCategories[`expense_${translatedCategory}`] || 0) + expense.amount;
            });
        }

        // Thêm dữ liệu khoản vay - chỉ tính khoản vay chưa trả và quá hạn
        if (Array.isArray(loans) && loans.length > 0) {
            loans.forEach(loan => {
                // Chỉ tính những khoản vay có trạng thái ACTIVE hoặc OVERDUE
                const loanStatus = loan.status?.toUpperCase() || '';
                if (loanStatus !== 'ACTIVE' && loanStatus !== 'OVERDUE') {
                    return;
                }

                let translatedLender = loan.lender;
                if (['bank', 'credit', 'individual', 'company', 'other'].includes(loan.lender)) {
                    translatedLender = t(`loan.lenderTypes.${loan.lender}`);
                }
                allCategories[`loan_${translatedLender}`] = (allCategories[`loan_${translatedLender}`] || 0) + loan.amount;
            });
        }

        // Tạo labels và data
        const labels = Object.keys(allCategories).map(key => {
            if (key.startsWith('income_')) {
                return `${t('income.manage')}: ${key.substring(7)}`;
            } else if (key.startsWith('expense_')) {
                return `${t('expense.manage')}: ${key.substring(8)}`;
            } else {
                return `${t('loan.manage')}: ${key.substring(5)}`;
            }
        });
        const data = Object.values(allCategories);

        // Tạo colors dựa trên loại danh mục
        const colors = labels.map(label => {
            if (label.startsWith(t('income.manage'))) {
                return incomeColors[Math.floor(Math.random() * incomeColors.length)];
            } else if (label.startsWith(t('expense.manage'))) {
                return expenseColors[Math.floor(Math.random() * expenseColors.length)];
            } else {
                return loanColors[Math.floor(Math.random() * loanColors.length)];
            }
        });

        return {
            labels: labels,
            datasets: [
                {
                    data: data as number[],
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1,
                },
            ],
        };
    }, [incomes, expenses, loans, t]);

    const monthlyData = useMemo(() => {
        const safeIncomes = Array.isArray(incomes) ? incomes : [];
        const safeExpenses = Array.isArray(expenses) ? expenses : [];

        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            return d.toLocaleString('vi-VN', { month: 'long' })
        }).reverse()

        const monthlyIncomes = months.map((month) => {
            return safeIncomes
                .filter((income) => {
                    const incomeMonth = new Date(income.date).toLocaleString('vi-VN', {
                        month: 'long',
                    })
                    return incomeMonth === month
                })
                .reduce((sum, income) => sum + income.amount, 0)
        })

        const monthlyExpenses = months.map((month) => {
            return safeExpenses
                .filter((expense) => {
                    const expenseMonth = new Date(expense.date).toLocaleString('vi-VN', {
                        month: 'long',
                    })
                    return expenseMonth === month
                })
                .reduce((sum, expense) => sum + expense.amount, 0)
        })

        return {
            labels: months,
            datasets: [
                {
                    label: t('income.manage'),
                    data: monthlyIncomes,
                    backgroundColor: 'rgba(34, 197, 94, 0.5)',
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 1,
                },
                {
                    label: t('expense.manage'),
                    data: monthlyExpenses,
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 1,
                },
            ],
        }
    }, [incomes, expenses])

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-screen">
                    <Loading size="lg" />
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="container pb-12 pt-4">
                {/* Thêm cảnh báo số dư âm */}
                {balance < 0 && (
                    <Alert className="mb-6 bg-purple-50 text-purple-700 border-purple-200 animate-pulse">
                        <AlertCircle className="h-5 w-5 text-purple-500" />
                        <AlertDescription className="flex flex-col gap-2">
                            <div className="font-medium text-lg">Cảnh báo số dư âm!</div>
                            <div>Số dư tài khoản của bạn hiện đang âm: <span className="font-bold text-purple-800">{formatCurrency(balance)} VND</span>. Vui lòng cân đối thu chi.</div>
                            {lastNotificationTime && (
                                <div className="text-xs text-purple-600">
                                    Thông báo đã được gửi lúc: {lastNotificationTime}
                                </div>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        router.push('/expenses');
                                    }}
                                    className="bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200"
                                >
                                    Xem chi tiêu
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        router.push('/incomes');
                                    }}
                                    className="bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200"
                                >
                                    Thêm thu nhập
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">{t('dashboard.financialOverview')}</h1>

                        {/* Nút Reset Data */}
                        <Button
                            variant="destructive"
                            onClick={() => setShowResetDialog(true)}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw size={16} />
                            {t('dashboard.resetAllData', { defaultMessage: 'Xóa tất cả dữ liệu' })}
                        </Button>
                    </div>

                    {/* Dialog xác nhận xóa dữ liệu */}
                    <Modal
                        isOpen={showResetDialog}
                        onClose={() => setShowResetDialog(false)}
                        title={t('dashboard.resetAllDataTitle', { defaultMessage: 'Xóa toàn bộ dữ liệu' })}
                    >
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">
                                {t('dashboard.resetAllDataConfirmation', {
                                    defaultMessage: 'Hành động này sẽ xóa tất cả dữ liệu thu nhập, chi tiêu, khoản vay và không thể khôi phục. Để xác nhận, vui lòng nhập "resetdata" vào ô bên dưới.'
                                })}
                            </p>

                            {resetError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{resetError}</AlertDescription>
                                </Alert>
                            )}

                            <Input
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder={t('dashboard.resetDataConfirmPlaceholder', { defaultMessage: 'Nhập \'resetdata\' để xác nhận' })}
                            />

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                                    {t('common.cancel', { defaultMessage: 'Hủy' })}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleResetData}
                                    disabled={confirmText !== 'resetdata' || isResetting}
                                    isLoading={isResetting}
                                >
                                    {t('dashboard.confirmResetData', { defaultMessage: 'Xác nhận xóa dữ liệu' })}
                                </Button>
                            </div>
                        </div>
                    </Modal>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('dashboard.balance')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p
                                    className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}
                                >
                                    {formatCurrency(balance)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('dashboard.totalIncome')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(totalIncome)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('dashboard.totalExpense')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatCurrency(totalExpense)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('dashboard.totalLoan')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-purple-600">
                                    {formatCurrency(totalLoanWithInterest)}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('dashboard.monthlyIncomeExpense')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px] sm:h-[300px]">
                                    <BarChart data={monthlyData} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('dashboard.financialDistribution')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px] sm:h-[400px] md:h-[450px] relative">
                                    <PieChart data={transactionsByCategory} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RecentTransactions transactions={recentTransactions} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    )
}
