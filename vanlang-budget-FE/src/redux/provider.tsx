'use client'

import { Provider } from 'react-redux'
import { store } from '@/redux/store'
// import { useEffect } from 'react' // No longer needed here
// import { setCredentials } from './features/authSlice' // No longer needed here
// import { authService } from '@/services/authService' // No longer needed here
// import api from '@/services/api' // No longer needed here
import { NotificationHandler } from '@/components/notification/NotificationHandler'

export function Providers({ children }: { children: React.ReactNode }) {
    // The useEffect for auth initialization has been removed.
    // AuthContext.tsx is now solely responsible for this.

    return (
        <Provider store={store}>
            <NotificationHandler />
            {children}
        </Provider>
    )
}
