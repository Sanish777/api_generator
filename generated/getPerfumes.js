const mysql = require('mysql2/promise');
require('dotenv').config();

async function getPerfumes(page = 1, limit = 10) {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        const [results] = await connection.execute(
            'CALL sp_get_perfumes(?, ?, @total)',
            [page, limit]
        );

        const [totalResult] = await connection.execute('SELECT @total as total');
        const total = totalResult[0].total;

        return {
            success: true,
            data: {
                perfumes: results[0],
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    totalPages: Math.ceil(total / limit)
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
        if (connection) {
            await connection.end();
        }
    }
}

module.exports = { getPerfumes };
