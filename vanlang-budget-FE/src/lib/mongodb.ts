import mongoose from 'mongoose';
import { MongoClient, Db } from 'mongodb';

// Sử dụng URL MongoDB mặc định khi không có biến môi trường
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget';

/**
 * Kiểu dữ liệu cho biến cache Mongoose
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

/**
 * Biến toàn cục dùng để lưu trữ kết nối MongoDB
 */
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Kết nối tới MongoDB với Mongoose
 * @returns Promise với đối tượng kết nối Mongoose
 */
export async function connectToDB(): Promise<typeof mongoose> {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
            return mongooseInstance;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

/**
 * Interface cho kết nối MongoDB Client
 */
interface MongoClientConnection {
    client: MongoClient | null;
    db: Db | null;
    promise: Promise<{ client: MongoClient | null; db: Db | null }> | null;
}

/**
 * Biến toàn cục lưu trữ kết nối MongoDB Client
 */
let cachedClient: MongoClientConnection = (global as any).mongoClient || {
    client: null,
    db: null,
    promise: null,
};

if (!(global as any).mongoClient) {
    (global as any).mongoClient = cachedClient;
}

/**
 * Kết nối tới MongoDB sử dụng MongoDB Client
 * @returns Promise với đối tượng client và db
 */
export async function connectToDatabase(): Promise<{ client: MongoClient | null; db: Db | null }> {
    if (cachedClient.client && cachedClient.db) {
        return { client: cachedClient.client, db: cachedClient.db };
    }

    if (!cachedClient.promise) {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vanlang-budget';
        console.log('Trying to connect to MongoDB at:', MONGODB_URI);

        try {
            const client = new MongoClient(MONGODB_URI);
            cachedClient.promise = client.connect()
                .then((client) => {
                    const db = client.db('test');
                    console.log('MongoDB connected successfully');
                    return { client, db };
                })
                .catch(err => {
                    console.error('Failed to connect to MongoDB:', err);
                    return { client: null, db: null };
                });
        } catch (error) {
            console.error("Lỗi khởi tạo kết nối MongoDB:", error);
            // Đặt promise là null để lần sau có thể thử lại
            cachedClient.promise = Promise.resolve({ client: null, db: null });
        }
    }

    try {
        const result = await cachedClient.promise;
        if (result) {
            cachedClient.client = result.client;
            cachedClient.db = result.db;
        }
        return result || { client: null, db: null };
    } catch (e) {
        console.error("Lỗi trong quá trình kết nối MongoDB:", e);
        cachedClient.promise = null;
        // Trả về giá trị mặc định trong trường hợp lỗi
        return {
            client: null,
            db: null
        };
    }
}

declare global {
    // eslint-disable-next-line no-var
    var mongoose: MongooseCache | undefined;
    var mongoClient: MongoClientConnection | undefined;
} 