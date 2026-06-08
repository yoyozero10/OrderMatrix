const mysql = require('mysql2/promise');

async function setup() {
    // Register test users via API
    const api = async (method, path, body) => {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        return (await fetch(`http://localhost:3000/api${path}`, opts)).json();
    };

    // Register admin user
    let r = await api('POST', '/auth/register', {
        email: 'admintest@test.com', password: 'Admin123',
        fullName: 'Admin Tester', phone: '0901111111'
    });
    console.log('Register admin:', r.user?.email || r.errorCode);

    // Register customer user
    r = await api('POST', '/auth/register', {
        email: 'custtest@test.com', password: 'Cust123',
        fullName: 'Customer One', phone: '0902222222'
    });
    console.log('Register customer:', r.user?.email || r.errorCode);

    // Set admin role in DB
    const conn = await mysql.createConnection({
        host: 'localhost', port: 3307, user: 'root', password: 'daithang', database: 'ecommerce_db'
    });
    await conn.execute("UPDATE users SET role='admin' WHERE email='admintest@test.com'");
    const [rows] = await conn.query('SELECT email, role FROM users');
    console.log('\nAll users:');
    rows.forEach(u => console.log(`  ${u.email} → ${u.role}`));
    await conn.end();

    // Verify admin login
    r = await api('POST', '/auth/login', { email: 'admintest@test.com', password: 'Admin123' });
    console.log('\nAdmin login role:', r.user?.role);
    console.log('Admin user id:', r.user?.id);
}

setup().catch(console.error);
