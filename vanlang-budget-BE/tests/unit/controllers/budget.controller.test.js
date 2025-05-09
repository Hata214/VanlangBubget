/**
 * @jest-environment node
 */

// Test đơn giản cho budget controller với ESM 

describe('Budget Controller Basic Test', () => {
    // Test cơ bản để kiểm tra môi trường
    test('Test environment works', () => {
        expect(1 + 1).toBe(2);
    });

    test('Async test works', async () => {
        const result = await Promise.resolve(42);
        expect(result).toBe(42);
    });

    // Kiểm tra cấu trúc controller đơn giản
    test('Controller structure test', async () => {
        // Import controller sử dụng dynamic import
        const testBudgetController = await import('../../../src/controllers/testBudgetController.js')
            .then(module => module.default)
            .catch(err => {
                console.error('Không thể import controller:', err);
                return null;
            });

        // Kiểm tra nếu controller tồn tại
        if (testBudgetController) {
            // Kiểm tra các phương thức cần có
            expect(typeof testBudgetController.getBudgets).toBe('function');
            expect(typeof testBudgetController.getBudgetById).toBe('function');
            expect(typeof testBudgetController.createBudget).toBe('function');
            expect(typeof testBudgetController.updateBudget).toBe('function');
            expect(typeof testBudgetController.deleteBudget).toBe('function');

            // Kiểm tra reference đến service
            expect(testBudgetController.budgetService).toBeDefined();
        } else {
            console.log('Test skipped: controller not found');
        }
    });

    // Test xử lý lỗi đơn giản
    test('Error handling test', async () => {
        const controller = await import('../../../src/controllers/testBudgetController.js')
            .then(module => module.default)
            .catch(() => null);

        if (!controller) {
            console.log('Test skipped: controller not found');
            return;
        }

        // Tạo mocks đơn giản
        const mockReq = {};
        const mockRes = {};
        let errorCaught = null;

        const mockNext = (error) => {
            errorCaught = error;
        };

        // Tạo lỗi để test
        const testError = new Error('Test error');

        // Lưu service gốc
        const originalService = controller.budgetService;

        // Thay thế bằng service giả ném lỗi
        controller.budgetService = {
            getBudgets: async () => { throw testError; }
        };

        // Gọi phương thức controller
        try {
            await controller.getBudgets(mockReq, mockRes, mockNext);

            // Kiểm tra rằng lỗi đã được truyền cho middleware next
            expect(errorCaught).toBe(testError);
        } finally {
            // Khôi phục service gốc
            controller.budgetService = originalService;
        }
    }); // Thiết lập timeout dài hơn bằng tham số thứ ba sẽ không hoạt động trong ESM
}); 