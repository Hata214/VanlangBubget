import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Income } from '@/types'
import { incomeService } from '@/services/incomeService'

interface IncomeState {
    incomes: Income[]
    isLoading: boolean
    error: string | null
    totalIncome: number
    totalSavings: number
    categories: string[]
    selectedCategory: string | null
}

const initialState: IncomeState = {
    incomes: [],
    isLoading: false,
    error: null,
    totalIncome: 0,
    totalSavings: 0,
    categories: [],
    selectedCategory: null
}

// Định nghĩa kiểu dữ liệu response từ API
interface IncomeResponse {
    status: string;
    results: number;
    total: number;
    totalAmount: number;
    page: number;
    pages: number;
    data: Income[];
}

// Hàm fetchIncomes để lấy danh sách thu nhập
export const fetchIncomes = createAsyncThunk(
    'income/fetchIncomes',
    async (_, { rejectWithValue }) => {
        try {
            console.log('fetchIncomes: Đang gọi API lấy danh sách thu nhập');
            const data = await incomeService.getAll();
            console.log('fetchIncomes: Nhận được dữ liệu', data);
            return data;
        } catch (error: any) {
            console.error('fetchIncomes error:', error);
            return rejectWithValue(
                error.response?.data?.message || 'Không thể tải dữ liệu thu nhập'
            );
        }
    }
)

export const fetchCategories = createAsyncThunk(
    'income/fetchCategories',
    async () => {
        console.log('Fetching income categories');
        const response = await incomeService.getCategories();
        return response;
    }
)

export const addIncome = createAsyncThunk(
    'income/addIncome',
    async (income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        console.log('Adding new income', income);
        const response = await incomeService.create(income);
        return response;
    }
)

export const updateIncome = createAsyncThunk(
    'income/updateIncome',
    async ({ id, ...income }: { id: string } & Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        console.log(`Updating income ${id}`, income);
        const response = await incomeService.update(id, income);
        return response;
    }
)

export const deleteIncome = createAsyncThunk(
    'income/deleteIncome',
    async (id: string) => {
        console.log(`Deleting income ${id}`);
        await incomeService.delete(id);
        return id;
    }
)

const incomeSlice = createSlice({
    name: 'income',
    initialState,
    reducers: {
        resetIncomeState: () => initialState,
        setSelectedCategory: (state, action: PayloadAction<string>) => {
            state.selectedCategory = action.payload;
        },
        setIncomes: (state, action: PayloadAction<Income[]>) => {
            state.incomes = action.payload;
        },
        setTotalIncome: (state, action: PayloadAction<number>) => {
            state.totalIncome = action.payload;
        },
        addCategory: (state, action: PayloadAction<string>) => {
            if (!state.categories.includes(action.payload)) {
                state.categories.push(action.payload);
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch incomes
            .addCase(fetchIncomes.pending, (state) => {
                console.log('fetchIncomes: Đang tải...');
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchIncomes.fulfilled, (state, action) => {
                console.log('fetchIncomes.fulfilled: Action payload received:', action.payload);

                // Đảm bảo action.payload là một mảng
                if (Array.isArray(action.payload)) {
                    console.log('fetchIncomes.fulfilled: Payload is an array of length:', action.payload.length);
                    state.incomes = action.payload;

                    // Tính tổng thu nhập từ danh sách income
                    if (action.payload.length > 0) {
                        state.totalIncome = action.payload.reduce(
                            (total: number, income: Income) => {
                                console.log(`Adding income amount: ${income.amount}`);
                                return total + income.amount;
                            },
                            0
                        );

                        // Tính tổng tiền tiết kiệm
                        state.totalSavings = action.payload.reduce(
                            (total: number, income: Income) => {
                                if (income.category === 'Tiền tiết kiệm') {
                                    return total + income.amount;
                                }
                                return total;
                            },
                            0
                        );

                        console.log('fetchIncomes.fulfilled: Calculated totalIncome:', state.totalIncome);
                        console.log('fetchIncomes.fulfilled: Calculated totalSavings:', state.totalSavings);
                    } else {
                        state.totalIncome = 0;
                        state.totalSavings = 0;
                        console.log('fetchIncomes.fulfilled: Setting totalIncome and totalSavings to 0 (empty array)');
                    }
                } else if (action.payload && typeof action.payload === 'object') {
                    // Trường hợp API trả về đối tượng có trường data
                    console.log('fetchIncomes.fulfilled: Payload is an object, checking for nested data array');
                    const payload = action.payload as IncomeResponse;

                    if (Array.isArray(payload.data)) {
                        console.log('fetchIncomes.fulfilled: Found nested data array of length:', payload.data.length);
                        state.incomes = payload.data;

                        // Nếu API trả về totalAmount, sử dụng nó
                        if (payload.totalAmount !== undefined) {
                            console.log('fetchIncomes.fulfilled: Using totalAmount from API:', payload.totalAmount);
                            state.totalIncome = payload.totalAmount;
                        } else if (payload.data.length > 0) {
                            // Nếu không, tính tổng từ danh sách
                            state.totalIncome = payload.data.reduce(
                                (total: number, income: Income) => total + income.amount,
                                0
                            );

                            // Tính tổng tiền tiết kiệm
                            state.totalSavings = payload.data.reduce(
                                (total: number, income: Income) => {
                                    if (income.category === 'Tiền tiết kiệm') {
                                        return total + income.amount;
                                    }
                                    return total;
                                },
                                0
                            );

                            console.log('fetchIncomes.fulfilled: Calculated totalIncome:', state.totalIncome);
                            console.log('fetchIncomes.fulfilled: Calculated totalSavings:', state.totalSavings);
                        } else {
                            state.totalIncome = 0;
                            state.totalSavings = 0;
                            console.log('fetchIncomes.fulfilled: Setting totalIncome and totalSavings to 0 (empty nested array)');
                        }

                        // Cập nhật categories nếu có
                        if (payload.data.length > 0) {
                            const categories = payload.data.map(income => income.category);
                            const uniqueCategories = Array.from(new Set([...state.categories, ...categories]));
                            state.categories = uniqueCategories;
                            console.log('fetchIncomes.fulfilled: Updated categories:', uniqueCategories);
                        }
                    } else {
                        console.warn('fetchIncomes.fulfilled: Data property is not an array:', payload);
                        state.incomes = [];
                        state.totalIncome = 0;
                        state.totalSavings = 0;
                    }
                } else {
                    console.warn('fetchIncomes.fulfilled: Invalid data format:', action.payload);
                    state.incomes = [];
                    state.totalIncome = 0;
                    state.totalSavings = 0;
                }

                console.log('fetchIncomes.fulfilled: Final state update - incomes:', state.incomes.length, 'totalIncome:', state.totalIncome);
                state.isLoading = false;
            })
            .addCase(fetchIncomes.rejected, (state, action) => {
                console.error('fetchIncomes: Lỗi:', action.payload);
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Fetch categories
            .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<string[]>) => {
                state.categories = action.payload
            })

            // Add income
            .addCase(addIncome.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(addIncome.fulfilled, (state, action: PayloadAction<Income>) => {
                state.isLoading = false

                // Kiểm tra xem dữ liệu trả về từ API có hợp lệ không
                if (!action.payload || typeof action.payload !== 'object') {
                    console.error('addIncome.fulfilled: Received invalid data from API', action.payload);
                    return;
                }

                // Đảm bảo income có đầy đủ thông tin và đúng định dạng
                const newIncome = {
                    ...action.payload,
                    // Đảm bảo amount là số
                    amount: typeof action.payload.amount === 'number' ? action.payload.amount : 0,
                    // Đảm bảo date là đúng định dạng
                    date: action.payload.date || new Date().toISOString().split('T')[0],
                    // Đảm bảo category có giá trị
                    category: action.payload.category || 'Lương',
                    // Đảm bảo description có giá trị
                    description: action.payload.description || ''
                };

                console.log('addIncome.fulfilled: Adding new income to state', newIncome);

                // Thêm vào đầu mảng để hiển thị trước
                state.incomes.unshift(newIncome);

                // Cập nhật tổng thu nhập
                state.totalIncome += newIncome.amount;

                // Cập nhật tổng tiền tiết kiệm nếu là danh mục Tiền tiết kiệm
                if (newIncome.category === 'Tiền tiết kiệm') {
                    state.totalSavings += newIncome.amount;
                }

                // Thêm danh mục mới vào danh sách nếu chưa tồn tại
                if (newIncome.category && !state.categories.includes(newIncome.category)) {
                    state.categories.push(newIncome.category);
                }
            })
            .addCase(addIncome.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            // Update income
            .addCase(updateIncome.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateIncome.fulfilled, (state, action: PayloadAction<Income>) => {
                state.isLoading = false
                const index = state.incomes.findIndex((income) => income.id === action.payload.id)
                if (index !== -1) {
                    // Lưu lại thông tin cũ để xử lý tổng
                    const oldIncome = state.incomes[index];
                    const oldAmount = oldIncome.amount;
                    const oldCategory = oldIncome.category;

                    // Đảm bảo income có đầy đủ thông tin và đúng định dạng
                    const updatedIncome = {
                        ...action.payload,
                        // Đảm bảo amount là số
                        amount: typeof action.payload.amount === 'number' ? action.payload.amount : 0,
                        // Đảm bảo date là đúng định dạng
                        date: action.payload.date || new Date().toISOString().split('T')[0],
                        // Đảm bảo category có giá trị
                        category: action.payload.category || 'Lương'
                    };

                    // Cập nhật income trong mảng
                    state.incomes[index] = updatedIncome;

                    // Cập nhật tổng thu nhập
                    state.totalIncome = state.totalIncome - oldAmount + updatedIncome.amount;

                    // Cập nhật tổng tiết kiệm
                    if (oldCategory === 'Tiền tiết kiệm' && updatedIncome.category !== 'Tiền tiết kiệm') {
                        // Trường hợp chuyển từ tiết kiệm sang loại khác -> giảm totalSavings
                        state.totalSavings -= oldAmount;
                    } else if (oldCategory !== 'Tiền tiết kiệm' && updatedIncome.category === 'Tiền tiết kiệm') {
                        // Trường hợp chuyển từ loại khác sang tiết kiệm -> tăng totalSavings
                        state.totalSavings += updatedIncome.amount;
                    } else if (oldCategory === 'Tiền tiết kiệm' && updatedIncome.category === 'Tiền tiết kiệm') {
                        // Trường hợp vẫn là tiết kiệm nhưng số tiền thay đổi -> cập nhật chênh lệch
                        state.totalSavings = state.totalSavings - oldAmount + updatedIncome.amount;
                    }

                    // Thêm category mới vào danh sách nếu chưa có
                    if (updatedIncome.category && !state.categories.includes(updatedIncome.category)) {
                        state.categories.push(updatedIncome.category);
                    }
                }
            })
            .addCase(updateIncome.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            // Delete income
            .addCase(deleteIncome.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(deleteIncome.fulfilled, (state, action: PayloadAction<string>) => {
                const id = action.payload;
                const deletedIncome = state.incomes.find(income => income.id === id);

                if (deletedIncome) {
                    // Cập nhật tổng thu nhập
                    state.totalIncome -= deletedIncome.amount;

                    // Cập nhật tổng tiết kiệm nếu khoản xóa thuộc danh mục Tiền tiết kiệm
                    if (deletedIncome.category === 'Tiền tiết kiệm') {
                        state.totalSavings -= deletedIncome.amount;
                    }
                }

                // Xóa khoản thu nhập khỏi mảng
                state.incomes = state.incomes.filter(income => income.id !== id);
                state.isLoading = false;
            })
            .addCase(deleteIncome.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
    },
})

export const { setIncomes, setTotalIncome, addCategory, resetIncomeState, setSelectedCategory } = incomeSlice.actions
export default incomeSlice.reducer 