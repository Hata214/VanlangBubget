import api from './api'

interface Expense {
    id: string
    amount: number
    description: string
    category: string
    date: string
    userId: string
    location?: {
        lat: number
        lng: number
        address: string
    }
    createdAt: string
    updatedAt: string
    _id?: string
}

interface CreateExpenseData {
    amount: number
    description: string
    category: string
    date: string
    location?: {
        lat: number
        lng: number
        address: string
    }
    customCategory?: string
}

interface Budget {
    category: string
    amount: number
}

export const expenseService = {
    async getAll(): Promise<Expense[]> {
        console.log('expenseService.getAll: Fetching all expenses')
        try {
            const response = await api.get('/api/expenses')
            console.log('expenseService.getAll: Received raw response:', response);

            // Kiểm tra cấu trúc response
            if (!response || !response.data) {
                console.warn('expenseService.getAll: Invalid response structure', response)
                return [];
            }

            // Xử lý response có cấu trúc { data: [...] }
            let expenseData = response.data;

            // Trường hợp response có cấu trúc { status, data: [...] }
            if (response.data.data && Array.isArray(response.data.data)) {
                console.log('expenseService.getAll: Response contains nested data array');
                expenseData = response.data.data;
            }

            // Kiểm tra xem expenseData có phải là mảng không
            if (!Array.isArray(expenseData)) {
                console.warn('expenseService.getAll: Expense data is not an array', expenseData);
                return [];
            }

            console.log('expenseService.getAll: Processing expense data:', expenseData);

            // Xử lý và chuyển đổi dữ liệu
            const formattedData = expenseData.map(expense => {
                // Nếu không có id nhưng có _id, thì sử dụng _id làm id
                if (!expense.id && expense._id) {
                    console.log(`expenseService.getAll: Converting _id ${expense._id} to id`);
                    return {
                        ...expense,
                        id: expense._id.toString()
                    };
                }
                return expense;
            });

            console.log('expenseService.getAll: Returning formatted data:', formattedData);
            return formattedData;
        } catch (error) {
            console.error('expenseService.getAll: Error fetching expenses', error);
            throw error;
        }
    },

    async getById(id: string): Promise<Expense> {
        console.log(`expenseService.getById: Fetching expense with id ${id}`)
        try {
            const response = await api.get<Expense>(`/api/expenses/${id}`)
            console.log('expenseService.getById: Received data', response.data)
            return response.data
        } catch (error) {
            console.error(`expenseService.getById: Error fetching expense with id ${id}`, error)
            throw error
        }
    },

    async create(data: CreateExpenseData): Promise<Expense> {
        console.log('expenseService.create: Creating new expense', data)
        try {
            const expenseData = {
                amount: data.amount,
                description: data.description,
                category: data.category,
                date: data.date,
                location: data.location
            };

            console.log('expenseService.create: Sending expense data to server:', expenseData);
            const response = await api.post<Expense>('/api/expenses', expenseData)
            console.log('expenseService.create: Successfully created expense', response.data)
            return response.data
        } catch (error) {
            console.error('expenseService.create: Error creating expense', error)
            throw error
        }
    },

    async update(id: string, data: Partial<CreateExpenseData>): Promise<Expense> {
        console.log(`expenseService.update: Updating expense with id ${id}`, data)
        try {
            const expenseData = { ...data };
            if ('customCategory' in expenseData) {
                delete expenseData.customCategory;
            }

            console.log('expenseService.update: Sending update data to server:', expenseData);
            const response = await api.put<Expense>(`/api/expenses/${id}`, expenseData)
            console.log('expenseService.update: Successfully updated expense', response.data)
            return response.data
        } catch (error) {
            console.error(`expenseService.update: Error updating expense with id ${id}`, error)
            throw error
        }
    },

    async delete(id: string): Promise<void> {
        console.log(`expenseService.delete: Deleting expense with id ${id}`)
        try {
            await api.delete(`/api/expenses/${id}`)
            console.log(`expenseService.delete: Successfully deleted expense with id ${id}`)
        } catch (error) {
            console.error(`expenseService.delete: Error deleting expense with id ${id}`, error)
            throw error
        }
    },

    async getByCategory(category: string): Promise<Expense[]> {
        console.log(`expenseService.getByCategory: Fetching expenses with category ${category}`)
        try {
            const response = await api.get<Expense[]>(`/api/expenses/category/${category}`)
            console.log('expenseService.getByCategory: Received data', response.data)
            return response.data
        } catch (error) {
            console.error(`expenseService.getByCategory: Error fetching expenses with category ${category}`, error)
            throw error
        }
    },

    async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
        console.log(`expenseService.getByDateRange: Fetching expenses between ${startDate} and ${endDate}`)
        try {
            const response = await api.get<Expense[]>('/api/expenses/range', {
                params: { startDate, endDate },
            })
            console.log('expenseService.getByDateRange: Received data', response.data)
            return response.data
        } catch (error) {
            console.error(`expenseService.getByDateRange: Error fetching expenses between ${startDate} and ${endDate}`, error)
            throw error
        }
    },

    async getBudgets(): Promise<Budget[]> {
        console.log('expenseService.getBudgets: Fetching all budgets')
        try {
            const response = await api.get<Budget[]>('/api/expenses/budgets')
            console.log('expenseService.getBudgets: Received data', response.data)
            return response.data
        } catch (error) {
            console.error('expenseService.getBudgets: Error fetching budgets', error)
            throw error
        }
    },

    async setBudget(data: Budget): Promise<Budget> {
        console.log('expenseService.setBudget: Setting budget', data)
        try {
            const response = await api.post<Budget>('/api/expenses/budgets', data)
            console.log('expenseService.setBudget: Successfully set budget', response.data)
            return response.data
        } catch (error) {
            console.error('expenseService.setBudget: Error setting budget', error)
            throw error
        }
    },

    async updateBudget(category: string, data: Budget): Promise<Budget> {
        console.log(`expenseService.updateBudget: Updating budget for category ${category}`, data)
        try {
            const response = await api.put<Budget>(`/api/expenses/budgets/${category}`, data)
            console.log('expenseService.updateBudget: Successfully updated budget', response.data)
            return response.data
        } catch (error) {
            console.error(`expenseService.updateBudget: Error updating budget for category ${category}`, error)
            throw error
        }
    },

    async deleteBudget(category: string): Promise<void> {
        console.log(`expenseService.deleteBudget: Deleting budget for category ${category}`)
        try {
            await api.delete(`/api/expenses/budgets/${category}`)
            console.log(`expenseService.deleteBudget: Successfully deleted budget for category ${category}`)
        } catch (error) {
            console.error(`expenseService.deleteBudget: Error deleting budget for category ${category}`, error)
            throw error
        }
    },

    async getCategories(): Promise<string[]> {
        console.log('expenseService.getCategories: Fetching expense categories')
        try {
            const response = await api.get<string[]>('/api/expenses/categories')
            console.log('expenseService.getCategories: Received categories', response.data)
            return response.data
        } catch (error) {
            console.error('expenseService.getCategories: Error fetching expense categories', error)
            throw error
        }
    },
} 