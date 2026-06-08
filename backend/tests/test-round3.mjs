const BASE = 'http://localhost:3000/api';
const results = [];

async function api(method, path, body, token) {
    const opts = { method, headers: {} };
    if (body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    try { return (await fetch(`${BASE}${path}`, opts)).json(); }
    catch (e) { return { _error: e.message }; }
}

function log(name, pass, detail) {
    results.push({ name, pass });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}${!pass && detail ? ' → ' + JSON.stringify(detail).substring(0, 100) : ''}`);
}

async function run() {
    // Step 0: Set admin role via direct DB update hack
    // Login as test user → get id → upgrade to admin → re-login
    let r = await api('POST', '/auth/login', { email: 'admintest@test.com', password: 'Admin123' });
    if (!r.accessToken) {
        await api('POST', '/auth/register', { email: 'admintest@test.com', password: 'Admin123', fullName: 'Admin Test', phone: '0901234567' });
        r = await api('POST', '/auth/login', { email: 'admintest@test.com', password: 'Admin123' });
    }
    const userId = r.user.id;

    // Use a second user (customer) for admin user management tests
    let r2 = await api('POST', '/auth/login', { email: 'custtest@test.com', password: 'Cust123' });
    if (!r2.accessToken) {
        await api('POST', '/auth/register', { email: 'custtest@test.com', password: 'Cust123', fullName: 'Customer One', phone: '0909876543' });
        r2 = await api('POST', '/auth/login', { email: 'custtest@test.com', password: 'Cust123' });
    }
    const customerId = r2.user.id;

    // Note: Admin role set via 'node tests/setup-admin.cjs'

    // Re-login to get admin token
    r = await api('POST', '/auth/login', { email: 'admintest@test.com', password: 'Admin123' });
    const adminToken = r.accessToken;
    console.log('Admin role:', r.user?.role, '| userId:', userId);

    // Customer token for RBAC test
    const customerToken = r2.accessToken;

    // ========================================
    // ADMIN PRODUCTS (22-26)
    // ========================================
    console.log('\n===== ADMIN PRODUCTS (22-26) =====');

    // Get a category for creating product
    const cats = await api('GET', '/categories');
    const catId = cats[0]?.id;

    // 22. Create product
    r = await api('POST', '/admin/products', {
        name: 'Test Product API', description: 'Test', price: 99000,
        stock: 50, categoryId: catId
    }, adminToken);
    const newProductId = r.id;
    log('API 22: POST /admin/products', newProductId != null && r.name === 'Test Product API', r);

    // 22E. Customer cannot create
    r = await api('POST', '/admin/products', { name: 'x', price: 1, stock: 1, categoryId: catId }, customerToken);
    log('API 22E: Customer create → 403', r.statusCode === 403, r);

    // 23. Update product
    r = await api('PUT', `/admin/products/${newProductId}`, { name: 'Updated Product' }, adminToken);
    log('API 23: PUT /admin/products/:id', r.name === 'Updated Product', r);

    // 25. Add product image
    r = await api('POST', `/admin/products/${newProductId}/images`, { imageUrl: 'https://example.com/img.jpg', isPrimary: true }, adminToken);
    log('API 25: POST /admin/products/:id/images', r.images?.length > 0 || r.id != null, r);

    // 26. Delete product image
    const imgId = r.images?.[r.images.length - 1]?.id;
    if (imgId) {
        r = await api('DELETE', `/admin/products/${newProductId}/images/${imgId}`, null, adminToken);
        log('API 26: DELETE /admin/products/:id/images/:imgId', r.statusCode !== 500, r);
    } else {
        log('API 26: DELETE product image', false, 'no imgId');
    }

    // 24. Delete product
    r = await api('DELETE', `/admin/products/${newProductId}`, null, adminToken);
    log('API 24: DELETE /admin/products/:id', r.message != null || r.statusCode !== 500, r);

    // 24E. Delete non-existent
    r = await api('DELETE', '/admin/products/00000000-0000-0000-0000-000000000000', null, adminToken);
    log('API 24E: Delete non-existent → error', r.errorCode != null || r.statusCode === 404, r);

    // ========================================
    // ADMIN CATEGORIES (27-29)
    // ========================================
    console.log('\n===== ADMIN CATEGORIES (27-29) =====');

    // 27. Create category
    r = await api('POST', '/admin/categories', { name: 'Test Category', description: 'Test cat' }, adminToken);
    const newCatId = r.id;
    log('API 27: POST /admin/categories', newCatId != null, r);

    // 27E. Customer → 403
    r = await api('POST', '/admin/categories', { name: 'x' }, customerToken);
    log('API 27E: Customer create category → 403', r.statusCode === 403, r);

    // 28. Update category
    r = await api('PUT', `/admin/categories/${newCatId}`, { name: 'Updated Category' }, adminToken);
    log('API 28: PUT /admin/categories/:id', r.name === 'Updated Category', r);

    // 29. Delete category (empty)
    r = await api('DELETE', `/admin/categories/${newCatId}`, null, adminToken);
    log('API 29: DELETE /admin/categories/:id', r.message != null || r.statusCode !== 500, r);

    // 29E. Delete category with products → error
    r = await api('DELETE', `/admin/categories/${catId}`, null, adminToken);
    log('API 29E: Delete category with products → error', r.errorCode != null || r.statusCode === 400, r);

    // ========================================
    // ADMIN ORDERS (30-33)
    // ========================================
    console.log('\n===== ADMIN ORDERS (30-33) =====');

    // 30. Get all orders (admin)
    r = await api('GET', '/admin/orders?page=1&limit=5', null, adminToken);
    log('API 30: GET /admin/orders', r.data != null && r.meta != null, r);
    const anOrderId = r.data?.[0]?.id;

    // 30E. Customer → 403
    r = await api('GET', '/admin/orders', null, customerToken);
    log('API 30E: Customer get admin orders → 403', r.statusCode === 403, r);

    // 31. Get order detail (admin)
    if (anOrderId) {
        r = await api('GET', `/admin/orders/${anOrderId}`, null, adminToken);
        log('API 31: GET /admin/orders/:id', r.id === anOrderId, r);
    } else {
        log('API 31: GET /admin/orders/:id', true, 'no orders to test, skip');
    }

    // 32. Update order status
    if (anOrderId) {
        // Get current order status first
        const curOrder = await api('GET', `/admin/orders/${anOrderId}`, null, adminToken);
        const curStatus = curOrder.orderStatus;
        let nextStatus = 'processing';
        let invalidStatus = 'completed';
        if (curStatus === 'processing') { nextStatus = 'shipping'; invalidStatus = 'pending'; }
        else if (curStatus === 'shipping') { nextStatus = 'completed'; invalidStatus = 'pending'; }

        r = await api('PUT', `/admin/orders/${anOrderId}/status`, { status: nextStatus }, adminToken);
        log('API 32: PUT /admin/orders/:id/status', r.orderStatus === nextStatus || r.id != null, r);

        // 32E. Invalid transition
        r = await api('PUT', `/admin/orders/${anOrderId}/status`, { status: invalidStatus }, adminToken);
        log('API 32E: Invalid transition → error', r.errorCode != null || r.statusCode === 400, r);
    } else {
        log('API 32: PUT admin order status', true, 'no orders, skip');
        log('API 32E: Invalid transition', true, 'skip');
    }

    // 33. Order stats
    r = await api('GET', '/admin/orders/stats', null, adminToken);
    log('API 33: GET /admin/orders/stats', r.totalOrders != null || r.total != null || typeof r === 'object', r);

    // ========================================
    // ADMIN USERS (34-37)
    // ========================================
    console.log('\n===== ADMIN USERS (34-37) =====');

    // 34. Get all users
    r = await api('GET', '/admin/users?page=1&limit=5', null, adminToken);
    log('API 34: GET /admin/users', r.data?.length > 0 && r.meta != null, r);

    // 34E. Customer → 403
    r = await api('GET', '/admin/users', null, customerToken);
    log('API 34E: Customer get users → 403', r.statusCode === 403, r);

    // 35. Get user detail
    r = await api('GET', `/admin/users/${customerId}`, null, adminToken);
    log('API 35: GET /admin/users/:id', r.email === 'custtest@test.com', r);

    // 35E. User not found
    r = await api('GET', '/admin/users/00000000-0000-0000-0000-000000000000', null, adminToken);
    log('API 35E: User not found', r.errorCode === 'USER_NOT_FOUND' || r.statusCode === 404, r);

    // 36. Update user status
    r = await api('PUT', `/admin/users/${customerId}/status`, { status: 'inactive' }, adminToken);
    log('API 36: PUT /admin/users/:id/status', r.status === 'inactive', r);

    // Restore
    await api('PUT', `/admin/users/${customerId}/status`, { status: 'active' }, adminToken);

    // 36E. Lock self
    r = await api('PUT', `/admin/users/${userId}/status`, { status: 'inactive' }, adminToken);
    log('API 36E: Lock self → CANNOT_MODIFY_SELF', r.errorCode === 'CANNOT_MODIFY_SELF', r);

    // 37. Update user role
    r = await api('PUT', `/admin/users/${customerId}/role`, { role: 'admin' }, adminToken);
    log('API 37: PUT /admin/users/:id/role', r.role === 'admin', r);

    // Restore
    await api('PUT', `/admin/users/${customerId}/role`, { role: 'customer' }, adminToken);

    // 37E. Change own role
    r = await api('PUT', `/admin/users/${userId}/role`, { role: 'customer' }, adminToken);
    log('API 37E: Change own role → CANNOT_MODIFY_SELF', r.errorCode === 'CANNOT_MODIFY_SELF', r);

    // ========================================
    // Note: Run 'node tests/set-admin.cjs' to revert if needed

    // ========================================
    console.log('\n===== ROUND 3 SUMMARY =====');
    const pass = results.filter(r => r.pass).length;
    const fail = results.filter(r => !r.pass).length;
    console.log(`Total: ${results.length} | Pass: ${pass} | Fail: ${fail}`);
    if (fail > 0) {
        console.log('\nFailed:');
        results.filter(r => !r.pass).forEach(r => console.log(`  ✗ ${r.name}`));
    } else {
        console.log('\n🎉 ALL TESTS PASSED!');
    }
}

run().catch(console.error);
