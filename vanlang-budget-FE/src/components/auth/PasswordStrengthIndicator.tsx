'use client';

import React from 'react';

interface PasswordStrengthIndicatorProps {
    password: string;
    className?: string;
}

interface PasswordRequirement {
    label: string;
    test: (password: string) => boolean;
    description: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
    password, 
    className = '' 
}) => {
    const requirements: PasswordRequirement[] = [
        {
            label: 'Chữ thường (a-z)',
            test: (pwd) => /[a-z]/.test(pwd),
            description: 'Ít nhất 1 chữ cái thường'
        },
        {
            label: 'Chữ hoa (A-Z)',
            test: (pwd) => /[A-Z]/.test(pwd),
            description: 'Ít nhất 1 chữ cái hoa'
        },
        {
            label: 'Số (0-9)',
            test: (pwd) => /[0-9]/.test(pwd),
            description: 'Ít nhất 1 chữ số'
        },
        {
            label: 'Ký tự đặc biệt',
            test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(pwd),
            description: 'Ít nhất 1 ký tự đặc biệt (!@#$%^&*)'
        },
        {
            label: 'Ít nhất 8 ký tự',
            test: (pwd) => pwd.length >= 8,
            description: 'Độ dài tối thiểu 8 ký tự'
        }
    ];

    const metRequirements = requirements.filter(req => req.test(password));
    const strengthPercentage = (metRequirements.length / requirements.length) * 100;

    const getStrengthColor = () => {
        if (strengthPercentage < 40) return 'bg-red-500';
        if (strengthPercentage < 60) return 'bg-yellow-500';
        if (strengthPercentage < 80) return 'bg-blue-500';
        return 'bg-green-500';
    };

    const getStrengthText = () => {
        if (strengthPercentage < 40) return 'Yếu';
        if (strengthPercentage < 60) return 'Trung bình';
        if (strengthPercentage < 80) return 'Mạnh';
        return 'Rất mạnh';
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Password strength bar */}
            {password && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Độ mạnh mật khẩu:</span>
                        <span className={`text-xs font-medium ${
                            strengthPercentage < 40 ? 'text-red-600' :
                            strengthPercentage < 60 ? 'text-yellow-600' :
                            strengthPercentage < 80 ? 'text-blue-600' :
                            'text-green-600'
                        }`}>
                            {getStrengthText()}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                            style={{ width: `${strengthPercentage}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Requirements checklist */}
            <div className="space-y-1">
                <p className="text-xs text-gray-600">Yêu cầu mật khẩu:</p>
                <div className="grid grid-cols-1 gap-1 text-xs">
                    {requirements.map((requirement, index) => {
                        const isMet = requirement.test(password);
                        return (
                            <div 
                                key={index}
                                className={`flex items-center gap-2 transition-colors duration-200 ${
                                    isMet ? 'text-green-600' : 'text-gray-400'
                                }`}
                            >
                                <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                                    {isMet ? (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </span>
                                <span className="text-xs">{requirement.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Password tips */}
            {password && strengthPercentage < 100 && (
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        💡 <strong>Gợi ý:</strong> Sử dụng cụm từ dễ nhớ kết hợp với số và ký tự đặc biệt. 
                        Ví dụ: "MyPassword123!"
                    </p>
                </div>
            )}
        </div>
    );
};

export default PasswordStrengthIndicator;
