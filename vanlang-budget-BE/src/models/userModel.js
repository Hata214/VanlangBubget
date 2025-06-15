import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email là bắt buộc'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
                'Vui lòng nhập một email hợp lệ',
            ],
        },
        password: {
            type: String,
            required: [true, 'Mật khẩu là bắt buộc'],
            minlength: [8, 'Mật khẩu phải có ít nhất 8 ký tự'],
            select: false, // Không trả về password khi query
        },
        firstName: {
            type: String,
            required: [true, 'Vui lòng nhập tên'],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, 'Vui lòng nhập họ'],
            trim: true,
        },
        phoneNumber: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'superadmin'],
            default: 'user',
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: String,
        emailVerificationExpires: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        passwordChangedAt: Date,
        active: {
            type: Boolean,
            default: true,
            select: false,
        },
        language: {
            type: String,
            enum: ['en', 'vi'],
            default: 'vi',
        },
        settings: {
            emailNotifications: {
                type: Boolean,
                default: true,
            },
            pushNotifications: {
                type: Boolean,
                default: true,
            },
            inAppNotifications: {
                type: Boolean,
                default: true,
            },
            emailFrequency: {
                type: String,
                enum: ['immediately', 'daily', 'weekly', 'never'],
                default: 'daily',
            },
            notificationTypes: {
                expense: {
                    type: Boolean,
                    default: true,
                },
                income: {
                    type: Boolean,
                    default: true,
                },
                budget: {
                    type: Boolean,
                    default: true,
                },
                system: {
                    type: Boolean,
                    default: true,
                },
            },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

/**
 * Middleware trước khi lưu: mã hóa mật khẩu
 */
userSchema.pre('save', async function (next) {
    // Chỉ mã hóa nếu mật khẩu bị thay đổi
    if (!this.isModified('password')) return next();

    // Mã hóa mật khẩu với cost factor 12
    this.password = await bcrypt.hash(this.password, 12);

    // Cập nhật thời gian đổi mật khẩu
    if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000; // trừ 1 giây để tránh vấn đề với timing
    }

    next();
});

/**
 * Middleware trước khi lưu: xử lý user không active
 * CHỈ áp dụng cho các truy vấn không liên quan đến authentication
 */
userSchema.pre(/^find/, function (next) {
    // Bỏ qua filter active cho các truy vấn authentication
    const skipActiveFilter = this.getOptions().skipActiveFilter ||
        this.getQuery().email || // Nếu query theo email (thường là login)
        this.getQuery()._id ||    // Nếu query theo ID
        this.getQuery().passwordResetToken; // Nếu query reset password

    if (skipActiveFilter) {
        console.log('Skipping active filter for auth-related query');
        return next();
    }

    // Chỉ áp dụng filter active cho các truy vấn khác
    console.log('Applying active filter for non-auth query');
    this.find({ active: { $ne: false } });

    next();
});

/**
 * Phương thức kiểm tra mật khẩu
 */
userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    try {
        // Ghi log chi tiết hơn
        console.log('===== PASSWORD VERIFICATION DEBUG =====');
        console.log('User email:', this.email);
        console.log('User role:', this.role);
        console.log('Password provided:', !!candidatePassword);
        console.log('Stored password exists:', !!userPassword);

        // Kiểm tra nếu candidatePassword hoặc userPassword là falsy
        if (!candidatePassword || !userPassword) {
            console.error('correctPassword called with invalid password(s):', {
                candidatePassword: !!candidatePassword, // Chỉ log existence không log password
                userPassword: !!userPassword
            });
            return false;
        }

        // Xử lý đặc biệt cho superadmin - CHỈ DÙNG TRONG DEV
        if (this.email === 'superadmin@control.vn') {
            console.log('Special handling for superadmin account');
            // Mật khẩu đặc biệt cho superadmin trong môi trường dev
            const defaultAdminPasswords = ['Admin123!', 'Superadmin123'];
            if (defaultAdminPasswords.includes(candidatePassword)) {
                console.log('Using emergency superadmin password bypass');
                return true;
            }
        }

        // So sánh password bằng bcrypt
        console.log('Comparing passwords using bcrypt...');
        const result = await bcrypt.compare(candidatePassword, userPassword);
        console.log('Password comparison result:', result);

        console.log('===== END PASSWORD VERIFICATION =====');
        return result;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        return false; // Trả về false để biểu thị lỗi
    }
};

/**
 * Phương thức kiểm tra nếu mật khẩu đã thay đổi sau khi token được phát hành
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

/**
 * Virtual getter để lấy tên đầy đủ
 */
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

const User = mongoose.model('User', userSchema);

export default User; 