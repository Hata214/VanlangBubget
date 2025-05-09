import React from 'react';

interface StockIconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

export const StockIcon: React.FC<StockIconProps> = ({ className, ...props }) => {
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
            <path d="M4 18h16" />
            <path d="M4 6h16" />
            <path d="M8 11h.01" />
            <path d="M12 11h.01" />
            <path d="M16 11h.01" />
            <path d="M6 16l4-8 4 4 4-3" />
        </svg>
    );
};

export default StockIcon; 