const mysql = require('mysql2/promise');

async function setAdmin() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'daithang',
        database: 'ecommerce_db',
    });
    await conn.execute("UPDATE users SET role='admin' WHERE email='r1test@test.com'");
    const [rows] = await conn.execute("SELECT email, role FROM users WHERE email='r1test@test.com'");
    console.log('Updated:', rows[0]);
    await conn.end();
}

setAdmin().catch(console.error);
