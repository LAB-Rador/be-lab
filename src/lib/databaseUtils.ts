/**
 * Утилиты для работы с базой данных в продакшене
 * Обеспечивают обработку ошибок prepared statements
 */

import { prismaClient } from './prisma.js';
import { setTimeout } from 'timers/promises';

/**
 * Выполняет операцию с базой данных с повторными попытками при ошибках prepared statements
 * @param operation Функция для выполнения
 * @param maxRetries Максимальное количество попыток (по умолчанию 2)
 * @returns Результат выполнения операции
 */
export const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 2
): Promise<T> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            const isPreparedStatementError = 
                error.message?.includes('prepared statement') ||
                error.message?.includes('does not exist') ||
                error.code === '26000';
            
            if (isPreparedStatementError && attempt < maxRetries) {
                console.log(`Database operation attempt ${attempt + 1} failed with prepared statement error, retrying...`);
                
                // Ждем экспоненциально увеличивающееся время перед повторной попыткой
                const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
                await setTimeout(delay);
                
                // В продакшене пытаемся переподключиться
                if (process.env.NODE_ENV === 'production') {
                    try {
                        await prismaClient.$disconnect();
                        // Небольшая пауза для стабилизации соединения
                        await setTimeout(500);
                    } catch (disconnectError) {
                        console.warn('Error during disconnect:', disconnectError);
                    }
                }
                
                continue;
            }
            
            // Если это не ошибка prepared statement или исчерпаны попытки
            throw error;
        }
    }
    
    // Этот код никогда не должен выполниться, но TypeScript требует возврата
    throw new Error('Max retries exceeded');
};

/**
 * Проверяет подключение к базе данных
 * @returns Promise<boolean> true если подключение успешно
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
    try {
        await prismaClient.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.error('Database connection check failed:', error);
        return false;
    }
};

/**
 * Переподключается к базе данных
 */
export const reconnectDatabase = async (): Promise<void> => {
    try {
        await prismaClient.$disconnect();
        console.log('Database disconnected successfully');
        
        // Небольшая пауза
        await setTimeout(1000);
        
        // Проверяем новое подключение
        const isConnected = await checkDatabaseConnection();
        if (isConnected) {
            console.log('Database reconnected successfully');
        } else {
            throw new Error('Failed to reconnect to database');
        }
    } catch (error) {
        console.error('Error during database reconnection:', error);
        throw error;
    }
};
