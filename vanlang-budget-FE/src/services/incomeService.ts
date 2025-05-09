import api from './api'

interface Income {
    id: string
    amount: number
    description: string
    category: string
    date: string
    userId: string
    createdAt: string
    updatedAt: string
    _id?: string
}

interface CreateIncomeData {
    amount: number
    description: string
    category: string
    date: string
    customCategory?: string
}

export const incomeService = {
    async getAll(): Promise<Income[]> {
        console.log('incomeService.getAll: Fetching all incomes')
        try {
            const response = await api.get('/api/incomes')
            console.log('incomeService.getAll: Received raw response:', response);

            // Kiểm tra cấu trúc response
            if (!response || !response.data) {
                console.warn('incomeService.getAll: Invalid response structure', response)
                return [];
            }

            // Xử lý response có cấu trúc { data: [...] }
            let incomeData = response.data;

            // Trường hợp response có cấu trúc { status, data: [...] }
            if (response.data.data && Array.isArray(response.data.data)) {
                console.log('incomeService.getAll: Response contains nested data array');
                incomeData = response.data.data;
            }

            // Kiểm tra xem incomeData có phải là mảng không
            if (!Array.isArray(incomeData)) {
                console.warn('incomeService.getAll: Income data is not an array', incomeData);
                return [];
            }

            console.log('incomeService.getAll: Processing income data:', incomeData);

            // Xử lý và chuyển đổi dữ liệu
            const formattedData = incomeData.map(income => {
                // Nếu không có id nhưng có _id, thì sử dụng _id làm id
                if (!income.id && income._id) {
                    console.log(`incomeService.getAll: Converting _id ${income._id} to id`);
                    return {
                        ...income,
                        id: income._id.toString()
                    };
                }
                return income;
            });

            console.log('incomeService.getAll: Returning formatted data:', formattedData);
            return formattedData;
        } catch (error) {
            console.error('incomeService.getAll: Error fetching incomes', error);
            throw error;
        }
    },

    async getById(id: string): Promise<Income> {
        console.log(`incomeService.getById: Fetching income with id ${id}`)
        try {
            const response = await api.get<Income>(`/api/incomes/${id}`)
            console.log('incomeService.getById: Received data', response.data)
            return response.data
        } catch (error) {
            console.error(`incomeService.getById: Error fetching income with id ${id}`, error)
            throw error
        }
    },

    async create(data: CreateIncomeData): Promise<Income> {
        console.log('incomeService.create: Creating new income', data)
        try {
            // Đảm bảo dữ liệu hợp lệ
            const validatedData = {
                ...data,
                amount: typeof data.amount === 'number' ?
                    Number.isFinite(data.amount) ? data.amount : 0 : 0
            };

            // Nếu danh mục là "OTHER" và có danh mục tùy chỉnh, sử dụng danh mục tùy chỉnh
            let category = validatedData.category;
            if (validatedData.category === 'OTHER' && validatedData.customCategory) {
                category = validatedData.customCategory;
            } else if (validatedData.category === 'OTHER' && !validatedData.customCategory) {
                // Nếu chọn OTHER nhưng không có danh mục tùy chỉnh, sử dụng Tiền tiết kiệm làm mặc định
                category = 'Tiền tiết kiệm';
            }

            const incomeData = {
                amount: validatedData.amount,
                description: validatedData.description,
                category: category,
                date: validatedData.date
            };

            console.log('incomeService.create: Sending income data to server:', incomeData);
            const response = await api.post<Income>('/api/incomes', incomeData)
            console.log('incomeService.create: Successfully created income', response.data)
            return response.data
        } catch (error) {
            console.error('incomeService.create: Error creating income', error)
            throw error
        }
    },

    async update(id: string, data: Partial<CreateIncomeData>): Promise<Income> {
        console.log(`incomeService.update: Updating income ${id}`, data)
        try {
            // Đảm bảo dữ liệu hợp lệ
            const validatedData = {
                ...data
            };

            // Đảm bảo amount là số hợp lệ nếu được cung cấp
            if (data.amount !== undefined) {
                validatedData.amount = typeof data.amount === 'number' ?
                    Number.isFinite(data.amount) ? data.amount : 0 : 0;
            }

            // Nếu danh mục là "OTHER" và có danh mục tùy chỉnh, sử dụng danh mục tùy chỉnh
            if (data.category === 'OTHER' && data.customCategory) {
                validatedData.category = data.customCategory;
            } else if (data.category === 'OTHER' && !data.customCategory) {
                // Nếu chọn OTHER nhưng không có danh mục tùy chỉnh, sử dụng Tiền tiết kiệm làm mặc định
                validatedData.category = 'Tiền tiết kiệm';
            }

            // Loại bỏ customCategory khỏi dữ liệu gửi đi nếu có
            const { customCategory, ...updateData } = validatedData;

            console.log(`incomeService.update: Sending validated data for income ${id}`, updateData);
            const response = await api.put<Income>(`/api/incomes/${id}`, updateData);
            return response.data;
        } catch (error) {
            console.error('Error updating income:', error);
            throw error;
        }
    },

    async delete(id: string): Promise<void> {
        console.log(`incomeService.delete: Deleting income with id ${id}`)
        try {
            await api.delete(`/api/incomes/${id}`)
            console.log(`incomeService.delete: Successfully deleted income with id ${id}`)
        } catch (error) {
            console.error(`incomeService.delete: Error deleting income with id ${id}`, error)
            throw error
        }
    },

    async getByCategory(category: string): Promise<Income[]> {
        console.log(`incomeService.getByCategory: Fetching incomes with category ${category}`)
        try {
            const response = await api.get<Income[]>(`/api/incomes/category/${category}`)
            console.log('incomeService.getByCategory: Received data', response.data)
            return response.data
        } catch (error) {
            console.error(`incomeService.getByCategory: Error fetching incomes with category ${category}`, error)
            throw error
        }
    },

    async getByDateRange(startDate: string, endDate: string): Promise<Income[]> {
        console.log(`incomeService.getByDateRange: Fetching incomes between ${startDate} and ${endDate}`)
        try {
            const response = await api.get<Income[]>('/api/incomes/range', {
                params: { startDate, endDate },
            })
            console.log('incomeService.getByDateRange: Received data', response.data)
            return response.data
        } catch (error) {
            console.error(`incomeService.getByDateRange: Error fetching incomes between ${startDate} and ${endDate}`, error)
            throw error
        }
    },

    async getCategories(): Promise<string[]> {
        console.log('incomeService.getCategories: Fetching income categories')
        try {
            const response = await api.get<string[]>('/api/incomes/categories')
            console.log('incomeService.getCategories: Received categories', response.data)
            return response.data
        } catch (error) {
            console.error('incomeService.getCategories: Error fetching income categories', error)
            throw error
        }
    },
} 