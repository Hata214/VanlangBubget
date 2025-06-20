'use client';

import { useState } from 'react';
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
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ToastProvider';
import { StockAutoComplete } from './StockAutoComplete';
import { vi } from 'date-fns/locale';
import { addStockInvestment } from '@/services/investmentService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import axios from 'axios';

// Interface cho props
interface StockInvestFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

// Schema xác thực form đơn giản
const formSchema = z.object({
    symbol: z.string().min(1, 'Vui lòng chọn mã cổ phiếu'),
    price: z.coerce.number().min(1, 'Giá phải lớn hơn 0'),
    quantity: z.coerce.number().min(100, 'Số lượng tối thiểu là 100').refine(val => val % 100 === 0, { message: 'Số lượng phải là bội số của 100' }),
    broker: z.string().min(1, 'Vui lòng chọn công ty chứng khoán'),
    purchaseDate: z.date({ required_error: 'Vui lòng chọn ngày mua' }),
    fee: z.coerce.number().min(0, 'Phí giao dịch không được âm').optional(),
    notes: z.string().max(500, 'Ghi chú không được quá 500 ký tự').optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Hàm tính phí giao dịch dựa trên broker
const calculateFee = (totalValue: number, broker: string): number => {
    // Phí giao dịch theo từng công ty chứng khoán (thực tế 2024-2025)
    const feeStructure: { [key: string]: { rate: number; minFee: number } } = {
        'VNDirect (0.15%, tối thiểu 50.000đ)': { rate: 0.0015, minFee: 50000 },
        'SSI (từ 0.15%, tối thiểu 54.000đ)': { rate: 0.0015, minFee: 54000 },
        'TCBS (0.15%, tối thiểu 50.000đ)': { rate: 0.0015, minFee: 50000 },
        'VPS (từ 0.15%, tối thiểu 50.000đ)': { rate: 0.0015, minFee: 50000 },
        'HSC (từ 0.15%, tối thiểu 50.000đ)': { rate: 0.0015, minFee: 50000 },
        'MBS (từ 0.15%, tối thiểu 50.000đ)': { rate: 0.0015, minFee: 50000 },
    };

    const brokerInfo = feeStructure[broker];
    if (brokerInfo) {
        return Math.max(totalValue * brokerInfo.rate, brokerInfo.minFee);
    }

    // Mặc định cho trường hợp "Khác" hoặc không tìm thấy
    return Math.max(totalValue * 0.0015, 50000);
};

export function StockInvestForm({ onSuccess, onCancel }: StockInvestFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingPrice, setIsFetchingPrice] = useState(false);
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
            broker: 'VNDirect (0.15%, tối thiểu 50.000đ)',
            purchaseDate: new Date(),
            fee: 0,
            notes: '',
        },
    });

    // Xử lý khi chọn cổ phiếu
    const handleStockSelect = async (symbol: string) => {
        console.log('Đã chọn cổ phiếu:', symbol);
        form.setValue('symbol', symbol);

        // Tự động lấy giá hiện tại
        setIsFetchingPrice(true);
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_STOCK_API_URL || 'https://my-app-flashapi.onrender.com';
            const response = await axios.get(`${API_BASE_URL}/api/price?symbol=${symbol}`);

            if (response.data && response.data.price !== undefined && response.data.price !== null) {
                const price = response.data.price;
                form.setValue('price', price);
                console.log('Đã cập nhật giá:', price);

                // Tự động tính phí dựa trên broker (trừ khi chọn "Khác")
                const quantity = form.getValues('quantity');
                const broker = form.getValues('broker');
                if (broker !== 'Khác (Tự nhập phí)') {
                    const totalValue = price * quantity;
                    const fee = calculateFee(totalValue, broker);
                    form.setValue('fee', Math.round(fee));
                }
            } else {
                toast({
                    title: 'Lỗi',
                    description: 'Không thể lấy giá cổ phiếu',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Lỗi khi lấy giá cổ phiếu:', error);
            toast({
                title: 'Lỗi',
                description: 'Không thể lấy giá cổ phiếu',
                type: 'error'
            });
        } finally {
            setIsFetchingPrice(false);
        }
    };

    // Xử lý khi submit form
    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);

        try {
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

            // Gọi API thêm đầu tư cổ phiếu
            const result = await addStockInvestment(stockData);
            console.log('Kết quả API thêm đầu tư:', result);

            // Hiển thị thông báo thành công
            toast({
                title: 'Thành công',
                description: 'Đã thêm đầu tư cổ phiếu thành công',
                type: 'success'
            });

            if (onSuccess) {
                onSuccess();
            }

            // Reset form
            form.reset();
        } catch (error) {
            console.error('Lỗi khi lưu đầu tư:', error);

            let errorMessage = 'Có lỗi xảy ra khi thêm đầu tư';
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast({
                title: 'Lỗi',
                description: errorMessage,
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Tính tổng giá trị
    const totalInvestment = form.watch('price') * form.watch('quantity');
    const totalWithFee = totalInvestment + (form.watch('fee') || 0);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Card className="border-border dark:border-border bg-card dark:bg-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl text-blue-800 dark:text-blue-300">
                            Thêm đầu tư cổ phiếu mới
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Mã cổ phiếu */}
                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mã cổ phiếu</FormLabel>
                                    <FormControl>
                                        <StockAutoComplete
                                            onStockSelect={handleStockSelect}
                                            defaultValue={field.value}
                                            isLoading={isFetchingPrice}
                                        />
                                    </FormControl>
                                    {isFetchingPrice && (
                                        <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                            🔄 Đang lấy giá hiện tại...
                                        </div>
                                    )}
                                    {!field.value && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                            💡 Chọn mã cổ phiếu để tự động điền giá
                                        </div>
                                    )}
                                    <FormDescription>
                                        Chọn mã cổ phiếu bạn muốn đầu tư
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Giá mua */}
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giá mua (VND)</FormLabel>
                                        <FormControl>
                                            <CurrencyInput
                                                placeholder="0"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                disabled={isLoading || isFetchingPrice}
                                                className="text-right"
                                            />
                                        </FormControl>
                                        {field.value === 0 && !isFetchingPrice && (
                                            <div className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                                ⚠️ Vui lòng chọn mã cổ phiếu để tự động lấy giá
                                            </div>
                                        )}
                                        <FormDescription>
                                            Giá mua mỗi cổ phiếu
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Số lượng */}
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số lượng</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="100"
                                                placeholder="100"
                                                value={field.value}
                                                onChange={(e) => {
                                                    let value = parseInt(e.target.value, 10);
                                                    if (isNaN(value)) value = 0;

                                                    // Đảm bảo là bội số của 100
                                                    const roundedValue = Math.floor(value / 100) * 100;
                                                    const finalValue = roundedValue === 0 && value > 0 ? 100 : roundedValue;

                                                    field.onChange(finalValue);

                                                    // Tự động tính lại phí (trừ khi chọn "Khác")
                                                    const price = form.getValues('price');
                                                    const broker = form.getValues('broker');
                                                    if (price > 0 && broker !== 'Khác (Tự nhập phí)') {
                                                        const totalValue = price * finalValue;
                                                        const fee = calculateFee(totalValue, broker);
                                                        form.setValue('fee', Math.round(fee));
                                                    }
                                                }}
                                                onBlur={field.onBlur}
                                                disabled={isLoading || isFetchingPrice}
                                                className="text-right"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Số lượng cổ phiếu (phải là bội số của 100)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Công ty chứng khoán */}
                            <FormField
                                control={form.control}
                                name="broker"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Công ty chứng khoán</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                // Tự động tính lại phí khi thay đổi broker (trừ khi chọn "Khác")
                                                if (value !== 'Khác (Tự nhập phí)') {
                                                    const price = form.getValues('price');
                                                    const quantity = form.getValues('quantity');
                                                    if (price > 0 && quantity > 0) {
                                                        const totalValue = price * quantity;
                                                        const fee = calculateFee(totalValue, value);
                                                        form.setValue('fee', Math.round(fee));
                                                    }
                                                } else {
                                                    // Reset phí về 0 khi chọn "Khác" để người dùng tự nhập
                                                    form.setValue('fee', 0);
                                                }
                                            }}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn công ty chứng khoán..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="VNDirect (0.15%, tối thiểu 50.000đ)">VNDirect (0.15%, tối thiểu 50.000đ)</SelectItem>
                                                <SelectItem value="SSI (từ 0.15%, tối thiểu 54.000đ)">SSI (từ 0.15%, tối thiểu 54.000đ)</SelectItem>
                                                <SelectItem value="TCBS (0.15%, tối thiểu 50.000đ)">TCBS (0.15%, tối thiểu 50.000đ)</SelectItem>
                                                <SelectItem value="VPS (từ 0.15%, tối thiểu 50.000đ)">VPS (từ 0.15%, tối thiểu 50.000đ)</SelectItem>
                                                <SelectItem value="HSC (từ 0.15%, tối thiểu 50.000đ)">HSC (từ 0.15%, tối thiểu 50.000đ)</SelectItem>
                                                <SelectItem value="MBS (từ 0.15%, tối thiểu 50.000đ)">MBS (từ 0.15%, tối thiểu 50.000đ)</SelectItem>
                                                <SelectItem value="Khác (Tự nhập phí)">Khác (Tự nhập phí)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Phí giao dịch thực tế theo từng công ty chứng khoán
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Ngày mua */}
                            <FormField
                                control={form.control}
                                name="purchaseDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Ngày mua</FormLabel>
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
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date > new Date()}
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
                            <FormField
                                control={form.control}
                                name="fee"
                                render={({ field }) => {
                                    const selectedBroker = form.watch('broker');
                                    const isCustomFee = selectedBroker === 'Khác (Tự nhập phí)';

                                    return (
                                        <FormItem>
                                            <FormLabel>Phí giao dịch (VND)</FormLabel>
                                            <FormControl>
                                                <CurrencyInput
                                                    placeholder={isCustomFee ? "Nhập phí giao dịch..." : "0"}
                                                    value={field.value || 0}
                                                    onChange={field.onChange}
                                                    onBlur={field.onBlur}
                                                    disabled={isLoading || isFetchingPrice || !isCustomFee}
                                                    className={`text-right ${isCustomFee ? 'border-blue-300 focus:border-blue-500' : ''}`}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {isCustomFee
                                                    ? "Nhập phí giao dịch thực tế của bạn"
                                                    : "Phí giao dịch (tự động tính theo công ty chứng khoán)"
                                                }
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
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
                                    + {(form.watch('fee') || 0).toLocaleString('vi-VN')} VND
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-gray-700">
                                <div className="font-medium text-gray-700 dark:text-gray-200">Tổng chi phí đầu tư:</div>
                                <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                                    {totalWithFee.toLocaleString('vi-VN')} VND
                                </div>
                            </div>
                        </div>

                        {/* Chú thích về phí giao dịch */}
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                            <div className="flex items-start space-x-2">
                                <div className="text-amber-600 dark:text-amber-400 mt-0.5">ℹ️</div>
                                <div className="text-sm text-amber-800 dark:text-amber-200">
                                    <strong>Lưu ý về phí giao dịch:</strong> Mức phí hiển thị là phí cơ bản cho giao dịch online.
                                    Phí thực tế có thể thay đổi tùy thuộc vào giá trị giao dịch, loại tài khoản và chính sách ưu đãi.
                                    Vui lòng kiểm tra biểu phí chi tiết trên website của công ty chứng khoán.
                                </div>
                            </div>
                        </div>

                        {/* Ghi chú */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Thêm bất kỳ ghi chú nào về quyết định đầu tư của bạn"
                                            className="resize-none"
                                            {...field}
                                            disabled={isLoading || isFetchingPrice}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Ghi chú về lý do đầu tư, chiến lược, v.v.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 pt-0">
                        {onCancel && (
                            <Button variant="outline" onClick={onCancel} disabled={isLoading || isFetchingPrice}>
                                Hủy
                            </Button>
                        )}
                        <Button type="submit" disabled={isLoading || isFetchingPrice}>
                            {isLoading ? 'Đang lưu...' : 'Lưu đầu tư'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}
