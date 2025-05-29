'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { fetchLoans, checkLoanStatus } from '@/redux/features/loanSlice'
import { RefreshCw, CheckCircle, AlertTriangle, Clock, X } from 'lucide-react'

interface StatusChange {
    loanId: string;
    oldStatus: string;
    newStatus: string;
    description: string;
    amount: number;
    dueDate: string;
}

interface LoanStatusIndicatorProps {
    className?: string;
}

export function LoanStatusIndicator({ className = '' }: LoanStatusIndicatorProps) {
    const t = useTranslations();
    const dispatch = useAppDispatch();
    const { statusCheck } = useAppSelector((state) => state.loan);
    const [showResults, setShowResults] = useState(false);
    const [showComponent, setShowComponent] = useState(false); // Ẩn component mặc định

    // Tự động kiểm tra khi component mount và setup timer 12 tiếng
    useEffect(() => {
        checkStatusAutomatically();

        // Setup timer để hiển thị lại component sau 12 tiếng (43200000 ms)
        const twelveHourTimer = setInterval(() => {
            setShowComponent(true);
            checkStatusAutomatically();

            // Tự động ẩn lại sau 30 giây
            setTimeout(() => {
                setShowComponent(false);
            }, 30000);
        }, 43200000); // 12 tiếng = 12 * 60 * 60 * 1000 ms

        // Cleanup timer khi component unmount
        return () => clearInterval(twelveHourTimer);
    }, []);

    // Hiển thị kết quả khi có cập nhật từ Redux
    useEffect(() => {
        if (statusCheck.result && statusCheck.result.updated > 0) {
            setShowResults(true);
            setShowComponent(true); // Hiển thị component khi có kết quả
            // Tự động ẩn kết quả sau 10 giây
            const timer = setTimeout(() => {
                setShowResults(false);
                setShowComponent(false); // Ẩn cả component
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [statusCheck.result]);

    const checkStatusAutomatically = async () => {
        try {
            await dispatch(checkLoanStatus()).unwrap();
        } catch (error) {
            console.error('Auto status check failed:', error);
        }
    };

    const handleManualCheck = async () => {
        try {
            const result = await dispatch(checkLoanStatus()).unwrap();
            setShowResults(true);
            setShowComponent(true); // Hiển thị component khi check thủ công

            // Refresh loan list if there were updates
            if (result.updated > 0) {
                dispatch(fetchLoans());
            }

            // Auto hide results after 10 seconds
            setTimeout(() => {
                setShowResults(false);
                setShowComponent(false); // Ẩn component sau khi hiển thị kết quả
            }, 10000);
        } catch (error) {
            console.error('Manual status check failed:', error);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PAID':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'OVERDUE':
                return <AlertTriangle className="h-4 w-4 text-red-600" />;
            case 'ACTIVE':
                return <Clock className="h-4 w-4 text-blue-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PAID':
                return t('loan.paid');
            case 'OVERDUE':
                return t('loan.overdue');
            case 'ACTIVE':
                return t('loan.active');
            default:
                return status;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Ẩn hoàn toàn component khi showComponent là false
    if (!showComponent) {
        return null;
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Status Check Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Button
                        onClick={handleManualCheck}
                        disabled={statusCheck.isChecking}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${statusCheck.isChecking ? 'animate-spin' : ''}`} />
                        <span>
                            {statusCheck.isChecking ? t('loan.statusCheck.checking') : t('loan.statusCheck.checkStatus')}
                        </span>
                    </Button>

                    {statusCheck.lastCheck && (
                        <span className="text-sm text-gray-500">
                            {t('loan.statusCheck.lastCheck')}: {new Date(statusCheck.lastCheck).toLocaleTimeString('vi-VN')}
                        </span>
                    )}
                </div>

                {/* Close Button */}
                <Button
                    onClick={() => setShowComponent(false)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Status Changes Results */}
            {showResults && statusCheck.result && (
                <div className="space-y-2">
                    {statusCheck.result.statusChanges.length > 0 ? (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-medium">
                                        {t('loan.statusCheck.statusUpdated', { count: statusCheck.result.statusChanges.length })}:
                                    </p>
                                    <div className="space-y-2">
                                        {statusCheck.result.statusChanges.map((change, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">
                                                        {change.description}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {formatCurrency(change.amount)} - Đáo hạn: {formatDate(change.dueDate)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex items-center space-x-1">
                                                        {getStatusIcon(change.oldStatus)}
                                                        <span className="text-xs">
                                                            {getStatusText(change.oldStatus)}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-400">→</span>
                                                    <div className="flex items-center space-x-1">
                                                        {getStatusIcon(change.newStatus)}
                                                        <span className="text-xs">
                                                            {getStatusText(change.newStatus)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                {t('loan.statusCheck.noUpdatesNeeded')}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </div>
    );
}
