import React from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials, setLoading, setError } from '../../redux/features/authSlice';
import { authService } from '../../services/authService';

interface RegisterFormInputs {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const RegisterForm: React.FC = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormInputs>();
    const router = useRouter();
    const password = watch("password");
    const dispatch = useDispatch();

    const onSubmit = async (data: RegisterFormInputs) => {
        try {
            dispatch(setLoading(true));
            const { confirmPassword, ...registerData } = data;
            const response = await authService.register(registerData);
            dispatch(setCredentials(response));
            dispatch(setLoading(false));
            router.push('/');
        } catch (error: any) {
            dispatch(setError(error.response?.data?.message || 'Đăng ký thất bại'));
            dispatch(setLoading(false));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div className="rounded-md shadow-sm space-y-4">
                <div>
                    <label htmlFor="name" className="sr-only">Họ và tên</label>
                    <input
                        {...register("name", {
                            required: "Họ và tên là bắt buộc",
                            minLength: {
                                value: 2,
                                message: "Họ và tên phải có ít nhất 2 ký tự"
                            }
                        })}
                        type="text"
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                        placeholder="Họ và tên"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

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
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
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
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                        placeholder="Mật khẩu"
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="sr-only">Xác nhận mật khẩu</label>
                    <input
                        {...register("confirmPassword", {
                            required: "Xác nhận mật khẩu là bắt buộc",
                            validate: value =>
                                value === password || "Mật khẩu xác nhận không khớp"
                        })}
                        type="password"
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                        placeholder="Xác nhận mật khẩu"
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    Đăng ký
                </button>
            </div>
        </form>
    );
};

export default RegisterForm; 