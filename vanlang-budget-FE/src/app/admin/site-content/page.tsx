'use client';

import FullPageContentManager from '@/components/admin/site-content/FullPageContentManager';
import { useAppSelector } from '@/redux/hooks';
import '@/components/admin/site-content/wysiwyg-editor.css';

export default function SiteContentPage() {
    const { user } = useAppSelector((state) => state.auth);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <FullPageContentManager user={user} />
        </div>
    );
}