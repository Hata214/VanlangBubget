'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updateLoan } from '@/redux/loans/loansSlice';
import { showToast } from '@/components/ui/use-toast';

const LoanEditPage: React.FC = () => {
    const router = useRouter();
    const dispatch = useDispatch();
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

            showToast({
                title: t('loan.updateSuccess'),
                description: t('loan.updateSuccessDetail'),
                variant: 'success',
            });

            router.push('/loans');
        } catch (error: any) {
            console.error('Error updating loan:', error);

            showToast({
                title: t('loan.updateError'),
                description: error.message || t('loan.updateErrorDetail'),
                variant: 'destructive',
            });
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