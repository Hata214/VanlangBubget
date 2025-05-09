// Mock cho Budget model
const budgetModel = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    sort: jest.fn()
};

export default budgetModel; 