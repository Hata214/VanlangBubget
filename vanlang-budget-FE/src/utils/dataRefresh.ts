/**
 * Utility để refresh data sau khi thêm/sửa/xóa
 * Thay thế cho WebSocket khi không hoạt động
 */

import { store } from '@/redux/store';
import { fetchIncomes } from '@/redux/features/incomeSlice';
import { fetchExpenses } from '@/redux/features/expenseSlice';
import { fetchLoans } from '@/redux/features/loanSlice';
import { fetchNotifications } from '@/redux/features/notificationSlice';

export interface RefreshOptions {
    incomes?: boolean;
    expenses?: boolean;
    loans?: boolean;
    notifications?: boolean;
    delay?: number; // Delay in ms before refresh
}

/**
 * Refresh data sau khi thao tác CRUD
 */
export const refreshData = async (options: RefreshOptions = {}) => {
    const {
        incomes = false,
        expenses = false,
        loans = false,
        notifications = false,
        delay = 500 // Default 500ms delay
    } = options;

    console.log('🔄 Refreshing data:', options);

    // Delay để đảm bảo backend đã xử lý xong
    if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    const dispatch = store.dispatch;

    try {
        // Refresh incomes
        if (incomes) {
            console.log('🔄 Refreshing incomes...');
            await dispatch(fetchIncomes()).unwrap();
        }

        // Refresh expenses
        if (expenses) {
            console.log('🔄 Refreshing expenses...');
            await dispatch(fetchExpenses()).unwrap();
        }

        // Refresh loans
        if (loans) {
            console.log('🔄 Refreshing loans...');
            await dispatch(fetchLoans()).unwrap();
        }

        // Refresh notifications
        if (notifications) {
            console.log('🔄 Refreshing notifications...');
            await dispatch(fetchNotifications({ page: 1 })).unwrap();
        }

        console.log('✅ Data refresh completed');
    } catch (error) {
        console.error('❌ Error refreshing data:', error);
    }
};

/**
 * Refresh tất cả data
 */
export const refreshAllData = async (delay: number = 500) => {
    return refreshData({
        incomes: true,
        expenses: true,
        loans: true,
        notifications: true,
        delay
    });
};

/**
 * Refresh data sau khi thêm income
 */
export const refreshAfterIncomeAction = async () => {
    return refreshData({
        incomes: true,
        notifications: true,
        delay: 300
    });
};

/**
 * Refresh data sau khi thêm expense
 */
export const refreshAfterExpenseAction = async () => {
    return refreshData({
        expenses: true,
        notifications: true,
        delay: 300
    });
};

/**
 * Refresh data sau khi thêm loan
 */
export const refreshAfterLoanAction = async () => {
    return refreshData({
        loans: true,
        notifications: true,
        delay: 300
    });
};

/**
 * Hook để sử dụng trong React components
 */
export const useDataRefresh = () => {
    return {
        refreshData,
        refreshAllData,
        refreshAfterIncomeAction,
        refreshAfterExpenseAction,
        refreshAfterLoanAction
    };
};

/**
 * Expose ra global scope để test
 */
if (typeof window !== 'undefined') {
    (window as any).refreshData = refreshData;
    (window as any).refreshAllData = refreshAllData;
    console.log('🔄 Data refresh functions available: refreshData(), refreshAllData()');
}
