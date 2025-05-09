'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
    { id: 'other', name: 'Khác', feePercent: 0.15, minFee: 10000 },
];

// Schema xác thực form
const formSchema = z.object({
    symbol: z.string().min(1, 'Vui lòng chọn mã cổ phiếu'),
    price: z.coerce.number()
        .min(1, 'Giá mua phải lớn hơn 0')
        .max(1000000000, 'Giá quá lớn'),
    quantity: z.coerce.number()
        .min(100, 'Số lượng phải từ 100 cổ phiếu trở lên')
        .max(1000000, 'Số lượng quá lớn')
        .refine(val => val % 100 === 0, { message: 'Số lượng phải là bội số của 100' }),
    purchaseDate: z.date({
        required_error: 'Vui lòng chọn ngày mua',
    }),
    fee: z.coerce.number()
        .min(0, 'Phí không được âm')
        .default(0),
    broker: z.string().default(BROKERS[0].id),
    autoFee: z.boolean().default(true),
    notes: z.string().max(500, 'Ghi chú không quá 500 ký tự').optional(),
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
    const calculateFee = useCallback((price: number, quantity: number, broker: BrokerOption) => {
        if (price <= 0 || quantity <= 0) return 0;

        const totalValue = price * quantity;
        let fee = totalValue * (broker.feePercent / 100);

        // Áp dụng phí tối thiểu
        if (fee < broker.minFee) {
            fee = broker.minFee;
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
                const broker = BROKERS.find(b => b.id === form.getValues('broker')) || BROKERS[0];
                const fee = calculateFee(price, quantity, broker);
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
                const broker = BROKERS.find(b => b.id === form.getValues('broker')) || BROKERS[0];
                const fee = calculateFee(numValue, quantity, broker);
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
            const broker = BROKERS.find(b => b.id === form.getValues('broker')) || BROKERS[0];
            const fee = calculateFee(price, value, broker);
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
            const broker = BROKERS.find(b => b.id === form.getValues('broker')) || BROKERS[0];
            const fee = calculateFee(price, quantity, broker);
            form.setValue('fee', fee);
        }
    };

    // Xử lý khi chọn công ty chứng khoán
    const handleBrokerChange = (brokerId: string) => {
        const broker = BROKERS.find(b => b.id === brokerId) || BROKERS[0];
        setSelectedBroker(broker);
        form.setValue('broker', brokerId);

        // Cập nhật phí nếu chế độ tự động được bật
        if (form.getValues('autoFee')) {
            const price = form.getValues('price');
            const quantity = form.getValues('quantity');
            const fee = calculateFee(price, quantity, broker);
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

            // Chuẩn bị dữ liệu đầu tư
            const stockData = {
                symbol: values.symbol,
                price: values.price,
                quantity: values.quantity,
                purchaseDate: format(values.purchaseDate, 'yyyy-MM-dd'),
                fee: values.fee || 0,
                broker: values.broker,
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
                <Card className="border-blue-100 bg-blue-50/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl text-blue-800">Thêm đầu tư cổ phiếu mới</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Mã cổ phiếu */}
                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-medium">Mã cổ phiếu</FormLabel>
                                    <FormControl>
                                        <StockAutoComplete
                                            onStockSelect={handleStockSelect}
                                            defaultValue={field.value}
                                            isLoading={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription>
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
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel className="font-medium">Giá mua (VND)</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={formattedPrice}
                                                    onChange={handlePriceChange}
                                                    placeholder="0"
                                                    disabled={isLoading}
                                                    className="pr-40 text-lg h-14 font-medium"
                                                />
                                            </FormControl>
                                            <div className="absolute right-1 top-1 flex space-x-1">
                                                {currentStockPrice && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-12 text-xs"
                                                        onClick={() => {
                                                            form.setValue('price', currentStockPrice);
                                                            setFormattedPrice(currentStockPrice.toLocaleString('vi-VN'));

                                                            // Cập nhật phí nếu cần
                                                            if (form.getValues('autoFee')) {
                                                                const quantity = form.getValues('quantity');
                                                                const broker = BROKERS.find(b => b.id === form.getValues('broker')) || BROKERS[0];
                                                                const fee = calculateFee(currentStockPrice, quantity, broker);
                                                                form.setValue('fee', fee);
                                                            }
                                                        }}
                                                    >
                                                        Dùng giá hiện tại
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <FormDescription>
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
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-medium">Số lượng</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="100"
                                                step="100"
                                                placeholder="100"
                                                onChange={handleQuantityChange}
                                                value={field.value || ''}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormDescription>
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
                                        <FormLabel className="font-medium">Công ty chứng khoán</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={handleBrokerChange}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn công ty chứng khoán" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {BROKERS.map((broker) => (
                                                    <SelectItem key={broker.id} value={broker.id}>
                                                        {broker.name} ({broker.feePercent}%)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Phí giao dịch: {selectedBroker.feePercent}%, tối thiểu {selectedBroker.minFee.toLocaleString()} VND
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Ngày mua */}
                            <FormField
                                control={form.control}
                                name="purchaseDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="font-medium">Ngày mua</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10",
                                                            !field.value && "text-muted-foreground"
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
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date > new Date()}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            Ngày thực hiện giao dịch mua
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Phí giao dịch */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <FormLabel className="font-medium">Phí giao dịch (VND)</FormLabel>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <span className="text-muted-foreground">Thủ công</span>
                                        <FormField
                                            control={form.control}
                                            name="autoFee"
                                            render={({ field }) => (
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={handleAutoFeeToggle}
                                                        disabled={isLoading}
                                                    />
                                                </FormControl>
                                            )}
                                        />
                                        <span className="text-muted-foreground">Tự động</span>
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="fee"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    {...field}
                                                    disabled={isLoading || form.getValues('autoFee')}
                                                    className={form.getValues('autoFee') ? "bg-gray-50" : ""}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {form.getValues('autoFee')
                                                    ? `Phí tự động: ${(selectedBroker.feePercent)}% giá trị giao dịch`
                                                    : "Phí môi giới và các chi phí khác"}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Tổng giá trị đầu tư */}
                        <div className="bg-blue-100 p-4 rounded-md space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="font-medium">Tổng giá trị cổ phiếu:</div>
                                <div className="text-xl font-bold text-blue-800">
                                    {totalInvestment.toLocaleString('vi-VN')} VND
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <div>Phí giao dịch:</div>
                                <div className="font-medium">
                                    + {form.watch('fee').toLocaleString('vi-VN')} VND
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                <div className="font-medium">Tổng chi phí đầu tư:</div>
                                <div className="text-2xl font-bold text-blue-900">
                                    {totalWithFee.toLocaleString('vi-VN')} VND
                                </div>
                            </div>

                            <div className="text-xs text-blue-600 mt-1 flex items-center">
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
                                    <FormLabel className="font-medium">Ghi chú</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ghi chú về khoản đầu tư này..."
                                            className="resize-none"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Thêm bất kỳ ghi chú nào về quyết định đầu tư của bạn
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 pt-0">
                        {onCancel && (
                            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                                Hủy
                            </Button>
                        )}
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Đang lưu...' : 'Lưu đầu tư'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
} 