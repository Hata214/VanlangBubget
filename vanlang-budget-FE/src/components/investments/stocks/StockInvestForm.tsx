'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
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
        .refine(val => val % 100 === 0, { message: 'Quantity must be a multiple of 100' }),
    purchaseDate: z.date({
        required_error: 'Please select purchase date',
    }),
    fee: z.coerce.number()
        .min(0, 'Phí không được âm')
        .max(100000000000, 'Phí tối đa là 100 tỷ')
        .optional(),
    broker: z.string().optional(),
    otherBrokerName: z.string().optional(),
    otherBrokerFeePercent: z.coerce.number().min(0).max(100).optional(),
    otherBrokerMinFee: z.coerce.number().min(0).max(100000000000, 'Phí tối đa là 100 tỷ').optional(),
    autoFee: z.boolean().optional(), // Thay đổi: autoFee cũng là optional
    notes: z.string().max(500, 'Ghi chú không quá 500 ký tự').optional(),
}).refine(data => {
    if (data.broker === 'other') {
        if (!data.otherBrokerName || data.otherBrokerName.trim() === '') {
            return false;
        }
        if (data.autoFee ?? true) { // Sử dụng ?? true vì autoFee giờ là optional
            // Nếu tự động tính phí và là broker 'Khác', các trường phí phải được cung cấp
            if (data.otherBrokerFeePercent === undefined || data.otherBrokerFeePercent === null) return false;
            if (data.otherBrokerMinFee === undefined || data.otherBrokerMinFee === null) return false;
        }
    }
    return true;
}, {
    message: 'Vui lòng nhập đầy đủ thông tin cho công ty chứng khoán khác (Tên, và % phí, Phí tối thiểu nếu bật tự động tính phí).',
    // Cân nhắc việc trỏ path đến một trường cụ thể hơn hoặc một path chung nếu lỗi phức tạp
    path: ['otherBrokerName'], // Hoặc một path chung hơn như 'brokerDetails' nếu có
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
    const t = useTranslations('Investments');
    const tStocks = useTranslations('Investments.stocks');

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
    const calculateFee = useCallback((price: number, quantity: number, brokerId: string | undefined, values: FormValues) => {
        if (price <= 0 || quantity <= 0) return 0;

        const currentBrokerId = brokerId ?? BROKERS[0].id; // Default brokerId

        let currentBroker: BrokerOption;
        if (currentBrokerId === 'other') {
            currentBroker = {
                id: 'other',
                name: values.otherBrokerName || 'Khác',
                feePercent: values.otherBrokerFeePercent ?? 0.15, // Sử dụng default từ defaultValues
                minFee: values.otherBrokerMinFee ?? 0,       // Sử dụng default từ defaultValues
            };
        } else {
            currentBroker = BROKERS.find(b => b.id === currentBrokerId) || BROKERS[0];
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
            if (form.getValues('autoFee') ?? true) {
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
            if (form.getValues('autoFee') ?? true) {
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
        if (form.getValues('autoFee') ?? true) {
            const price = form.getValues('price');
            const brokerId = form.getValues('broker');
            const fee = calculateFee(price, value, brokerId, form.getValues());
            form.setValue('fee', fee);
        }
    };

    // Xử lý khi chuyển đổi chế độ tự động tính phí
    const handleAutoFeeToggle = (checked: boolean | undefined) => {
        const isAutoFee = checked ?? true; // Default to true if undefined
        form.setValue('autoFee', isAutoFee);

        if (isAutoFee) {
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

        if (form.getValues('autoFee') ?? true) {
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

            const currentBrokerId = values.broker ?? BROKERS[0].id;
            let finalBrokerName = BROKERS.find(b => b.id === currentBrokerId)?.name ?? 'Không xác định';
            let feeDetailsForNotes = '';

            if (currentBrokerId === 'other') {
                if (!values.otherBrokerName || values.otherBrokerName.trim() === '') {
                    form.setError('otherBrokerName', { type: 'manual', message: 'Vui lòng nhập tên công ty chứng khoán.' });
                    setIsLoading(false);
                    return;
                }
                finalBrokerName = values.otherBrokerName.trim(); // otherBrokerName is required by refine if broker is 'other'
                if (values.autoFee ?? true) { // Default autoFee to true
                    // otherBrokerFeePercent and otherBrokerMinFee are required by refine if autoFee is true and broker is 'other'
                    feeDetailsForNotes = ` (% phí: ${values.otherBrokerFeePercent}, tối thiểu: ${values.otherBrokerMinFee} VND)`;
                } else {
                    feeDetailsForNotes = ' (Phí nhập thủ công)';
                }
            } else {
                const selectedBrokerInfo = BROKERS.find(b => b.id === currentBrokerId);
                if (selectedBrokerInfo) {
                    // finalBrokerName is already set above
                    feeDetailsForNotes = ` (% phí: ${selectedBrokerInfo.feePercent}, tối thiểu: ${selectedBrokerInfo.minFee} VND)`;
                }
            }

            // Chuẩn bị dữ liệu đầu tư
            const stockData = {
                symbol: values.symbol,
                price: values.price,
                quantity: values.quantity,
                purchaseDate: format(values.purchaseDate, 'yyyy-MM-dd'),
                fee: values.fee ?? 0, // Default fee to 0 if undefined
                broker: finalBrokerName, // finalBrokerName is now guaranteed to be a string
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
    const watchedFee = form.watch('fee');
    const totalWithFee = totalInvestment + (watchedFee ?? 0);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Card className="border-border dark:border-border bg-card dark:bg-card text-card-foreground dark:text-card-foreground">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl text-blue-800 dark:text-blue-300">{tStocks('addNewStock')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Mã cổ phiếu */}
                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium text-foreground dark:text-foreground-dark">{tStocks('stockSymbol')}</FormLabel>
                                    <FormControl>
                                        <StockAutoComplete
                                            onStockSelect={handleStockSelect}
                                            defaultValue={field.value}
                                            isLoading={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                        {tStocks('selectStockDescription')}
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
                                        <FormLabel className="font-medium text-foreground dark:text-foreground-dark">{tStocks('purchasePrice')}</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <CurrencyInput
                                                    placeholder="0"
                                                    value={field.value}
                                                    onChange={(value: number | undefined) => {
                                                        field.onChange(value);
                                                        if (value !== undefined && (form.getValues('autoFee') ?? true)) {
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
                                                            if (form.getValues('autoFee') ?? true) {
                                                                const quantity = form.getValues('quantity');
                                                                const brokerId = form.getValues('broker');
                                                                const fee = calculateFee(currentStockPrice, quantity, brokerId, form.getValues());
                                                                form.setValue('fee', fee);
                                                            }
                                                        }}
                                                    >
                                                        {tStocks('useCurrentPrice')}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                            {tStocks('purchasePriceDescription')}
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
                                        <FormLabel className="font-medium text-foreground dark:text-foreground-dark">{tStocks('stockQuantity')}</FormLabel>
                                        <FormControl>
                                            <CurrencyInput
                                                placeholder="100"
                                                value={field.value}
                                                onChange={(value: number | undefined) => {
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
                                                    if (finalValue !== undefined && (form.getValues('autoFee') ?? true)) {
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
                                            {tStocks('stockQuantityDescription')}
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
                                        <FormLabel className="font-medium text-foreground dark:text-foreground-dark">{tStocks('brokerage')}</FormLabel>
                                        <Select
                                            value={field.value ?? BROKERS[0].id}
                                            onValueChange={handleBrokerChange}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark">
                                                    <SelectValue placeholder={tStocks('selectBrokerage')} />
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
                                            {tStocks('brokerageDescription', {
                                                feePercent: selectedBroker.feePercent,
                                                minFee: selectedBroker.minFee.toLocaleString()
                                            })}
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
                                                <FormLabel className="font-medium text-foreground dark:text-foreground-dark">{tStocks('otherBrokerName')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={tStocks('enterBrokerName')} {...field} disabled={isLoading} className="bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {(form.watch('autoFee') ?? true) && (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="otherBrokerFeePercent"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium text-foreground dark:text-foreground-dark">{tStocks('brokerFeePercent')}</FormLabel>
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
                                                        <FormLabel className="font-medium text-foreground dark:text-foreground-dark">{tStocks('brokerMinFee')}</FormLabel>
                                                        <FormControl>
                                                            <CurrencyInput
                                                                placeholder="5000"
                                                                value={field.value}
                                                                onChange={field.onChange}
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
                                    {!(form.watch('autoFee') ?? true) && (
                                        <FormDescription className="col-span-1 md:col-span-2 text-sm text-muted-foreground dark:text-muted-foreground-dark">
                                            {t('validation.manualFeeSelected')}
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
                                        <FormLabel className="font-medium text-foreground dark:text-foreground-dark">{tStocks('purchaseDate')}</FormLabel>
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
                                                            <span>{t('validation.selectDate')}</span>
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
                                            {tStocks('purchaseDateDescription')}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Phí giao dịch */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <FormLabel className="font-medium text-foreground dark:text-foreground-dark">{tStocks('transactionFee')}</FormLabel>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <span className="text-muted-foreground dark:text-muted-foreground-dark">{tStocks('feeToggleManual')}</span>
                                        <FormField
                                            control={form.control}
                                            name="autoFee"
                                            render={({ field }) => (
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value ?? true}
                                                        onCheckedChange={handleAutoFeeToggle}
                                                        disabled={isLoading}
                                                        className="data-[state=checked]:bg-primary dark:data-[state=checked]:bg-primary-dark data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input-dark"
                                                    />
                                                </FormControl>
                                            )}
                                        />
                                        <span className="text-muted-foreground dark:text-muted-foreground-dark">{tStocks('feeToggleAuto')}</span>
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
                                                    value={field.value ?? 0}
                                                    onChange={field.onChange}
                                                    onBlur={field.onBlur}
                                                    disabled={isLoading || (form.getValues('autoFee') ?? true)}
                                                    className={cn((form.getValues('autoFee') ?? true) ? "bg-gray-100 dark:bg-gray-700 text-right" : "bg-input dark:bg-input-dark text-right", "text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark")}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                                {(form.getValues('autoFee') ?? true)
                                                    ? tStocks('feeAutoDescription', {
                                                        feePercent: (form.watch('broker') ?? BROKERS[0].id) === 'other' ? (form.getValues('otherBrokerFeePercent') ?? 0.15) : selectedBroker.feePercent,
                                                        minFee: ((form.watch('broker') ?? BROKERS[0].id) === 'other' ? (form.getValues('otherBrokerMinFee') ?? 0) : selectedBroker.minFee).toLocaleString()
                                                    })
                                                    : t('validation.brokerageAndOtherFees')}
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
                                <div className="font-medium text-gray-700 dark:text-gray-200">{tStocks('stockValueSummary')}</div>
                                <div className="text-xl font-bold text-blue-800 dark:text-blue-300">
                                    {totalInvestment.toLocaleString('vi-VN')} VND
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <div className="text-gray-600 dark:text-gray-300">{tStocks('transactionFeeSummary')}</div>
                                <div className="font-medium text-gray-700 dark:text-gray-200">
                                    + {(form.watch('fee') ?? 0).toLocaleString('vi-VN')} VND
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-gray-700">
                                <div className="font-medium text-gray-700 dark:text-gray-200">{tStocks('totalInvestmentCost')}</div>
                                <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                                    {totalWithFee.toLocaleString('vi-VN')} VND
                                </div>
                            </div>

                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center">
                                <Info className="h-3 w-3 mr-1" />
                                {tStocks('includingFees')}
                            </div>
                        </div>

                        {/* Ghi chú */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium text-foreground dark:text-foreground-dark">{tStocks('investmentNotes')}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={tStocks('investmentNotesPlaceholder')}
                                            className="resize-none bg-input dark:bg-input-dark text-foreground dark:text-foreground-dark placeholder:text-muted-foreground dark:placeholder:text-muted-foreground-dark"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-muted-foreground dark:text-muted-foreground-dark">
                                        {tStocks('investmentNotesDescription')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 pt-0">
                        {onCancel && (
                            <Button variant="outline" onClick={onCancel} disabled={isLoading} className="bg-transparent hover:bg-accent dark:hover:bg-accent-dark text-foreground dark:text-foreground-dark border-border dark:border-border-dark">
                                {t('cancel')}
                            </Button>
                        )}
                        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 dark:bg-primary-dark dark:hover:bg-primary-dark/90 text-primary-foreground dark:text-primary-foreground-dark">
                            {isLoading ? t('adding') : tStocks('saveInvestment')}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}
