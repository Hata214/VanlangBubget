'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import {
    Trash2,
    ChevronDown,
    ChevronsUpDown,
    DollarSign,
    Calendar,
    Tag,
    Plus,
    Edit,
    CreditCard,
    CircleDollarSign
} from 'lucide-react';
import CurrencyStockIcon from '@/components/icons/CurrencyStockIcon';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/Form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/Popover';
import { Calendar as CalendarComponent } from '@/components/ui/Calendar';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toaster';

// Interface cho giao dịch cổ phiếu
interface StockTransactionData {
    id: string;
    stockSymbol: string;
    stockName: string;
    transactionType: 'buy' | 'sell';
    price: number;
    quantity: number;
    transactionDate: Date;
    fee: number;
    tax?: number;
    total: number;
    note?: string;
    createdAt: Date;
}

// Interface cho props component
interface StockTransactionProps {
    stockSymbol: string;
    onTransactionAdded?: () => void;
}

// Schema validation cho form thêm giao dịch
const transactionFormSchema = z.object({
    transactionType: z.enum(['buy', 'sell'], {
        required_error: "Vui lòng chọn loại giao dịch",
    }),
    price: z.coerce.number().positive({
        message: "Giá phải lớn hơn 0",
    }),
    quantity: z.coerce.number().int({
        message: "Số lượng phải là số nguyên",
    }).positive({
        message: "Số lượng phải lớn hơn 0",
    }).refine(val => val % 100 === 0, {
        message: "Số lượng phải là bội số của 100",
    }),
    transactionDate: z.date({
        required_error: "Vui lòng chọn ngày giao dịch",
    }).refine(
        date => date <= new Date(),
        { message: "Không thể chọn ngày trong tương lai" }
    ),
    fee: z.coerce.number().min(0, {
        message: "Phí không được âm",
    }),
    tax: z.coerce.number().min(0, {
        message: "Thuế không được âm",
    }).optional(),
    note: z.string().max(200, {
        message: "Ghi chú không quá 200 ký tự",
    }).optional(),
});

// Dữ liệu mẫu cho giao dịch (sẽ được thay thế bằng API)
const SAMPLE_TRANSACTIONS: StockTransactionData[] = [
    {
        id: '1',
        stockSymbol: 'VNM',
        stockName: 'Công ty CP Sữa Việt Nam',
        transactionType: 'buy',
        price: 85400,
        quantity: 500,
        transactionDate: new Date('2024-07-15'),
        fee: 212500,
        total: 42912500,
        createdAt: new Date('2024-07-15T09:30:00'),
    },
    {
        id: '2',
        stockSymbol: 'VNM',
        stockName: 'Công ty CP Sữa Việt Nam',
        transactionType: 'buy',
        price: 86200,
        quantity: 200,
        transactionDate: new Date('2024-07-25'),
        fee: 86200,
        total: 17326200,
        note: 'Thêm vị thế khi giá xuống',
        createdAt: new Date('2024-07-25T10:15:00'),
    },
    {
        id: '3',
        stockSymbol: 'VNM',
        stockName: 'Công ty CP Sữa Việt Nam',
        transactionType: 'sell',
        price: 89400,
        quantity: 300,
        transactionDate: new Date('2024-08-10'),
        fee: 134100,
        tax: 80460,
        total: 26605440,
        note: 'Chốt lãi một phần',
        createdAt: new Date('2024-08-10T11:20:00'),
    },
];

export function StockTransaction({ stockSymbol, onTransactionAdded }: StockTransactionProps) {
    const [transactions, setTransactions] = useState<StockTransactionData[]>([]);
    const [activeTab, setActiveTab] = useState<'history' | 'add'>('history');
    const [stockName, setStockName] = useState('');

    // Form cho thêm giao dịch
    const form = useForm<z.infer<typeof transactionFormSchema>>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: {
            transactionType: 'buy',
            price: 0,
            quantity: 0,
            transactionDate: new Date(),
            fee: 0,
            tax: 0,
            note: '',
        },
    });

    // Nhận giá trị hiện tại của form
    const watchPrice = form.watch('price');
    const watchQuantity = form.watch('quantity');
    const watchTransactionType = form.watch('transactionType');
    const watchFee = form.watch('fee');
    const watchTax = form.watch('tax') || 0;

    // Tính tổng giá trị giao dịch
    const transactionValue = watchPrice * watchQuantity;

    // Tính tổng tiền cho giao dịch mua/bán
    const totalValue = watchTransactionType === 'buy'
        ? transactionValue + watchFee
        : transactionValue - watchFee - watchTax;

    // Lấy danh sách giao dịch khi component mount
    useEffect(() => {
        // API sẽ được gọi ở đây
        // fetchTransactions(stockSymbol);

        // Dùng dữ liệu mẫu cho demo
        const filteredTransactions = SAMPLE_TRANSACTIONS.filter(
            transaction => transaction.stockSymbol === stockSymbol
        );
        setTransactions(filteredTransactions);

        // Lấy tên cổ phiếu (sẽ thay bằng API)
        if (filteredTransactions.length > 0) {
            setStockName(filteredTransactions[0].stockName);
        }
    }, [stockSymbol]);

    // Xử lý thêm giao dịch mới
    const onSubmit = (values: z.infer<typeof transactionFormSchema>) => {
        // Trong thực tế sẽ gọi API để lưu giao dịch
        console.log('Giao dịch mới:', values);

        // Tính tổng giá trị giao dịch
        const total = values.transactionType === 'buy'
            ? values.price * values.quantity + values.fee
            : values.price * values.quantity - values.fee - (values.tax || 0);

        // Thêm giao dịch mới vào danh sách (giả lập)
        const newTransaction: StockTransactionData = {
            id: (transactions.length + 1).toString(),
            stockSymbol,
            stockName: stockName || stockSymbol,
            transactionType: values.transactionType,
            price: values.price,
            quantity: values.quantity,
            transactionDate: values.transactionDate,
            fee: values.fee,
            tax: values.tax,
            total,
            note: values.note,
            createdAt: new Date(),
        };

        setTransactions(prev => [newTransaction, ...prev]);

        // Reset form
        form.reset({
            transactionType: 'buy',
            price: 0,
            quantity: 0,
            transactionDate: new Date(),
            fee: 0,
            tax: 0,
            note: '',
        });

        toast.success(
            "Giao dịch thành công",
            `Đã thêm giao dịch ${values.transactionType === 'buy' ? 'mua' : 'bán'} ${values.quantity} cổ phiếu ${stockSymbol}`
        );

        // Chuyển về tab lịch sử
        setActiveTab('history');

        // Gọi callback nếu có
        if (onTransactionAdded) {
            onTransactionAdded();
        }
    };

    // Xử lý xóa giao dịch
    const handleDeleteTransaction = (id: string) => {
        // Trong thực tế sẽ gọi API để xóa
        console.log('Xóa giao dịch:', id);

        // Xóa khỏi danh sách (giả lập)
        setTransactions(prev => prev.filter(transaction => transaction.id !== id));

        toast.success(
            "Đã xóa giao dịch",
            "Giao dịch đã được xóa thành công"
        );

        // Gọi callback nếu có
        if (onTransactionAdded) {
            onTransactionAdded();
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold">
                    Giao dịch cổ phiếu {stockSymbol}
                    {stockName && <span className="text-sm font-normal text-muted-foreground ml-2">({stockName})</span>}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs
                    defaultValue="history"
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as 'history' | 'add')}
                    className="w-full"
                >
                    <TabsList className="mb-4">
                        <TabsTrigger value="history">Lịch sử giao dịch</TabsTrigger>
                        <TabsTrigger value="add">Thêm giao dịch</TabsTrigger>
                    </TabsList>

                    <TabsContent value="history">
                        {transactions.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ngày</TableHead>
                                        <TableHead>Loại</TableHead>
                                        <TableHead>Số lượng</TableHead>
                                        <TableHead>Giá</TableHead>
                                        <TableHead>Phí</TableHead>
                                        <TableHead>Tổng tiền</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell>
                                                {format(transaction.transactionDate, 'dd/MM/yyyy', { locale: vi })}
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "text-xs px-2 py-1 rounded-full",
                                                    transaction.transactionType === 'buy'
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                )}>
                                                    {transaction.transactionType === 'buy' ? 'Mua' : 'Bán'}
                                                </span>
                                            </TableCell>
                                            <TableCell>{transaction.quantity.toLocaleString('vi-VN')}</TableCell>
                                            <TableCell>{transaction.price.toLocaleString('vi-VN')} đ</TableCell>
                                            <TableCell>
                                                {transaction.fee.toLocaleString('vi-VN')} đ
                                                {transaction.tax && transaction.tax > 0 && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Thuế: {transaction.tax.toLocaleString('vi-VN')} đ
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {transaction.total.toLocaleString('vi-VN')} đ
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Không có giao dịch nào. Hãy thêm giao dịch đầu tiên của bạn.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="add">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Loại giao dịch */}
                                    <FormField
                                        control={form.control}
                                        name="transactionType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Loại giao dịch</FormLabel>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        type="button"
                                                        variant={field.value === 'buy' ? 'default' : 'outline'}
                                                        className={field.value === 'buy' ? 'bg-green-600 hover:bg-green-700' : ''}
                                                        onClick={() => field.onChange('buy')}
                                                    >
                                                        Mua vào
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={field.value === 'sell' ? 'default' : 'outline'}
                                                        className={field.value === 'sell' ? 'bg-red-600 hover:bg-red-700' : ''}
                                                        onClick={() => field.onChange('sell')}
                                                    >
                                                        Bán ra
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Ngày giao dịch */}
                                    <FormField
                                        control={form.control}
                                        name="transactionDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ngày giao dịch</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, 'dd/MM/yyyy', { locale: vi })
                                                                ) : (
                                                                    <span>Chọn ngày</span>
                                                                )}
                                                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <CalendarComponent
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date > new Date()}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Giá */}
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Giá ({watchTransactionType === 'buy' ? 'mua' : 'bán'})</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            placeholder="Nhập giá"
                                                            className="pl-8"
                                                        />
                                                        <CurrencyStockIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Khối lượng */}
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Khối lượng (cổ phiếu)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            placeholder="Nhập khối lượng"
                                                            className="pl-8"
                                                            step={100}
                                                        />
                                                        <Tag className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                </FormControl>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Khối lượng phải là bội số của 100
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Phí giao dịch */}
                                    <FormField
                                        control={form.control}
                                        name="fee"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phí giao dịch</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        placeholder="Nhập phí giao dịch"
                                                    />
                                                </FormControl>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Thông thường 0.25% giá trị giao dịch
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Thuế (chỉ hiển thị khi bán) */}
                                    {watchTransactionType === 'sell' && (
                                        <FormField
                                            control={form.control}
                                            name="tax"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Thuế</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            placeholder="Nhập thuế"
                                                            value={field.value || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? undefined : Number(e.target.value);
                                                                field.onChange(value);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Thuế TNCN 0.1% (chỉ áp dụng khi bán)
                                                    </p>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                {/* Ghi chú */}
                                <FormField
                                    control={form.control}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ghi chú (không bắt buộc)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Nhập ghi chú cho giao dịch này"
                                                    value={field.value || ''}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Tổng kết giao dịch */}
                                <div className="bg-muted p-4 rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-muted-foreground">Giá trị giao dịch:</span>
                                        <span>{transactionValue.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-muted-foreground">Phí giao dịch:</span>
                                        <span>{watchFee.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    {watchTransactionType === 'sell' && (
                                        <div className="flex justify-between mb-2">
                                            <span className="text-muted-foreground">Thuế:</span>
                                            <span>{watchTax.toLocaleString('vi-VN')} đ</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-medium pt-2 border-t">
                                        <span>Tổng cộng:</span>
                                        <span className="text-lg">
                                            {totalValue.toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setActiveTab('history')}
                                    >
                                        Hủy
                                    </Button>
                                    <Button type="submit" className="px-6">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Thêm giao dịch
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
} 