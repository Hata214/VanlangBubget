import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Loan } from '@/types'
import { loanService } from '@/services/loanService'

interface LoanState {
    loans: Loan[]
    selectedLoan: Loan | null
    totalLoan: number
    isLoading: boolean
    error: string | null
    status: 'idle' | 'loading' | 'succeeded' | 'failed'
    statusCheck: {
        isChecking: boolean
        lastCheck: Date | null
        result: {
            total: number
            updated: number
            statusChanges: Array<{
                loanId: string
                oldStatus: string
                newStatus: string
                description: string
                amount: number
                dueDate: string
            }>
        } | null
    }
}

const initialState: LoanState = {
    loans: [],
    selectedLoan: null,
    totalLoan: 0,
    isLoading: false,
    error: null,
    status: 'idle',
    statusCheck: {
        isChecking: false,
        lastCheck: null,
        result: null
    }
}

// Định nghĩa interface cho response từ API
interface LoanResponse {
    status: string;
    results: number;
    total: number;
    totalAmount?: number;
    page: number;
    pages: number;
    data: Loan[];
}

export const fetchLoans = createAsyncThunk(
    'loan/fetchLoans',
    async () => {
        console.log('Dispatching fetchLoans action');
        const response = await loanService.getAll();
        console.log('fetchLoans response:', response);
        return response;
    }
)

export const fetchLoanById = createAsyncThunk(
    'loan/fetchLoanById',
    async (id: string) => {
        const response = await loanService.getById(id)
        return response
    }
)

export const addLoan = createAsyncThunk(
    'loan/addLoan',
    async (data: Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        console.log('Adding loan with data:', data);
        const response = await loanService.create(data)
        console.log('Add loan response:', response);
        return response
    }
)

export const updateLoan = createAsyncThunk(
    'loan/updateLoan',
    async ({ id, data }: { id: string, data: Partial<Omit<Loan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> }) => {
        console.log(`Updating loan ${id} with data:`, data);

        // Chuẩn hóa trạng thái nếu có
        const updatedData = { ...data };
        if (updatedData.status) {
            updatedData.status = updatedData.status.toUpperCase() as any;
            console.log('Normalized status to uppercase:', updatedData.status);
        }

        const response = await loanService.update(id, updatedData);
        console.log('Update loan response:', response);
        return response;
    }
)

export const deleteLoan = createAsyncThunk(
    'loan/deleteLoan',
    async (id: string) => {
        console.log(`Deleting loan with id: ${id}`);
        await loanService.delete(id)
        return id
    }
)

export const checkLoanStatus = createAsyncThunk(
    'loan/checkStatus',
    async () => {
        console.log('Checking loan status real-time');
        const response = await loanService.checkStatus();
        console.log('Check status response:', response);
        return response;
    }
)

const loanSlice = createSlice({
    name: 'loan',
    initialState,
    reducers: {
        setLoans: (state, action) => {
            state.loans = action.payload;
        },
        setTotalLoan: (state, action) => {
            state.totalLoan = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch loans
            .addCase(fetchLoans.pending, (state) => {
                state.isLoading = true
                state.error = null
                console.log('fetchLoans.pending - Setting loading state');
            })
            .addCase(fetchLoans.fulfilled, (state, action) => {
                state.isLoading = false;
                console.log('fetchLoans.fulfilled - Processing response:', action.payload);

                // Xử lý response theo cấu trúc mới
                if (action.payload && typeof action.payload === 'object') {
                    // Kiểm tra xem response có cấu trúc LoanResponse không
                    if ('data' in action.payload && Array.isArray(action.payload.data)) {
                        console.log('Response has data array structure');
                        // Cấu trúc response mới
                        const response = action.payload as LoanResponse;
                        state.loans = response.data;

                        // Sử dụng totalAmount từ response nếu có, hoặc tính tổng từ danh sách
                        if (response.totalAmount !== undefined) {
                            state.totalLoan = response.totalAmount;
                        } else {
                            state.totalLoan = response.data.reduce(
                                (total: number, loan: Loan) => {
                                    // Chỉ tính những khoản vay có trạng thái ACTIVE hoặc OVERDUE
                                    const status = loan.status?.toUpperCase() || '';
                                    return (status === 'ACTIVE' || status === 'OVERDUE') ? total + loan.amount : total;
                                },
                                0
                            );
                        }
                    } else if (Array.isArray(action.payload)) {
                        console.log('Response is an array');
                        // Cấu trúc cũ (mảng)
                        state.loans = action.payload;

                        if (action.payload.length > 0) {
                            state.totalLoan = action.payload.reduce(
                                (total: number, loan: Loan) => {
                                    // Chỉ tính những khoản vay có trạng thái ACTIVE hoặc OVERDUE
                                    const status = loan.status?.toUpperCase() || '';
                                    return (status === 'ACTIVE' || status === 'OVERDUE') ? total + loan.amount : total;
                                },
                                0
                            );
                        } else {
                            state.totalLoan = 0;
                        }
                    } else {
                        console.warn('Unexpected response format:', action.payload);
                        state.loans = [];
                        state.totalLoan = 0;
                    }
                } else {
                    console.warn('Invalid response:', action.payload);
                    state.loans = [];
                    state.totalLoan = 0;
                }

                console.log('Processed loans:', state.loans.length, 'Total loan amount:', state.totalLoan);
            })
            .addCase(fetchLoans.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
                console.error('fetchLoans.rejected - Error:', action.error);
            })

            // Fetch loan by id
            .addCase(fetchLoanById.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchLoanById.fulfilled, (state, action) => {
                state.isLoading = false
                state.selectedLoan = action.payload
            })
            .addCase(fetchLoanById.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })

            // Add loan
            .addCase(addLoan.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(addLoan.fulfilled, (state, action) => {
                state.isLoading = false
                // Xử lý response từ API
                const newLoan = action.payload;

                if (newLoan && newLoan.id) {
                    state.loans.push(newLoan);
                    const status = newLoan.status?.toUpperCase() || '';
                    if (status === 'ACTIVE' || status === 'OVERDUE') {
                        state.totalLoan += newLoan.amount;
                    }
                    console.log('Added new loan:', newLoan);
                } else {
                    console.warn('Invalid loan data received:', newLoan);
                }
            })
            .addCase(addLoan.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
                console.error('addLoan.rejected - Error:', action.error);
            })

            // Update loan
            .addCase(updateLoan.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateLoan.fulfilled, (state, action) => {
                state.isLoading = false
                if (!action.payload) {
                    console.error('Không có dữ liệu loan được cung cấp để cập nhật');
                    return;
                }

                const updatedLoan = action.payload;
                const loanIndex = state.loans.findIndex(loan => loan.id === updatedLoan.id);

                if (loanIndex === -1) {
                    console.error('Không tìm thấy khoản vay để cập nhật');
                    return;
                }

                // Lưu trữ giá trị cũ để tính toán totalLoan
                const oldLoan = state.loans[loanIndex];
                const oldStatus = oldLoan.status?.toUpperCase() || '';
                const newStatus = updatedLoan.status?.toUpperCase() || '';

                console.log('Cập nhật khoản vay:', {
                    oldStatus,
                    newStatus,
                    oldAmount: oldLoan.amount,
                    newAmount: updatedLoan.amount
                });

                // Cập nhật khoản vay trong mảng
                state.loans[loanIndex] = updatedLoan;

                // Cập nhật selectedLoan nếu đang được chọn
                if (state.selectedLoan?.id === updatedLoan.id) {
                    state.selectedLoan = updatedLoan;
                }

                // Cập nhật totalLoan dựa trên sự thay đổi số tiền và trạng thái
                const oldIsCountable = oldStatus === 'ACTIVE' || oldStatus === 'OVERDUE';
                const newIsCountable = newStatus === 'ACTIVE' || newStatus === 'OVERDUE';

                if (oldIsCountable && !newIsCountable) {
                    // Trường hợp chuyển từ ACTIVE/OVERDUE sang trạng thái khác: trừ đi khoản tiền cũ
                    state.totalLoan -= oldLoan.amount;
                    console.log(`Giảm tổng tiền vay (${oldLoan.amount}) do chuyển từ ${oldStatus} sang ${newStatus}`);
                } else if (!oldIsCountable && newIsCountable) {
                    // Trường hợp chuyển từ trạng thái khác sang ACTIVE/OVERDUE: cộng thêm khoản tiền mới
                    state.totalLoan += updatedLoan.amount;
                    console.log(`Tăng tổng tiền vay (${updatedLoan.amount}) do chuyển từ ${oldStatus} sang ${newStatus}`);
                } else if (oldIsCountable && newIsCountable && oldLoan.amount !== updatedLoan.amount) {
                    // Trường hợp vẫn ACTIVE/OVERDUE nhưng có thay đổi số tiền
                    state.totalLoan = state.totalLoan - oldLoan.amount + updatedLoan.amount;
                    console.log(`Cập nhật tổng tiền vay do thay đổi số tiền (${oldLoan.amount} -> ${updatedLoan.amount})`);
                }

                console.log('Tổng tiền vay sau cập nhật:', state.totalLoan);

                // Cập nhật status nếu cần
                state.status = 'succeeded';
                state.error = null;
            })
            .addCase(updateLoan.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
                console.error('updateLoan.rejected - Error:', action.error);
            })

            // Delete loan
            .addCase(deleteLoan.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(deleteLoan.fulfilled, (state, action) => {
                state.isLoading = false
                const index = state.loans.findIndex((loan) => loan.id === action.payload)
                if (index !== -1) {
                    const loan = state.loans[index]
                    const status = loan.status?.toUpperCase() || '';
                    if (status === 'ACTIVE' || status === 'OVERDUE') {
                        state.totalLoan -= loan.amount
                    }
                    state.loans.splice(index, 1)
                    console.log('Deleted loan with id', action.payload);
                } else {
                    console.warn('Could not find loan with id', action.payload, 'to delete');
                }

                if (state.selectedLoan?.id === action.payload) {
                    state.selectedLoan = null
                }
            })
            .addCase(deleteLoan.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
                console.error('deleteLoan.rejected - Error:', action.error);
            })

            // Check loan status
            .addCase(checkLoanStatus.pending, (state) => {
                state.statusCheck.isChecking = true
            })
            .addCase(checkLoanStatus.fulfilled, (state, action) => {
                state.statusCheck.isChecking = false
                state.statusCheck.lastCheck = new Date()
                state.statusCheck.result = action.payload

                // If there were status changes, refresh the loans list
                if (action.payload.updated > 0) {
                    console.log('Status check found updates, will refresh loans list');
                }
            })
            .addCase(checkLoanStatus.rejected, (state, action) => {
                state.statusCheck.isChecking = false
                state.error = action.error.message || 'Có lỗi xảy ra khi kiểm tra trạng thái'
                console.error('checkLoanStatus.rejected - Error:', action.error);
            })
    },
})

export const { setLoans, setTotalLoan } = loanSlice.actions
export default loanSlice.reducer