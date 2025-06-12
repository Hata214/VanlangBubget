'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/Card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Calendar,
    User,
    Filter,
    Download,
    RefreshCw,
    Edit,
    Trash2,
    Eye,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Banknote,
    PiggyBank,
    Building,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Zap,
    Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import adminService from '@/services/adminService';

// Payment Transaction Interface - Dành cho giao dịch thanh toán premium
interface PaymentTransaction {
    _id: string;
    transactionId: string;
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    type: 'subscription' | 'upgrade' | 'renewal' | 'refund';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
    planType: 'basic' | 'standard' | 'premium';
    planName: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentGateway: string;
    description: string;
    createdAt: string;
    processedBy?: {
        firstName: string;
        lastName: string;
        email: string;
    };
    processedAt?: string;
    notes?: string;
}

interface PaymentTransactionStats {
    totalTransactions: number;
    totalAmount: number;
    completedTransactions: number;
    completedAmount: number;
    pendingTransactions: number;
    failedTransactions: number;
}

export default function AdminTransactionsPage() {
    const t = useTranslations();
    const router = useRouter();

    // State management
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [stats, setStats] = useState<PaymentTransactionStats>({
        totalTransactions: 0,
        totalAmount: 0,
        completedTransactions: 0,
        completedAmount: 0,
        pendingTransactions: 0,
        failedTransactions: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [planTypeFilter, setPlanTypeFilter] = useState('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);

    // UI state
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    // Load payment transactions data
    const loadTransactions = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(typeFilter !== 'all' && { type: typeFilter }),
                ...(planTypeFilter !== 'all' && { planType: planTypeFilter }),
                ...(paymentMethodFilter !== 'all' && { paymentMethod: paymentMethodFilter }),
                ...(dateFilter !== 'all' && { dateRange: dateFilter })
            });

            const response = await adminService.getPaymentTransactions(params.toString());

            if (response.status === 'success') {
                setTransactions(response.data.transactions || []);
                setTotalPages(response.data.pagination?.totalPages || 1);
            } else {
                throw new Error(response.message || 'Failed to load transactions');
            }
        } catch (error: any) {
            console.error('Error loading payment transactions:', error);
            setError(error.message || 'Không thể tải danh sách giao dịch thanh toán');
            toast.error('Không thể tải danh sách giao dịch thanh toán');
        } finally {
            setLoading(false);
        }
    };

    // Load payment transaction stats
    const loadStats = async () => {
        try {
            const response = await adminService.getPaymentTransactionStats();
            if (response.status === 'success') {
                setStats(response.data.overview);
            }
        } catch (error) {
            console.error('Error loading payment transaction stats:', error);
        }
    };

    // Migrate real payment transactions from existing users
    const migrateRealTransactions = async () => {
        try {
            setLoading(true);
            const response = await adminService.migrateRealPaymentTransactions();
            if (response.status === 'success') {
                toast.success(`Đã migrate ${response.data.transactionsCreated} giao dịch thật từ ${response.data.usersProcessed} users`);
                await loadTransactions();
                await loadStats();
            }
        } catch (error: any) {
            console.error('Error migrating real transactions:', error);
            toast.error(error.message || 'Không thể migrate dữ liệu thật');
        } finally {
            setLoading(false);
        }
    };

    // Create sample transactions (for development) - DEPRECATED
    const createSampleTransactions = async () => {
        try {
            setLoading(true);
            const response = await adminService.createSampleTransactions();
            if (response.status === 'success') {
                toast.success(`Đã tạo ${response.data.count} giao dịch mẫu thành công`);
                await loadTransactions();
                await loadStats();
            } else if (response.status === 'info') {
                toast.info(response.message);
            }
        } catch (error: any) {
            console.error('Error creating sample transactions:', error);
            toast.error(error.message || 'Không thể tạo dữ liệu mẫu');
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount and when filters change
    useEffect(() => {
        loadTransactions();
        loadStats();
    }, [currentPage, searchTerm, statusFilter, typeFilter, planTypeFilter, paymentMethodFilter, dateFilter]);

    // Format currency
    const formatCurrency = (amount: number, currency: string = 'VND') => {
        if (currency === 'VND') {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500" />;
            case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'cancelled': return <XCircle className="w-4 h-4 text-gray-500" />;
            case 'refunded': return <AlertCircle className="w-4 h-4 text-orange-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        const badges = {
            completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
            pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
            processing: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800' },
            failed: { label: 'Thất bại', color: 'bg-red-100 text-red-800' },
            cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' },
            refunded: { label: 'Hoàn tiền', color: 'bg-orange-100 text-orange-800' }
        };

        const badge = badges[status as keyof typeof badges] || badges.pending;

        return (
            <Badge className={`${badge.color} flex items-center gap-1`}>
                {getStatusIcon(status)}
                {badge.label}
            </Badge>
        );
    };

    // Get plan type badge
    const getPlanTypeBadge = (planType: string) => {
        const badges = {
            basic: { label: 'Basic', color: 'bg-gray-100 text-gray-800', icon: User },
            standard: { label: 'Standard', color: 'bg-blue-100 text-blue-800', icon: Zap },
            premium: { label: 'Premium', color: 'bg-purple-100 text-purple-800', icon: CreditCard }
        };

        const badge = badges[planType as keyof typeof badges] || badges.basic;
        const IconComponent = badge.icon;

        return (
            <Badge className={`${badge.color} flex items-center gap-1`}>
                <IconComponent size={12} />
                {badge.label}
            </Badge>
        );
    };

    // Handle export payment transactions
    const handleExportPaymentTransactions = async () => {
        try {
            await adminService.exportPaymentTransactions({
                search: searchTerm || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                type: typeFilter !== 'all' ? typeFilter : undefined,
                planType: planTypeFilter !== 'all' ? planTypeFilter : undefined,
                paymentMethod: paymentMethodFilter !== 'all' ? paymentMethodFilter : undefined
            });
            toast.success('Xuất báo cáo thành công');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Không thể xuất báo cáo');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Giao dịch Thanh toán</h1>
                    <p className="text-muted-foreground">
                        Quản lý tất cả giao dịch thanh toán premium của người dùng trong hệ thống
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                    </Button>
                    <Button onClick={loadTransactions} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Làm mới
                    </Button>
                    <Button onClick={createSampleTransactions} variant="outline" size="sm">
                        <Zap className="h-4 w-4 mr-2" />
                        Tạo dữ liệu mẫu
                    </Button>
                    <Button onClick={handleExportPaymentTransactions} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(stats.completedAmount)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.completedTransactions} giao dịch hoàn thành
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng giao dịch</CardTitle>
                        <Building className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {stats.totalTransactions.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Tổng giá trị: {formatCurrency(stats.totalAmount)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {stats.pendingTransactions.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Cần xem xét
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Thất bại</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {stats.failedTransactions.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Cần kiểm tra
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            {showFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Bộ lọc
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                            {/* Search */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tìm kiếm</label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Tìm theo ID, email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Trạng thái</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                                        <SelectItem value="processing">Đang xử lý</SelectItem>
                                        <SelectItem value="completed">Hoàn thành</SelectItem>
                                        <SelectItem value="failed">Thất bại</SelectItem>
                                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                                        <SelectItem value="refunded">Hoàn tiền</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Transaction Type Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Loại giao dịch</label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn loại" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="subscription">Đăng ký</SelectItem>
                                        <SelectItem value="upgrade">Nâng cấp</SelectItem>
                                        <SelectItem value="renewal">Gia hạn</SelectItem>
                                        <SelectItem value="refund">Hoàn tiền</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Plan Type Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Gói dịch vụ</label>
                                <Select value={planTypeFilter} onValueChange={setPlanTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn gói" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="basic">Basic</SelectItem>
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="premium">Premium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Payment Method Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phương thức</label>
                                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn phương thức" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="credit_card">Thẻ tín dụng</SelectItem>
                                        <SelectItem value="debit_card">Thẻ ghi nợ</SelectItem>
                                        <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                                        <SelectItem value="e_wallet">Ví điện tử</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Thời gian</label>
                                <Select value={dateFilter} onValueChange={setDateFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn thời gian" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="today">Hôm nay</SelectItem>
                                        <SelectItem value="week">Tuần này</SelectItem>
                                        <SelectItem value="month">Tháng này</SelectItem>
                                        <SelectItem value="quarter">Quý này</SelectItem>
                                        <SelectItem value="year">Năm này</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Clear Filters Button */}
                        <div className="flex justify-end mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    setTypeFilter('all');
                                    setPlanTypeFilter('all');
                                    setPaymentMethodFilter('all');
                                    setDateFilter('all');
                                }}
                            >
                                Xóa bộ lọc
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Coming Soon Notice */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <CreditCard className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                            Tính năng đang phát triển
                        </h3>
                        <p className="text-blue-700 mb-4">
                            Hệ thống quản lý giao dịch thanh toán đang được phát triển để chuẩn bị cho việc ra mắt các gói premium.
                            Bạn có thể tạo dữ liệu thật từ users hiện có hoặc dữ liệu mẫu để test.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button onClick={migrateRealTransactions} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                                <Database className="w-4 h-4 mr-2" />
                                {loading ? 'Đang xử lý...' : 'Tạo dữ liệu thật từ Users'}
                            </Button>
                            <Button onClick={createSampleTransactions} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                                <Zap className="w-4 h-4 mr-2" />
                                {loading ? 'Đang xử lý...' : 'Tạo dữ liệu mẫu (Deprecated)'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách giao dịch thanh toán</CardTitle>
                    <CardDescription>
                        Hiển thị {transactions.length} giao dịch trên trang {currentPage} / {totalPages}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin" />
                            <span className="ml-2">Đang tải...</span>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8">
                            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Không có giao dịch thanh toán nào được tìm thấy</p>
                            <p className="text-sm text-gray-400 mt-2">Hãy tạo dữ liệu mẫu để test giao diện</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID Giao dịch</TableHead>
                                        <TableHead>Người dùng</TableHead>
                                        <TableHead>Gói dịch vụ</TableHead>
                                        <TableHead>Số tiền</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Phương thức</TableHead>
                                        <TableHead>Ngày tạo</TableHead>
                                        <TableHead>Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((transaction) => (
                                        <TableRow key={transaction._id}>
                                            <TableCell className="font-mono text-sm">
                                                {transaction.transactionId}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {transaction.userId.firstName} {transaction.userId.lastName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{transaction.userId.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {getPlanTypeBadge(transaction.planType)}
                                                    <div className="text-sm text-gray-500">{transaction.planName}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {formatCurrency(transaction.amount, transaction.currency)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(transaction.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium">{transaction.paymentMethod}</div>
                                                    <div className="text-xs text-gray-500">{transaction.paymentGateway}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div>{formatDate(transaction.createdAt)}</div>
                                                    {transaction.processedAt && (
                                                        <div className="text-sm text-gray-500">
                                                            Xử lý: {formatDate(transaction.processedAt)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedTransaction(transaction);
                                                            setShowTransactionModal(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.push(`/admin/transactions/${transaction._id}/edit`)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between space-x-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Hiển thị {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, stats.totalTransactions)}
                                    trong tổng số {stats.totalTransactions} giao dịch thanh toán
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Trước
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm">Trang {currentPage} / {totalPages}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Sau
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
