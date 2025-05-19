'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/utils/cn';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ToastProvider';
import { StockAutoComplete } from './StockAutoComplete';
import { vi } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { API_URL } from '@/config/constants';
import { createStockTransaction, addStockInvestment } from '@/services/investmentService';

// Interface cho props
interface StockInvestFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

// Định nghĩa danh sách công ty chứng khoán
interface BrokerOption {
    id: string;
    name: string;
    feePercent: number;
    minFee: number;
}

// Danh sách công ty chứng khoán và phí
const BROKERS: BrokerOption[] = [
    { id: 'vndirect', name: 'VNDirect', feePercent: 0.15, minFee: 10000 },
    { id: 'mbs', name: 'MBS', feePercent: 0.15, minFee: 10000 },
    { id: 'ssi', name: 'SSI', feePercent: 0.15, minFee: 10000 },
    { id: 'tcbs', name: 'TCBS (Techcombank)', feePercent: 0.1, minFee: 5000 },
    { id: 'vps', name: 'VPS', feePercent: 0.1, minFee: 5000 },
    { id: 'other', name: 'Khác (Nhập thủ công)', feePercent: 0, minFee: 0 },
];

// Schema xác thực form
const formSchema = z.object({
    symbol: z.string().min(1, 'Vui lòng chọn mã cổ phiếu'),
    price: z.coerce.number()
        .min(1, 'Giá mua phải lớn hơn 0')
        .max(100000000000, 'Giá tối đa là 100 tỷ'),
    quantity: z.coerce.number()
        .min(100, 'Số lượng phải từ 100 cổ phiếu trở lên')
        .max(100000000, 'Số lượng tối đa là 100 triệu')
        .refine(val => val % 100 === 0, { message: 'Số lượng phải là bội số của 100' }),
    purchaseDate: z.date({
        required_error: 'Vui lòng chọn ngày mua',
    }),
    fee: z.coerce.number()
        .min(0, 'Phí không được âm')
        .max(100000000000, 'Phí tối đa là 100 tỷ')
        .default(0),
    broker: z.string().default(BROKERS[0].id),
    otherBrokerName: z.string().optional(),
    otherBrokerFeePercent: z.coerce.number().min(0).max(100).optional(),
    otherBrokerMinFee: z.coerce.number().min(0).max(100000000000, 'Phí tối đa là 100 tỷ').optional(),
    autoFee: z.boolean().default(true),
    notes: z.string().max(500, 'Ghi chú không quá 500 ký tự').optional(),
}).refine(data => {
    if (data.broker === 'other') {
        if (!data.otherBrokerName || data.otherBrokerName.trim() === '') return false;
        if (data.autoFee) {
            if (data.otherBrokerFeePercent === undefined || data.otherBrokerFeePercent === null) return false;
            if (data.otherBrokerMinFee === undefined || data.otherBrokerMinFee === null) return false;
        }
    }
    return true;
}, {
    message: 'Vui lòng nhập đầy đủ thông tin cho công ty chứng khoán khác (Tên, % phí, Phí tối thiểu nếu bật tự động tính phí)',
    path: ['otherBrokerName'],
});

// Kiểu dữ liệu của form
type FormValues = z.infer<typeof formSchema>;

export function StockInvestForm({ onSuccess, onCancel }: StockInvestFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<string>('');
    const [currentStockPrice, setCurrentStockPrice] = useState<number | null>(null);
    const [formattedPrice, setFormattedPrice] = useState<string>('');
    const [selectedBroker, setSelectedBroker] = useState<BrokerOption>(BROKERS[0]);
    const { toast } = useToast();

    // Khởi tạo form
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            symbol: '',
            price: 0,
            quantity: 100,
            purchaseDate: new Date(),
            fee: 0,
            broker: BROKERS[0].id,
            otherBrokerName: '',
            otherBrokerFeePercent: 0.15,
            otherBrokerMinFee: 0,
            autoFee: true,
            notes: '',
        },
    });

    // Thêm function lấy giá cổ phiếu hiện tại từ API
    const fetchCurrentPrice = useCallback(async (symbol: string) => {
        if (!symbol) return;

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_STOCK_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_BASE_URL}/api/price?symbol=${symbol}`);

            if (!response.ok) {
                throw new Error(`Lỗi khi lấy giá cổ phiếu: ${response.status}`);
            }

            const data = await response.json();
            if (data.price) {
                setCurrentStockPrice(data.price);
                return data.price;
            }
        } catch (error) {
            console.error('Lỗi khi lấy giá cổ phiếu:', error);
        }
        return null;
    }, []);

    // Hàm tính phí giao dịch tự động
    const calculateFee = useCallback((price: number, quantity: number, brokerId: string, values: FormValues) => {
        if (price <= 0 || quantity <= 0) return 0;

        let currentBroker: BrokerOption;
        if (brokerId === 'other') {
            currentBroker = {
                id: 'other',
                name: values.otherBrokerName || 'Khác',
                feePercent: values.otherBrokerFeePercent !== undefined ? values.otherBrokerFeePercent : 0,
                minFee: values.otherBrokerMinFee !== undefined ? values.otherBrokerMinFee : 0,
            };
        } else {
            currentBroker = BROKERS.find(b => b.id === brokerId) || BROKERS[0];
        }

        const totalValue = price * quantity;
        let fee = totalValue * (currentBroker.feePercent / 100);

        // Áp dụng phí tối thiểu
        if (fee < currentBroker.minFee) {
            fee = currentBroker.minFee;
        }

        return Math.round(fee);
    }, []);

    // Xử lý khi chọn cổ phiếu
    const handleStockSelect = async (value: string) => {
        setSelectedSymbol(value);
        form.setValue('symbol', value);

        // Lấy giá hiện tại và điền vào form
        const price = await fetchCurrentPrice(value);
        if (price) {
            form.setValue('price', price);
            setFormattedPrice(price.toLocaleString('vi-VN'));

            // Cập nhật phí nếu chế độ tự động được bật
            if (form.getValues('autoFee')) {
                const quantity = form.getValues('quantity');
                const brokerId = form.getValues('broker');
                const fee = calculateFee(price, quantity, brokerId, form.getValues());
                form.setValue('fee', fee);
            }
        }
    };

    // Hàm định dạng giá tiền
    const formatPriceInput = (value: string) => {
        // Xóa tất cả ký tự không phải số
        const numericValue = value.replace(/[^0-9]/g, '');

        if (numericValue) {
            // Chuyển đổi sang số và định dạng với dấu phân cách hàng nghìn
            const numValue = parseInt(numericValue, 10);
            setFormattedPrice(numValue.toLocaleString('vi-VN'));

            // Cập nhật phí nếu cần
            if (form.getValues('autoFee')) {
                const quantity = form.getValues('quantity');
                const brokerId = form.getValues('broker');
                const fee = calculateFee(numValue, quantity, brokerId, form.getValues());
                form.setValue('fee', fee);
            }

            return numValue;
        } else {
            setFormattedPrice('');
            return 0;
        }
    };

    // Xử lý sự kiện thay đổi giá
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numValue = formatPriceInput(e.target.value);
        form.setValue('price', numValue);
    };

    // Xử lý sự kiện thay đổi số lượng
    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = parseInt(e.target.value, 10);
        if (isNaN(value)) value = 0;

        // Đảm bảo số lượng là bội số của 100
        const roundedValue = Math.floor(value / 100) * 100;
        if (roundedValue === 0 && value > 0) {
            value = 100;
        } else {
            value = roundedValue;
        }

        form.setValue('quantity', value);

        // Cập nhật phí nếu cần
        if (form.getValues('autoFee')) {
            const price = form.getValues('price');
            const brokerId = form.getValues('broker');
            const fee = calculateFee(price, value, brokerId, form.getValues());
            form.setValue('fee', fee);
        }
    };

    // Xử lý khi chuyển đổi chế độ tự động tính phí
    const handleAutoFeeToggle = (checked: boolean) => {
        form.setValue('autoFee', checked);

        if (checked) {
            // Khi bật chế độ tự động, tính lại phí
            const price = form.getValues('price');
            const quantity = form.getValues('quantity');
            const brokerId = form.getValues('broker');
            const fee = calculateFee(price, quantity, brokerId, form.getValues());
            form.setValue('fee', fee);
        } else {
            // Nếu tắt tự động và đang là broker 'Khác', không clear fee
            // Nếu là broker khác 'Khác', có thể clear fee hoặc để người dùng tự nhập
            // form.setValue('fee', 0); // Tùy chọn: reset phí khi tắt tự động
        }
    };

    // Xử lý khi chọn công ty chứng khoán
    const handleBrokerChange = (brokerId: string) => {
        const brokerInfo = BROKERS.find(b => b.id === brokerId) || BROKERS[0];
        setSelectedBroker(brokerInfo);
        form.setValue('broker', brokerId);

        // Nếu chọn 'Khác', không tự động điền otherBrokerFeePercent và otherBrokerMinFee từ BROKERS
        // người dùng sẽ tự nhập chúng.
        // Nếu chọn một broker cụ thể, có thể reset các trường other...
        if (brokerId !== 'other') {
            form.setValue('otherBrokerName', '');
            // Để lại otherBrokerFeePercent và otherBrokerMinFee như defaultValues hoặc giá trị người dùng đã nhập trước đó nếu họ quay lại chọn 'Khác'
        }

        if (form.getValues('autoFee')) {
            const price = form.getValues('price');
            const quantity = form.getValues('quantity');
            const fee = calculateFee(price, quantity, brokerId, form.getValues());
            form.setValue('fee', fee);
        }
    };

    // Xử lý khi form mới reset
    useEffect(() => {
        const subscription = form.watch((value) => {
            if (value.price === 0) {
                setFormattedPrice('');
            }
        });
        return () => subscription.unsubscribe();
    }, [form.watch]);

    // Xử lý khi submit form
    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);

        try {
            // Đảm bảo dữ liệu hợp lệ
            if (!values.symbol) {
                throw new Error('Vui lòng chọn mã cổ phiếu');
            }

            if (!values.price || values.price <= 0) {
                throw new Error('Vui lòng nhập giá hợp lệ');
            }

            if (!values.quantity || values.quantity <= 0) {
                throw new Error('Vui lòng nhập số lượng hợp lệ');
            }

            let finalBrokerName = values.broker;
            let feeDetailsForNotes = '';

            if (values.broker === 'other') {
                if (!values.otherBrokerName || values.otherBrokerName.trim() === '') {
                    form.setError('otherBrokerName', { type: 'manual', message: 'Vui lòng nhập tên công ty chứng khoán.' });
                    setIsLoading(false);
                    return;
                }
                finalBrokerName = values.otherBrokerName.trim();
                if (values.autoFee) {
                    if (values.otherBrokerFeePercent === undefined || values.otherBrokerFeePercent === null) {
                        form.setError('otherBrokerFeePercent', { type: 'manual', message: 'Vui lòng nhập % phí.' });
                        setIsLoading(false);
                        return;
                    }
                    if (values.otherBrokerMinFee === undefined || values.otherBrokerMinFee === null) {
                        form.setError('otherBrokerMinFee', { type: 'manual', message: 'Vui lòng nhập phí tối thiểu.' });
                        setIsLoading(false);
                        return;
                    }
                    feeDetailsForNotes = ` (% phí: ${values.otherBrokerFeePercent}, tối thiểu: ${values.otherBrokerMinFee} VND)`
                } else {
                    feeDetailsForNotes = ' (Phí nhập thủ công)';
                }
            } else {
                const selectedBrokerInfo = BROKERS.find(b => b.id === values.broker);
                if (selectedBrokerInfo) {
                    finalBrokerName = selectedBrokerInfo.name;
                    feeDetailsForNotes = ` (% phí: ${selectedBrokerInfo.feePercent}, tối thiểu: ${selectedBrokerInfo.minFee} VND)`;
                }
            }

            // Chuẩn bị dữ liệu đầu tư
            const stockData = {
                symbol: values.symbol,
                price: values.price,
                quantity: values.quantity,
                purchaseDate: format(values.purchaseDate, 'yyyy-MM-dd'),
                fee: values.fee || 0,
                broker: finalBrokerName,
                brokerFeeDetails: feeDetailsForNotes,
                notes: values.notes || ''
            };

            console.log('Dữ liệu đầu tư sẽ gửi lên API:', stockData);

            // Gọi API thêm đầu tư cổ phiếu từ service
            const result = await addStockInvestment(stockData);
            console.log('Kết quả API thêm đầu tư:', result);

            // Hiển thị thông báo thành công
            toast({
                title: 'Thành công',
                description: 'Đã thêm đầu tư cổ phiếu thành công!',
                type: 'success'
            });

            if (onSuccess) {
                onSuccess();
            }

            // Reset form
            form.reset();
            setFormattedPrice('');
            setSelectedSymbol('');
            setCurrentStockPrice(null);
        } catch (error) {
            console.error('Lỗi khi lưu đầu tư:', error);

            // Xử lý lỗi từ API
            let errorMessage = 'Lỗi không xác định';

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null) {
                // Thử truy cập các thuộc tính lỗi từ Axios
                const axiosError = error as any;
                if (axiosError.response && axiosError.response.data) {
                    // Lấy thông báo lỗi từ backend
                    if (axiosError.response.data.message) {
                        errorMessage = axiosError.response.data.message;
                    } else if (typeof axiosError.response.data === 'string') {
                        errorMessage = axiosError.response.data;
                    }
                }
            }

            // Hiển thị thông báo lỗi
            toast({
                title: 'Lỗi',
                description: `Đã xảy ra lỗi khi lưu đầu tư: ${errorMessage}`,
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Tính tổng giá trị (số lượng * đơn giá)
    const totalInvestment = form.watch('price') * form.watch('quantity');
    const totalWithFee = totalInvestment + form.watch('fee');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Card className="border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl text-blue-800 dark:text-blue-300">Thêm đầu tư cổ phiếu mới</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Mã cổ phiếu */}
                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium text-foreground dark:text-foreground-dark">Mã cổ phiếu</FormLabel>
                                    <FormControl>
                                        <StockAutoComplete
                                            onStockSelect={handleStockSelect}
                                            defaultValue={field.value}
                                            isLoading={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                        Chọn mã cổ phiếu bạn đã đầu tư
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Giá mua - phiên bản tối ưu */}
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel className="font-medium text-foreground dark:text-foreground-dark">Giá mua (VND)</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <CurrencyInput
                                                    placeholder="0"
                                                    value={field.value}
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        if (value !== undefined && form.getValues('autoFee')) {
                                                            const quantity = form.getValues('quantity');
                                                            const brokerId = form.getValues('broker');
                                                            const fee = calculateFee(value, quantity, brokerId, form.getValues());
                                                            form.setValue('fee', fee);
                                                        }
                                                    }}
                                                    onBlur={field.onBlur}
                                                    disabled={isLoading}
                                                    className="pr-40 text-lg h-14 font-medium text-right bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                                />
                                            </FormControl>
                                            <div className="absolute right-1 top-1 flex space-x-1">
                                                {currentStockPrice && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-12 text-xs bg-background dark:bg-background-dark hover:bg-accent dark:hover:bg-accent-dark text-foreground dark:text-foreground-dark border-border dark:border-border-dark"
                                                        onClick={() => {
                                                            form.setValue('price', currentStockPrice);
                                                            setFormattedPrice(currentStockPrice.toLocaleString('vi-VN'));

                                                            // Cập nhật phí nếu cần
                                                            if (form.getValues('autoFee')) {
                                                                const quantity = form.getValues('quantity');
                                                                const brokerId = form.getValues('broker');
                                                                const fee = calculateFee(currentStockPrice, quantity, brokerId, form.getValues());
                                                                form.setValue('fee', fee);
                                                            }
                                                        }}
                                                    >
                                                        Dùng giá hiện tại
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            Giá mua một cổ phiếu
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Số lượng - đảm bảo bội số của 100 */}
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field, fieldState: { error } }) => (
                                    <FormItem>
                                        <FormLabel className="font-medium text-foreground dark:text-foreground-dark">Số lượng</FormLabel>
                                        <FormControl>
                                            <CurrencyInput
                                                placeholder="100"
                                                value={field.value}
                                                onValueChange={(value) => {
                                                    let finalValue = value;
                                                    if (value !== undefined) {
                                                        const roundedValue = Math.floor(value / 100) * 100;
                                                        if (roundedValue === 0 && value > 0) {
                                                            finalValue = 100;
                                                        } else {
                                                            finalValue = roundedValue;
                                                        }
                                                    }
                                                    field.onChange(finalValue);
                                                    if (finalValue !== undefined && form.getValues('autoFee')) {
                                                        const price = form.getValues('price');
                                                        const brokerId = form.getValues('broker');
                                                        const fee = calculateFee(price, finalValue, brokerId, form.getValues());
                                                        form.setValue('fee', fee);
                                                    }
                                                }}
                                                onBlur={field.onBlur}
                                                disabled={isLoading}
                                                className="text-right bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            Số lượng cổ phiếu (phải là bội số của 100)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Công ty chứng khoán */}
                            <FormField
                                control={form.control}
                                name="broker"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-medium text-foreground dark:text-foreground-dark">Công ty chứng khoán</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={handleBrokerChange}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder="Chọn công ty chứng khoán" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark">
                                                {BROKERS.map((broker) => (
                                                    <SelectItem key={broker.id} value={broker.id} className="hover:bg-accent dark:hover:bg-accent-dark">
                                                        {broker.name} ({broker.feePercent}%)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            Phí giao dịch: {selectedBroker.feePercent}%, tối thiểu {selectedBroker.minFee.toLocaleString()} VND
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Các trường cho công ty chứng khoán 'Khác' */}
                            {form.watch('broker') === 'other' && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="otherBrokerName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-medium text-foreground dark:text-foreground-dark">Tên công ty chứng khoán khác</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nhập tên công ty" {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {form.watch('autoFee') && (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="otherBrokerFeePercent"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium text-foreground dark:text-foreground-dark">% Phí giao dịch (Khác)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.01" placeholder="0.15" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="otherBrokerMinFee"
                                                render={({ field, fieldState: { error } }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium text-foreground dark:text-foreground-dark">Phí tối thiểu (VND - Khác)</FormLabel>
                                                        <FormControl>
                                                            <CurrencyInput
                                                                placeholder="5000"
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                                onBlur={field.onBlur}
                                                                disabled={isLoading}
                                                                className="text-right bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </>
                                    )}
                                    {!form.watch('autoFee') && (
                                        <FormDescription className="col-span-1 md:col-span-2 text-sm text-muted-foreground dark:text-muted-foreground-dark">
                                            Bạn đã chọn nhập phí giao dịch thủ công cho công ty chứng khoán này.
                                        </FormDescription>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Ngày mua */}
                            <FormField
                                control={form.control}
                                name="purchaseDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="font-medium text-foreground dark:text-foreground-dark">Ngày mua</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center justify-between rounded-md border border-input dark:border-input-dark bg-background dark:bg-input-dark px-4 py-2 text-sm font-medium ring-offset-background dark:ring-offset-background-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-ring-dark focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background-dark disabled:pointer-events-none disabled:opacity-50 h-10 text-foreground dark:text-foreground-dark",
                                                            !field.value && "text-muted-foreground dark:text-muted-foreground-dark"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, 'dd/MM/yyyy', { locale: vi })
                                                        ) : (
                                                            <span>Chọn ngày</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </span>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 bg-popover dark:bg-popover-dark text-popover-foreground dark:text-popover-foreground-dark" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date > new Date()}
                                                    initialFocus
                                                    className="dark:bg-popover-dark dark:text-popover-foreground-dark"
                                                    classNames={{
                                                        caption_label: "dark:text-popover-foreground-dark",
                                                        nav_button: "dark:text-popover-foreground-dark dark:hover:text-popover-foreground-dark/80",
                                                        head_cell: "dark:text-muted-foreground-dark",
                                                        day: "dark:text-popover-foreground-dark dark:hover:bg-accent-dark dark:hover:text-accent-foreground-dark",
                                                        day_selected: "dark:bg-primary-dark dark:text-primary-foreground-dark dark:hover:bg-primary-dark/90",
                                                        day_today: "dark:bg-accent-dark dark:text-accent-foreground-dark",
                                                        day_disabled: "dark:text-muted-foreground-dark dark:opacity-50",
                                                        // ... bạn có thể thêm các tùy chỉnh khác cho dark mode nếu cần
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            Ngày thực hiện giao dịch mua
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Phí giao dịch */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <FormLabel className="font-medium text-foreground dark:text-foreground-dark">Phí giao dịch (VND)</FormLabel>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <span className="text-muted-foreground dark:text-muted-foreground-dark">Thủ công</span>
                                        <FormField
                                            control={form.control}
                                            name="autoFee"
                                            render={({ field }) => (
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={handleAutoFeeToggle}
                                                        disabled={isLoading}
                                                        className="data-[state=checked]:bg-primary dark:data-[state=checked]:bg-primary-dark data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input-dark"
                                                    />
                                                </FormControl>
                                            )}
                                        />
                                        <span className="text-muted-foreground dark:text-muted-foreground-dark">Tự động</span>
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="fee"
                                    render={({ field, fieldState: { error } }) => (
                                        <FormItem>
                                            <FormControl>
                                                <CurrencyInput
                                                    placeholder="0"
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    onBlur={field.onBlur}
                                                    disabled={isLoading || form.getValues('autoFee')}
                                                    className={cn(form.getValues('autoFee') ? "bg-gray-100 dark:bg-gray-700 text-right" : "bg-input dark:bg-input-dark text-right", "text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark")}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                                {form.getValues('autoFee')
                                                    ? `Phí tự động: ${form.watch('broker') === 'other' ? (form.getValues('otherBrokerFeePercent') || 0) : selectedBroker.feePercent}% giá trị giao dịch, tối thiểu ${form.watch('broker') === 'other' ? (form.getValues('otherBrokerMinFee') || 0).toLocaleString() : selectedBroker.minFee.toLocaleString()} VND`
                                                    : "Phí môi giới và các chi phí khác"}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Tổng giá trị đầu tư */}
                        <div className="bg-blue-100 dark:bg-gray-800 p-4 rounded-md space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="font-medium text-gray-700 dark:text-gray-200">Tổng giá trị cổ phiếu:</div>
                                <div className="text-xl font-bold text-blue-800 dark:text-blue-300">
                                    {totalInvestment.toLocaleString('vi-VN')} VND
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <div className="text-gray-600 dark:text-gray-300">Phí giao dịch:</div>
                                <div className="font-medium text-gray-700 dark:text-gray-200">
                                    + {form.watch('fee').toLocaleString('vi-VN')} VND
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-gray-700">
                                <div className="font-medium text-gray-700 dark:text-gray-200">Tổng chi phí đầu tư:</div>
                                <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                                    {totalWithFee.toLocaleString('vi-VN')} VND
                                </div>
                            </div>

                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center">
                                <Info className="h-3 w-3 mr-1" />
                                Bao gồm cả phí giao dịch
                            </div>
                        </div>

                        {/* Ghi chú */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium text-foreground dark:text-foreground-dark">Ghi chú</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ghi chú về khoản đầu tư này..."
                                            className="resize-none bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                        Thêm bất kỳ ghi chú nào về quyết định đầu tư của bạn
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 pt-0">
                        {onCancel && (
                            <Button variant="outline" onClick={onCancel} disabled={isLoading} className="bg-transparent hover:bg-accent dark:hover:bg-accent-dark text-foreground dark:text-foreground-dark border-border dark:border-border-dark">
                                Hủy
                            </Button>
                        )}
                        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 text-primary-foreground dark:text-primary-foreground-dark">
                            {isLoading ? 'Đang lưu...' : 'Lưu đầu tư'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
} 