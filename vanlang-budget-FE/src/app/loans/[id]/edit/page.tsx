'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { useTranslation } from 'react-i18next';
import { updateLoan } from '@/redux/features/loanSlice';
import toast from 'react-hot-toast';

interface LoanEditPageProps {
    params: { id: string };
}

const LoanEditPage: React.FC<LoanEditPageProps> = ({ params }) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFormSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);

            // Đảm bảo status là chữ hoa
            if (data.status) {
                data.status = data.status.toUpperCase();
            } else {
                data.status = 'ACTIVE'; // Mặc định nếu không có
            }

            console.log(`Submitting loan update with data:`, data);

            await dispatch(updateLoan({ id: String(params.id), data })).unwrap();

            toast.success(t('loan.updateSuccessDetail'));

            router.push('/loans');
        } catch (error: any) {
            console.error('Error updating loan:', error);

            toast.error(error.message || t('loan.updateErrorDetail'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            {/* Render your form here */}
        </div>
    );
};

export default LoanEditPage;
