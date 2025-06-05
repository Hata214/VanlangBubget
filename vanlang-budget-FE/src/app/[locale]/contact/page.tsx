'use client';

import { useTranslations } from 'next-intl';
import PublicLayout from '@/components/layout/PublicLayout'; // Giả sử bạn muốn sử dụng layout chung
import { Button } from '@/components/ui/Button'; // Ví dụ sử dụng Button
import { Input } from '@/components/ui/Input'; // Ví dụ sử dụng Input
import { Textarea } from '@/components/ui/Textarea'; // Ví dụ sử dụng Textarea

export default function ContactPage() {
    const t = useTranslations('ContactPage'); // Namespace cho translations

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Xử lý logic gửi form ở đây
        alert(t('formSubmitted'));
    };

    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6 text-center">{t('title')}</h1>
                <p className="text-lg text-muted-foreground mb-8 text-center">
                    {t('description')}
                </p>
                <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-card p-8 rounded-lg shadow-md border border-border">
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                            {t('form.name.label')}
                        </label>
                        <Input type="text" id="name" name="name" placeholder={t('form.name.placeholder')} required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                            {t('form.email.label')}
                        </label>
                        <Input type="email" id="email" name="email" placeholder={t('form.email.placeholder')} required />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                            {t('form.message.label')}
                        </label>
                        <Textarea id="message" name="message" rows={4} placeholder={t('form.message.placeholder')} required />
                    </div>
                    <Button type="submit" className="w-full">
                        {t('form.submitButton')}
                    </Button>
                </form>
            </div>
        </PublicLayout>
    );
}
