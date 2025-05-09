import Joi from 'joi';

/**
 * Validation schema for user registration
 */
export const registerSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'string.empty': 'Email không được để trống',
            'any.required': 'Email là bắt buộc'
        }),

    password: Joi.string()
        .min(8)
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
        .messages({
            'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
            'string.empty': 'Mật khẩu không được để trống',
            'string.pattern.base': 'Mật khẩu phải có ít nhất một chữ thường, một chữ hoa và một số',
            'any.required': 'Mật khẩu là bắt buộc'
        }),

    name: Joi.string()
        .required()
        .messages({
            'string.empty': 'Họ và tên không được để trống',
            'any.required': 'Họ và tên là bắt buộc'
        }),

    phoneNumber: Joi.string()
        .pattern(new RegExp('^[0-9]{10,11}$'))
        .allow('')
        .messages({
            'string.pattern.base': 'Số điện thoại phải có 10-11 số'
        }),

    locale: Joi.string()
        .valid('vi', 'en')
        .allow('')
        .default('vi')
        .messages({
            'string.valid': 'Ngôn ngữ chỉ chấp nhận các giá trị: vi, en'
        })
});

/**
 * Validation schema for user login
 */
export const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'string.empty': 'Email không được để trống',
            'any.required': 'Email là bắt buộc'
        }),

    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Mật khẩu không được để trống',
            'any.required': 'Mật khẩu là bắt buộc'
        })
});

/**
 * Validation schema for update user information
 */
export const updateUserSchema = Joi.object({
    firstName: Joi.string()
        .messages({
            'string.empty': 'Tên không được để trống'
        }),

    lastName: Joi.string()
        .messages({
            'string.empty': 'Họ không được để trống'
        }),

    phoneNumber: Joi.string()
        .pattern(new RegExp('^[0-9]{10,11}$'))
        .allow('')
        .messages({
            'string.pattern.base': 'Số điện thoại phải có 10-11 số'
        })
}).min(1).messages({
    'object.min': 'Ít nhất một trường dữ liệu phải được cập nhật'
});

/**
 * Validation schema for updating password
 */
export const updatePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'string.empty': 'Mật khẩu hiện tại không được để trống',
            'any.required': 'Mật khẩu hiện tại là bắt buộc'
        }),

    newPassword: Joi.string()
        .min(8)
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
        .messages({
            'string.min': 'Mật khẩu mới phải có ít nhất {#limit} ký tự',
            'string.empty': 'Mật khẩu mới không được để trống',
            'string.pattern.base': 'Mật khẩu mới phải có ít nhất một chữ thường, một chữ hoa và một số',
            'any.required': 'Mật khẩu mới là bắt buộc'
        }),

    passwordConfirm: Joi.string()
        .required()
        .valid(Joi.ref('newPassword'))
        .messages({
            'string.empty': 'Xác nhận mật khẩu không được để trống',
            'any.only': 'Xác nhận mật khẩu không khớp với mật khẩu mới',
            'any.required': 'Xác nhận mật khẩu là bắt buộc'
        })
});

/**
 * Validation schema for forgot password
 */
export const forgotPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'string.empty': 'Email không được để trống',
            'any.required': 'Email là bắt buộc'
        })
});

/**
 * Validation schema for reset password
 */
export const resetPasswordSchema = Joi.object({
    password: Joi.string()
        .min(8)
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
        .messages({
            'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự',
            'string.empty': 'Mật khẩu không được để trống',
            'string.pattern.base': 'Mật khẩu phải có ít nhất một chữ thường, một chữ hoa và một số',
            'any.required': 'Mật khẩu là bắt buộc'
        }),

    passwordConfirm: Joi.string()
        .required()
        .valid(Joi.ref('password'))
        .messages({
            'string.empty': 'Xác nhận mật khẩu không được để trống',
            'any.only': 'Xác nhận mật khẩu không khớp với mật khẩu',
            'any.required': 'Xác nhận mật khẩu là bắt buộc'
        })
});

/**
 * Schema kiểm tra refresh token
 */
export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
        'string.empty': 'Refresh token không được để trống',
        'any.required': 'Refresh token là bắt buộc'
    })
});

/**
 * Validation schema for email only
 */
export const emailSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'string.empty': 'Email không được để trống',
            'any.required': 'Email là bắt buộc'
        })
});

/**
 * Validation schema for OTP verification
 */
export const verifyOTPSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'string.empty': 'Email không được để trống',
            'any.required': 'Email là bắt buộc'
        }),

    otp: Joi.string()
        .required()
        .length(6)
        .pattern(/^[0-9]+$/)
        .messages({
            'string.empty': 'Mã OTP không được để trống',
            'string.length': 'Mã OTP phải có đúng 6 chữ số',
            'string.pattern.base': 'Mã OTP phải là chữ số',
            'any.required': 'Mã OTP là bắt buộc'
        }),

    locale: Joi.string()
        .valid('vi', 'en')
        .allow('')
        .default('vi')
        .messages({
            'string.valid': 'Ngôn ngữ chỉ chấp nhận các giá trị: vi, en'
        })
});

/**
 * Validation schema for resend OTP
 */
export const resendOTPSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'string.empty': 'Email không được để trống',
            'any.required': 'Email là bắt buộc'
        }),

    locale: Joi.string()
        .valid('vi', 'en')
        .allow('')
        .default('vi')
        .messages({
            'string.valid': 'Ngôn ngữ chỉ chấp nhận các giá trị: vi, en'
        })
});

/**
 * Validation schema for resend verification email
 */
export const resendVerificationSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'string.empty': 'Email không được để trống',
            'any.required': 'Email là bắt buộc'
        }),

    locale: Joi.string()
        .valid('vi', 'en')
        .allow('')
        .default('vi')
        .messages({
            'string.valid': 'Ngôn ngữ chỉ chấp nhận các giá trị: vi, en'
        })
}); 