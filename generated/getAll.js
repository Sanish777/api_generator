const mysql = require('mysql2/promise');

async function getAll(page = 1, limit = 10) {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });
    try {
        // Call the stored procedure
        const [results] = await connection.execute('CALL sp_get_all(?, ?)', [page, limit]);
        const data = results[0]; // Main data
        const pagination = results[1][0]; // Pagination info

        return {
            success: true,
            data: {
                all: data,
                pagination: {
                    page: pagination.currentPage,
                    limit: pagination.pageSize,
                    total: pagination.total,
                    totalPages: pagination.totalPages
                }
            },
            error: null
        };
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error.message
        };
    } finally {
        await connection.end();
    }
}