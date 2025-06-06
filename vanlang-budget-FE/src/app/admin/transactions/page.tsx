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
    Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';

interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'loan' | 'investment';
    amount: number;
    description: string;
    category: string;
    date: string;
    userId: string;
    userName: string;
    userEmail: string;
    createdAt: string;
    updatedAt: string;
}

interface TransactionStats {
    totalIncome: number;
    totalExpense: number;
    totalLoans: number;
    totalInvestments: number;
    transactionCount: number;
}

export default function AdminTransactionsPage() {
    const t = useTranslations();
    const router = useRouter();

    // State management
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<TransactionStats>({
        totalIncome: 0,
        totalExpense: 0,
        totalLoans: 0,
        totalInvestments: 0,
        transactionCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('');
    const [amountFilter, setAmountFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);

    // Load transactions data
    const loadTransactions = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                ...(searchTerm && { search: searchTerm }),
                ...(typeFilter !== 'all' && { type: typeFilter }),
                ...(dateFilter !== 'all' && { dateRange: dateFilter }),
                ...(userFilter && { userId: userFilter }),
                ...(amountFilter !== 'all' && { amountRange: amountFilter })
            });

            const response = await fetch(`/api/admin/transactions?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }

            const data = await response.json();

            if (data.status === 'success') {
                setTransactions(data.data.transactions || []);
                setStats(data.data.stats || stats);
                setTotalPages(data.pagination?.totalPages || 1);
            } else {
                throw new Error(data.message || 'Failed to load transactions');
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            toast.error('Không thể tải danh sách giao dịch');
        } finally {
            setLoading(false);
        }
    };

    // Load data on component mount and when filters change
    useEffect(() => {
        loadTransactions();
    }, [currentPage, searchTerm, typeFilter, dateFilter, userFilter, amountFilter]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Get transaction type badge
    const getTransactionTypeBadge = (type: string) => {
        const badges = {
            income: { label: 'Thu nhập', color: 'bg-green-100 text-green-800', icon: TrendingUp },
            expense: { label: 'Chi tiêu', color: 'bg-red-100 text-red-800', icon: TrendingDown },
            loan: { label: 'Khoản vay', color: 'bg-orange-100 text-orange-800', icon: CreditCard },
            investment: { label: 'Đầu tư', color: 'bg-blue-100 text-blue-800', icon: PiggyBank }
        };

        const badge = badges[type as keyof typeof badges] || badges.expense;
        const IconComponent = badge.icon;

        return (
            <Badge className={`${badge.color} flex items-center gap-1`}>
                <IconComponent size={12} />
                {badge.label}
            </Badge>
        );
    };

    // Handle export
    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                export: 'true',
                ...(searchTerm && { search: searchTerm }),
                ...(typeFilter !== 'all' && { type: typeFilter }),
                ...(dateFilter !== 'all' && { dateRange: dateFilter }),
                ...(userFilter && { userId: userFilter }),
                ...(amountFilter !== 'all' && { amountRange: amountFilter })
            });

            const response = await fetch(`/api/admin/transactions/export?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Xuất dữ liệu thành công');
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Không thể xuất dữ liệu');
        }
    };

    // Handle view transaction details
    const handleViewTransaction = (transactionId: string) => {
        router.push(`/admin/transactions/${transactionId}`);
    };

    // Handle edit transaction
    const handleEditTransaction = (transactionId: string) => {
        router.push(`/admin/transactions/${transactionId}/edit`);
    };

    // Handle delete transaction
    const handleDeleteTransaction = async (transactionId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/transactions/${transactionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                toast.success('Xóa giao dịch thành công');
                loadTransactions(); // Reload data
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Không thể xóa giao dịch');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Giao dịch</h1>
                    <p className="text-muted-foreground">
                        Quản lý tất cả giao dịch của người dùng trong hệ thống
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={loadTransactions} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Làm mới
                    </Button>
                    <Button onClick={handleExport} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Xuất dữ liệu
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng thu nhập</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(stats.totalIncome)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(stats.totalExpense)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng khoản vay</CardTitle>
                        <CreditCard className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(stats.totalLoans)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng đầu tư</CardTitle>
                        <PiggyBank className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(stats.totalInvestments)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Số giao dịch</CardTitle>
                        <Building className="h-4 w-4 text-gray-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.transactionCount.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Bộ lọc
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        {/* Search */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tìm kiếm</label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm theo mô tả, người dùng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
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
                                    <SelectItem value="income">Thu nhập</SelectItem>
                                    <SelectItem value="expense">Chi tiêu</SelectItem>
                                    <SelectItem value="loan">Khoản vay</SelectItem>
                                    <SelectItem value="investment">Đầu tư</SelectItem>
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

                        {/* Amount Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Số tiền</label>
                            <Select value={amountFilter} onValueChange={setAmountFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn khoảng tiền" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="under-100k">Dưới 100k</SelectItem>
                                    <SelectItem value="100k-500k">100k - 500k</SelectItem>
                                    <SelectItem value="500k-1m">500k - 1M</SelectItem>
                                    <SelectItem value="1m-5m">1M - 5M</SelectItem>
                                    <SelectItem value="over-5m">Trên 5M</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* User Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Người dùng</label>
                            <Input
                                placeholder="ID hoặc email người dùng"
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách giao dịch</CardTitle>
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
                            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Không có giao dịch nào được tìm thấy</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Loại</TableHead>
                                        <TableHead>Mô tả</TableHead>
                                        <TableHead>Danh mục</TableHead>
                                        <TableHead>Số tiền</TableHead>
                                        <TableHead>Người dùng</TableHead>
                                        <TableHead>Ngày</TableHead>
                                        <TableHead>Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell>
                                                {getTransactionTypeBadge(transaction.type)}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {transaction.description}
                                            </TableCell>
                                            <TableCell>{transaction.category}</TableCell>
                                            <TableCell className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' :
                                                    transaction.type === 'expense' ? 'text-red-600' :
                                                        transaction.type === 'loan' ? 'text-orange-600' : 'text-blue-600'
                                                }`}>
                                                {formatCurrency(transaction.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{transaction.userName}</div>
                                                    <div className="text-sm text-gray-500">{transaction.userEmail}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div>{new Date(transaction.date).toLocaleDateString('vi-VN')}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {new Date(transaction.createdAt).toLocaleTimeString('vi-VN')}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewTransaction(transaction.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditTransaction(transaction.id)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteTransaction(transaction.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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
                                    Hiển thị {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, stats.transactionCount)}
                                    trong tổng số {stats.transactionCount} giao dịch
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
