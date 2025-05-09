import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Expense } from '@/types'
import { expenseService } from '@/services/expenseService'

interface Location {
    lat: number
    lng: number
    address: string
}

interface ExpenseState {
    expenses: Expense[]
    totalExpense: number
    categories: string[]
    isLoading: boolean
    error: string | null
}

const initialState: ExpenseState = {
    expenses: [],
    totalExpense: 0,
    categories: [],
    isLoading: false,
    error: null,
}

// Định nghĩa kiểu dữ liệu response từ API
interface ExpenseResponse {
    status: string;
    results: number;
    total: number;
    totalAmount: number;
    page: number;
    pages: number;
    data: Expense[];
}

export const fetchExpenses = createAsyncThunk(
    'expense/fetchExpenses',
    async (_, { rejectWithValue }) => {
        try {
            console.log('fetchExpenses: Đang gọi API lấy danh sách chi tiêu');
            const data = await expenseService.getAll();
            console.log('fetchExpenses: Nhận được dữ liệu', data);
            return data;
        } catch (error: any) {
            console.error('fetchExpenses error:', error);
            return rejectWithValue(
                error.response?.data?.message || 'Không thể tải dữ liệu chi tiêu'
            );
        }
    }
)

export const fetchCategories = createAsyncThunk(
    'expense/fetchCategories',
    async () => {
        console.log('Fetching expense categories');
        const response = await expenseService.getCategories();
        return response;
    }
)

export const addExpense = createAsyncThunk(
    'expense/addExpense',
    async (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        console.log('Adding new expense', expense);
        const response = await expenseService.create(expense);
        return response;
    }
)

export const updateExpense = createAsyncThunk(
    'expense/updateExpense',
    async ({ id, ...expense }: { id: string } & Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        console.log(`Updating expense ${id}`, expense);
        const response = await expenseService.update(id, expense);
        return response;
    }
)

export const deleteExpense = createAsyncThunk(
    'expense/deleteExpense',
    async (id: string) => {
        console.log(`Deleting expense ${id}`);
        await expenseService.delete(id);
        return id;
    }
)

const expenseSlice = createSlice({
    name: 'expense',
    initialState,
    reducers: {
        setExpenses: (state, action: PayloadAction<Expense[]>) => {
            state.expenses = action.payload;
        },
        setTotalExpense: (state, action: PayloadAction<number>) => {
            state.totalExpense = action.payload;
        },
        addCategory: (state, action: PayloadAction<string>) => {
            if (!state.categories.includes(action.payload)) {
                state.categories.push(action.payload);
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch expenses
            .addCase(fetchExpenses.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchExpenses.fulfilled, (state, action) => {
                console.log('fetchExpenses.fulfilled: Action payload received:', action.payload);

                // Đảm bảo action.payload là một mảng
                if (Array.isArray(action.payload)) {
                    console.log('fetchExpenses.fulfilled: Payload is an array of length:', action.payload.length);
                    state.expenses = action.payload;

                    // Tính tổng chi tiêu từ danh sách expense
                    if (action.payload.length > 0) {
                        state.totalExpense = action.payload.reduce(
                            (total: number, expense: Expense) => {
                                console.log(`Adding expense amount: ${expense.amount}`);
                                return total + expense.amount;
                            },
                            0
                        );
                        console.log('fetchExpenses.fulfilled: Calculated totalExpense:', state.totalExpense);
                    } else {
                        state.totalExpense = 0;
                        console.log('fetchExpenses.fulfilled: Setting totalExpense to 0 (empty array)');
                    }
                } else if (action.payload && typeof action.payload === 'object') {
                    // Trường hợp API trả về đối tượng có trường data
                    console.log('fetchExpenses.fulfilled: Payload is an object, checking for nested data array');
                    const payload = action.payload as ExpenseResponse;

                    if (Array.isArray(payload.data)) {
                        console.log('fetchExpenses.fulfilled: Found nested data array of length:', payload.data.length);
                        state.expenses = payload.data;

                        // Nếu API trả về totalAmount, sử dụng nó
                        if (payload.totalAmount !== undefined) {
                            console.log('fetchExpenses.fulfilled: Using totalAmount from API:', payload.totalAmount);
                            state.totalExpense = payload.totalAmount;
                        } else if (payload.data.length > 0) {
                            // Nếu không, tính tổng từ danh sách
                            state.totalExpense = payload.data.reduce(
                                (total: number, expense: Expense) => total + expense.amount,
                                0
                            );
                            console.log('fetchExpenses.fulfilled: Calculated totalExpense:', state.totalExpense);
                        } else {
                            state.totalExpense = 0;
                            console.log('fetchExpenses.fulfilled: Setting totalExpense to 0 (empty nested array)');
                        }

                        // Cập nhật categories nếu có
                        if (payload.data.length > 0) {
                            const categories = payload.data.map(expense => expense.category);
                            const uniqueCategories = Array.from(new Set([...state.categories, ...categories]));
                            state.categories = uniqueCategories;
                            console.log('fetchExpenses.fulfilled: Updated categories:', uniqueCategories);
                        }
                    } else {
                        console.warn('fetchExpenses.fulfilled: Data property is not an array:', payload);
                        state.expenses = [];
                        state.totalExpense = 0;
                    }
                } else {
                    console.warn('fetchExpenses.fulfilled: Invalid data format:', action.payload);
                    state.expenses = [];
                    state.totalExpense = 0;
                }

                console.log('fetchExpenses.fulfilled: Final state update - expenses:', state.expenses.length, 'totalExpense:', state.totalExpense);
                state.isLoading = false;
            })
            .addCase(fetchExpenses.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra khi tải dữ liệu'
            })

            // Fetch categories
            .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<string[]>) => {
                state.categories = action.payload
            })

            // Add expense
            .addCase(addExpense.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(addExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
                state.isLoading = false

                // Đảm bảo expense có đầy đủ thông tin và đúng định dạng
                const newExpense = {
                    ...action.payload,
                    // Đảm bảo amount là số
                    amount: typeof action.payload.amount === 'number' ? action.payload.amount : 0,
                    // Đảm bảo date có giá trị
                    date: action.payload.date || new Date().toISOString().split('T')[0]
                };

                state.expenses.push(newExpense)

                // Tính lại totalExpense
                if (typeof newExpense.amount === 'number') {
                    state.totalExpense += newExpense.amount
                } else {
                    console.warn('Invalid expense amount:', newExpense.amount)
                }

                if (!state.categories.includes(newExpense.category)) {
                    state.categories.push(newExpense.category);
                }
            })
            .addCase(addExpense.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra khi thêm chi tiêu'
            })

            // Update expense
            .addCase(updateExpense.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
                state.isLoading = false
                const index = state.expenses.findIndex((expense) => expense.id === action.payload.id)
                if (index !== -1) {
                    state.totalExpense =
                        state.totalExpense -
                        state.expenses[index].amount +
                        action.payload.amount
                    state.expenses[index] = action.payload

                    if (!state.categories.includes(action.payload.category)) {
                        state.categories.push(action.payload.category);
                    }
                }
            })
            .addCase(updateExpense.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra khi cập nhật chi tiêu'
            })

            // Delete expense
            .addCase(deleteExpense.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(deleteExpense.fulfilled, (state, action: PayloadAction<string>) => {
                state.isLoading = false
                const expenseToDelete = state.expenses.find((e) => e.id === action.payload);
                if (expenseToDelete) {
                    state.totalExpense -= expenseToDelete.amount;
                }
                state.expenses = state.expenses.filter((expense) => expense.id !== action.payload)
            })
            .addCase(deleteExpense.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra khi xóa chi tiêu'
            })
    },
})

export const { setExpenses, setTotalExpense, addCategory } = expenseSlice.actions
export default expenseSlice.reducer 