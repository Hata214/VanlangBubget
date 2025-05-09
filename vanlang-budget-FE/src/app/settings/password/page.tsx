'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { changePassword } from '@/redux/features/authSlice'
import MainLayout from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/Form'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'

const passwordSchema = z.object({
    currentPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export default function PasswordPage() {
    const dispatch = useAppDispatch()
    const { isLoading, error } = useAppSelector((state) => state.auth)
    const [showSuccess, setShowSuccess] = useState(false)

    const form = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (data: PasswordFormData) => {
        try {
            await dispatch(changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            })).unwrap()
            setShowSuccess(true)
            form.reset()
        } catch (error) {
            console.error('Change password error:', error)
        }
    }

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto py-6">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Link href="/settings">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Đổi mật khẩu</h1>
                            <p className="mt-2 text-gray-500">
                                Cập nhật mật khẩu đăng nhập của bạn
                            </p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Thay đổi mật khẩu</CardTitle>
                            <CardDescription>
                                Đảm bảo mật khẩu mới của bạn đủ mạnh và khác với mật khẩu cũ
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    {showSuccess && (
                                        <Alert
                                            variant="success"
                                            message="Đổi mật khẩu thành công"
                                            onClose={() => setShowSuccess(false)}
                                        />
                                    )}

                                    {error && (
                                        <Alert
                                            variant="error"
                                            message={error}
                                        />
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mật khẩu hiện tại</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Nhập mật khẩu hiện tại"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mật khẩu mới</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Nhập mật khẩu mới"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Nhập lại mật khẩu mới"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            isLoading={isLoading}
                                        >
                                            Đổi mật khẩu
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    )
} 