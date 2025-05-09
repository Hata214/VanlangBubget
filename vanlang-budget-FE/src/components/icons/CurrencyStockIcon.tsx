import React from 'react';

interface CurrencyStockIconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

export const CurrencyStockIcon: React.FC<CurrencyStockIconProps> = ({ className, ...props }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            {/* Biểu đồ cổ phiếu */}
            <path d="M3 16l4-3 3 2 5-4 6 3"></path>

            {/* Đồng tiền */}
            <path d="M16 7h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4h-6"></path>
            <path d="M12 5v2"></path>
            <path d="M12 17v2"></path>
        </svg>
    );
};

export default CurrencyStockIcon; 