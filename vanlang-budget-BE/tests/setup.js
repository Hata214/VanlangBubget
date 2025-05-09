import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables từ .env.test
dotenv.config({ path: path.join(__dirname, '../.env.test') });

// Tạo biến instance của MongoMemoryServer
let mongoServer;

// Thiết lập server trước khi chạy test
export const startServer = async () => {
    // Đóng tất cả kết nối hiện tại
    try {
        await mongoose.disconnect();
        console.log('Disconnected from any existing MongoDB connection');
    } catch (error) {
        console.log('No existing connection to disconnect');
    }

    // Xóa tất cả các model đã đăng ký để tránh lỗi "Cannot overwrite model"
    if (mongoose.connection) {
        Object.keys(mongoose.connection.models).forEach(modelName => {
            delete mongoose.connection.models[modelName];
        });

        console.log('Cleared existing mongoose models');
    } else {
        console.log('No mongoose connection available');
    }

    try {
        // Khởi tạo MongoDB Memory Server
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Kết nối với MongoDB Memory Server
        await mongoose.connect(mongoUri, {});

        console.log(`Connected to in-memory MongoDB at ${mongoUri}`);

        // Import app từ /src 
        const { default: app } = await import('../src/app.js');
        return app;
    } catch (error) {
        console.error('Error setting up test server:', error);
        throw error;
    }
};

// Dọn dẹp sau khi test hoàn thành
export const stopServer = async () => {
    if (mongoose.connection.readyState !== 0) {
        try {
            await mongoose.disconnect();
            console.log('Disconnected from in-memory MongoDB');
        } catch (error) {
            console.error('Error disconnecting from MongoDB:', error);
        }
    }

    if (mongoServer) {
        try {
            await mongoServer.stop();
            console.log('Stopped MongoDB Memory Server');
        } catch (error) {
            console.error('Error stopping MongoDB Memory Server:', error);
        }
    }
};

// Xóa tất cả collections từ database sau mỗi test
export const clearDatabase = async () => {
    if (mongoose.connection.readyState !== 0) {
        try {
            const collections = mongoose.connection.collections;

            for (const key in collections) {
                const collection = collections[key];
                await collection.deleteMany({});
            }

            console.log('Cleared all collections');
        } catch (error) {
            console.error('Error clearing database:', error);
        }
    }
}; 