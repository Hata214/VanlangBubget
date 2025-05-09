import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { setCredentials, setLoading, setError } from '../../redux/features/authSlice';
import { authService } from '../../services/authService';

interface LoginFormInputs {
    email: string;
    password: string;
}

const LoginForm: React.FC = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
    const router = useRouter();
    const dispatch = useDispatch();
    const [loginError, setLoginError] = useState<string | null>(null);

    const onSubmit = async (data: LoginFormInputs) => {
        try {
            setLoginError(null);
            dispatch(setLoading(true));
            console.log('Attempting login with:', data.email); // Debug log
            const response = await authService.login(data.email, data.password);
            console.log('Login response:', response); // Debug log

            // Chuẩn hóa response từ API, dùng type assertion để tránh lỗi TypeScript
            const normalizedResponse = {
                ...response,
                user: {
                    _id: response.user.id,
                    email: response.user.email,
                    firstName: response.user.firstName || '',
                    lastName: response.user.lastName || '',
                    role: 'user',
                    isEmailVerified: false
                }
            };

            dispatch(setCredentials(normalizedResponse as any));
            dispatch(setLoading(false));
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
            setLoginError(errorMessage);
            dispatch(setError(errorMessage));
            dispatch(setLoading(false));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            {loginError && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{loginError}</h3>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-md shadow-sm -space-y-px">
                <div>
                    <label htmlFor="email" className="sr-only">Email</label>
                    <input
                        {...register("email", {
                            required: "Email là bắt buộc",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Email không hợp lệ"
                            }
                        })}
                        type="email"
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                        placeholder="Email"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                    <label htmlFor="password" className="sr-only">Mật khẩu</label>
                    <input
                        {...register("password", {
                            required: "Mật khẩu là bắt buộc",
                            minLength: {
                                value: 6,
                                message: "Mật khẩu phải có ít nhất 6 ký tự"
                            }
                        })}
                        type="password"
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                        placeholder="Mật khẩu"
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>
            </div>

            <div>
                <Link
                    href="/login"
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    Đăng nhập
                </Link>
            </div>
        </form>
    );
};

export default LoginForm;
