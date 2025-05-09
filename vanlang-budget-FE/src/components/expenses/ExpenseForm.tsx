'use client'

import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NumberInput } from '@/components/ui/NumberInput'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/Form'
import { MapPin, Loader2, AlertCircle, CheckCircle2, X, Search } from 'lucide-react'
import { LocationAutocomplete } from '@/components/ui/LocationAutocomplete'

const expenseSchema = z.object({
    amount: z.number().min(1000, {
        message: 'Số tiền phải lớn hơn 1,000đ'
    }).max(10000000000, {
        message: 'Số tiền tối đa là 10 tỷ'
    }),
    description: z.string().min(1, {
        message: 'Mô tả là bắt buộc'
    }),
    category: z.string().min(1, {
        message: 'Danh mục là bắt buộc'
    }),
    customCategory: z.string().optional(),
    date: z.string().min(1, {
        message: 'Ngày là bắt buộc'
    }),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().min(1, {
            message: 'Địa chỉ không được để trống'
        })
    }).optional(),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
    initialData?: Partial<ExpenseFormData>
    onSubmit: (data: ExpenseFormData) => Promise<void>
    isSubmitting?: boolean
}

export function ExpenseForm({ initialData, onSubmit, isSubmitting }: ExpenseFormProps) {
    const t = useTranslations();
    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);

    const expenseCategories = [
        { value: 'FOOD', label: t('expense.category.food') },
        { value: 'TRANSPORT', label: t('expense.category.transport') },
        { value: 'SHOPPING', label: t('expense.category.shopping') },
        { value: 'ENTERTAINMENT', label: t('expense.category.entertainment') },
        { value: 'BILLS', label: t('expense.category.bills') },
        { value: 'HEALTH', label: t('expense.category.health') },
        { value: 'EDUCATION', label: t('expense.category.education') },
        { value: 'OTHER', label: t('expense.category.other') },
    ]

    const form = useForm<ExpenseFormData>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            amount: initialData?.amount || 0,
            description: initialData?.description || '',
            category: initialData?.category || undefined,
            date: initialData?.date || new Date().toISOString().split('T')[0],
            location: initialData?.location || undefined,
        },
    });

    // Cập nhật form khi initialData thay đổi
    useEffect(() => {
        if (initialData) {
            console.log('ExpenseForm initialData:', initialData);
            console.log('ExpenseForm date format:', initialData.date);

            Object.keys(initialData).forEach((key) => {
                // @ts-ignore
                form.setValue(key as any, initialData[key]);
            });
        }
    }, [initialData, form]);

    const watchCategory = form.watch("category");

    // Khi category thay đổi, cập nhật trạng thái hiển thị trường nhập danh mục tùy chỉnh
    useEffect(() => {
        if (watchCategory === 'OTHER') {
            setShowCustomCategory(true);
        } else {
            setShowCustomCategory(false);
            // Reset giá trị customCategory khi không chọn "Khác"
            form.setValue('customCategory', '');
        }
    }, [watchCategory, form]);

    // Xác định trạng thái của vị trí
    const locationStatus = useMemo(() => {
        const location = form.watch('location');
        if (!location) return 'empty';

        const address = location.address || '';

        if (address === t('expense.locationLoading')) return 'loading';
        if (address === t('expense.locationError') ||
            address === t('expense.locationPermissionDenied') ||
            address === t('expense.locationUnavailable') ||
            address === t('expense.locationTimeout') ||
            address === t('expense.locationNotSupported')) return 'error';

        // Nếu có địa chỉ hợp lệ (dù nhập tay hay từ GPS), trả về success
        if (address.trim().length > 0) return 'success';

        return 'empty';
    }, [form.watch('location'), t]);

    // Hàm để xóa vị trí
    const handleClearLocation = () => {
        form.setValue('location', undefined);
    };

    const handleSubmit = async (data: ExpenseFormData) => {
        try {
            // Log dữ liệu trước khi gửi để kiểm tra
            console.log('Submitting expense data:', data);

            // Đảm bảo tất cả các trường cần thiết luôn được gửi đi
            let completeData = { ...data };

            // Nếu đang cập nhật (có initialData), giữ lại các trường không thay đổi
            if (initialData && Object.keys(initialData).length > 0) {
                completeData = {
                    // Lấy dữ liệu từ initialData
                    ...initialData,
                    // Ghi đè với dữ liệu mới
                    ...data
                };

                // Bỏ các trường không cần thiết khi gửi lên API
                delete (completeData as any).id;
                delete (completeData as any).userId;
                delete (completeData as any).createdAt;
                delete (completeData as any).updatedAt;
            }

            // Đảm bảo location luôn có đúng định dạng
            if (completeData.location && typeof completeData.location.address === 'string') {
                completeData.location = {
                    ...completeData.location,
                    lat: completeData.location.lat || 0,
                    lng: completeData.location.lng || 0,
                    address: completeData.location.address.trim()
                };
            }

            console.log('Sending complete data:', completeData);
            await onSubmit(completeData);

            if (!initialData) {
                form.reset({
                    amount: 0,
                    description: '',
                    category: undefined,
                    date: new Date().toISOString().split('T')[0],
                    location: undefined,
                });
            }
        } catch (error) {
            console.error('Submit error:', error);
        }
    }

    const handleGetLocation = () => {
        if ('geolocation' in navigator) {
            // Set loading state
            setIsLoadingLocation(true);

            // Hiển thị loading trong form
            form.setValue('location', {
                lat: 0,
                lng: 0,
                address: t('expense.locationLoading')
            });

            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi`
                    )

                    if (!response.ok) {
                        throw new Error(t('expense.locationError'));
                    }

                    const data = await response.json()

                    // Tạo địa chỉ định dạng dễ đọc
                    const addressParts = [];

                    // Tối ưu địa chỉ cho Việt Nam
                    if (data.address) {
                        // Thêm tên địa điểm nếu có
                        const placeName = data.address.shop || data.address.amenity ||
                            data.address.building || data.address.office ||
                            data.address.tourism || data.address.leisure;
                        if (placeName) {
                            addressParts.push(placeName);
                        }

                        // Số nhà và tên đường
                        const houseNumber = data.address.house_number || '';
                        const road = data.address.road || '';
                        if (houseNumber && road) {
                            addressParts.push(`${houseNumber} ${road}`);
                        } else if (road) {
                            addressParts.push(road);
                        }

                        // Phường/Xã
                        const suburb = data.address.suburb || data.address.quarter || '';
                        if (suburb) {
                            addressParts.push(`${data.address.village ? 'Xã' : 'Phường'} ${suburb}`);
                        }

                        // Quận/Huyện
                        const district = data.address.county || data.address.district || data.address.town || '';
                        if (district) {
                            addressParts.push(`${data.address.city ? 'Quận' : 'Huyện'} ${district}`);
                        }

                        // Thành phố/Tỉnh
                        const city = data.address.city || data.address.state || '';
                        if (city) {
                            addressParts.push(city);
                        }
                    }

                    // Nếu không có thông tin địa chỉ chi tiết, sử dụng display_name mặc định
                    const formattedAddress = addressParts.length > 0
                        ? addressParts.join(', ')
                        : data.display_name;

                    console.log('Địa chỉ đã định dạng:', formattedAddress);

                    form.setValue('location', {
                        lat: latitude,
                        lng: longitude,
                        address: formattedAddress,
                    });
                } catch (error) {
                    console.error('Geocoding error:', error);
                    // Đặt địa chỉ là thông báo lỗi nếu có lỗi xảy ra
                    form.setValue('location', {
                        lat: latitude,
                        lng: longitude,
                        address: t('expense.locationError'),
                    });
                } finally {
                    setIsLoadingLocation(false);
                }
            }, (error) => {
                // Xử lý khi người dùng từ chối cấp quyền hoặc có lỗi vị trí
                console.error('Geolocation error:', error);
                let errorMessage = t('expense.locationPermissionDenied');

                if (error.code === 2) {
                    errorMessage = t('expense.locationUnavailable');
                } else if (error.code === 3) {
                    errorMessage = t('expense.locationTimeout');
                }

                form.setValue('location', {
                    lat: 0,
                    lng: 0,
                    address: errorMessage,
                });
                setIsLoadingLocation(false);
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        } else {
            // Trình duyệt không hỗ trợ geolocation
            form.setValue('location', {
                lat: 0,
                lng: 0,
                address: t('expense.locationNotSupported')
            });
            setIsLoadingLocation(false);
        }
    }

    // Hàm để geocode địa chỉ nhập tay
    const handleGeocodeAddress = async (address: string) => {
        if (!address) return;
        setIsGeocodingAddress(true);

        try {
            const encodedAddress = encodeURIComponent(address);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&accept-language=vi`
            );

            if (!response.ok) {
                throw new Error(t('expense.geocodingError'));
            }

            const data = await response.json();
            if (data && data.length > 0) {
                const result = data[0];
                form.setValue('location', {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                    address: address
                });
                return true;
            } else {
                // Không tìm thấy kết quả, giữ nguyên địa chỉ với tọa độ 0,0
                form.setValue('location', {
                    lat: 0,
                    lng: 0,
                    address: address
                });
                return false;
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            // Giữ nguyên địa chỉ với tọa độ 0,0
            form.setValue('location', {
                lat: 0,
                lng: 0,
                address: address
            });
            return false;
        } finally {
            setIsGeocodingAddress(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('expense.amount')}</FormLabel>
                                <FormControl>
                                    <NumberInput
                                        placeholder={t('expense.enterAmount')}
                                        currency="đ"
                                        initialValue={field.value}
                                        onChange={field.onChange}
                                        allowClear={true}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('common.date')}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('common.description')}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t('expense.enterDescription')}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('common.category')}</FormLabel>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('expense.selectCategory')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {expenseCategories.map((category) => (
                                            <SelectItem
                                                key={category.value}
                                                value={category.value}
                                            >
                                                {category.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {showCustomCategory && (
                        <FormField
                            control={form.control}
                            name="customCategory"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('expense.customCategory')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('expense.enterCustomCategory')}
                                            {...field}
                                            autoFocus
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>{t('expense.location')}</FormLabel>
                            <div className="flex flex-col space-y-2">
                                <div className="relative flex-1">
                                    <FormControl>
                                        <LocationAutocomplete
                                            value={field.value?.address || ''}
                                            onChange={(address, lat, lng) => {
                                                if (address) {
                                                    field.onChange({
                                                        lat: lat || 0,
                                                        lng: lng || 0,
                                                        address: address
                                                    });
                                                } else {
                                                    field.onChange(undefined);
                                                }
                                            }}
                                            onClear={handleClearLocation}
                                            placeholder={t('expense.enterLocation')}
                                            disabled={isLoadingLocation || isGeocodingAddress}
                                            loading={isLoadingLocation || isGeocodingAddress}
                                            className={`${locationStatus === 'loading' ? 'animate-pulse text-gray-400' :
                                                locationStatus === 'error' ? 'text-red-500 border-red-300' :
                                                    locationStatus === 'success' ? 'text-green-700 border-green-300' :
                                                        ''}`}
                                        />
                                    </FormControl>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2">
                                    <p className={`text-xs ${locationStatus === 'error' ? 'text-red-500' :
                                        locationStatus === 'success' ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                        {locationStatus === 'error' ? field.value?.address :
                                            locationStatus === 'success' && field.value?.lat !== 0 && field.value?.lng !== 0 ?
                                                t('expense.usingGpsLocation') :
                                                locationStatus === 'success' ? t('expense.usingManualLocation') :
                                                    t('expense.locationHint')}
                                    </p>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGetLocation}
                                        title={t('expense.getCurrentLocation')}
                                        disabled={isLoadingLocation || isGeocodingAddress}
                                        className="flex items-center flex-1 sm:flex-initial justify-center"
                                    >
                                        {isLoadingLocation ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                        ) : (
                                            <MapPin className="w-4 h-4 mr-1" />
                                        )}
                                        {t('expense.useGpsLocation')}
                                    </Button>
                                </div>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        className="w-full sm:w-auto"
                    >
                        {initialData ? t('expense.edit') : t('expense.add')}
                    </Button>
                </div>
            </form>
        </Form>
    )
} 