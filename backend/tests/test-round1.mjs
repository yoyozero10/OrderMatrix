const BASE = 'http://localhost:3000/api';
const results = [];

async function api(method, path, body, token) {
    const opts = { method, headers: {} };
    if (body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    try {
        const res = await fetch(`${BASE}${path}`, opts);
        return res.json();
    } catch (e) {
        return { _error: e.message };
    }
}

function log(name, pass) {
    results.push({ name, pass });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}`);
}

async function run() {
    console.log('\n===== AUTH APIs (1-7) + Error Cases =====');

    // 1. Register
    let r = await api('POST', '/auth/register', {
        email: 'r1test@test.com', password: 'Test123456',
        fullName: 'R1 Test User', phone: '0901234567'
    });
    log('API 1: POST /auth/register', r.user?.email === 'r1test@test.com');

    // 1E. Duplicate email
    r = await api('POST', '/auth/register', {
        email: 'r1test@test.com', password: 'Test123456',
        fullName: 'Dup', phone: '0901234567'
    });
    log('API 1E: Register duplicate → AUTH_EMAIL_EXISTS', r.errorCode === 'AUTH_EMAIL_EXISTS');

    // 1V. Validation - empty body
    r = await api('POST', '/auth/register', {});
    log('API 1V: Register empty body → VALIDATION_ERROR', r.errorCode === 'VALIDATION_ERROR');

    // 2. Login
    r = await api('POST', '/auth/login', { email: 'r1test@test.com', password: 'Test123456' });
    let token = r.accessToken;
    const refresh = r.refreshToken;
    log('API 2: POST /auth/login', token?.length > 10 && refresh?.length > 10);

    // 2E. Wrong password
    r = await api('POST', '/auth/login', { email: 'r1test@test.com', password: 'wrong' });
    log('API 2E: Login wrong pass → AUTH_INVALID_CREDENTIALS', r.errorCode === 'AUTH_INVALID_CREDENTIALS');

    // 2E2. Non-existent
    r = await api('POST', '/auth/login', { email: 'nobody@x.com', password: '123' });
    log('API 2E2: Login non-existent → AUTH_INVALID_CREDENTIALS', r.errorCode === 'AUTH_INVALID_CREDENTIALS');

    // 3. Get Profile (GET /users/me)
    r = await api('GET', '/users/me', null, token);
    log('API 3: GET /users/me', r.email === 'r1test@test.com' && r.id != null);

    // 3E. Unauthorized
    r = await api('GET', '/users/me');
    log('API 3E: GET /users/me no token → 401', r.statusCode === 401);

    // 4. Update Profile (PUT /users/me)
    r = await api('PUT', '/users/me', { fullName: 'Updated R1' }, token);
    log('API 4: PUT /users/me', r.fullName === 'Updated R1');

    // 5. Refresh token
    r = await api('POST', '/auth/refresh', { refreshToken: refresh });
    log('API 5: POST /auth/refresh', r.accessToken?.length > 10);
    if (r.accessToken) token = r.accessToken;

    // 5E. Invalid refresh
    r = await api('POST', '/auth/refresh', { refreshToken: 'bad.token.here' });
    log('API 5E: Invalid refresh → 401', r.statusCode === 401);

    // 6. Forgot password
    r = await api('POST', '/auth/forgot-password', { email: 'r1test@test.com' });
    log('API 6: POST /auth/forgot-password', r.message != null);

    // 6b. Change password (PUT /users/me/password)
    r = await api('PUT', '/users/me/password', {
        oldPassword: 'Test123456', newPassword: 'NewPass789', confirmPassword: 'NewPass789'
    }, token);
    log('API 6b: PUT /users/me/password', r.message != null);

    // 6bE. Wrong old password
    r = await api('PUT', '/users/me/password', {
        oldPassword: 'wrongold', newPassword: 'xxx', confirmPassword: 'xxx'
    }, token);
    log('API 6bE: Change pass wrong old → error', r.errorCode != null);

    // 6bE2. Mismatch confirm
    r = await api('PUT', '/users/me/password', {
        oldPassword: 'NewPass789', newPassword: 'aaa', confirmPassword: 'bbb'
    }, token);
    log('API 6bE2: Password mismatch → error', r.errorCode != null);

    // Re-login with new password
    r = await api('POST', '/auth/login', { email: 'r1test@test.com', password: 'NewPass789' });
    token = r.accessToken;
    log('API 2b: Login with new password', token?.length > 10);

    // 7. Logout
    r = await api('POST', '/auth/logout', null, token);
    log('API 7: POST /auth/logout', r.message != null);

    console.log('\n===== PUBLIC APIs (8-11) =====');

    // Re-login
    r = await api('POST', '/auth/login', { email: 'r1test@test.com', password: 'NewPass789' });
    token = r.accessToken;

    // 8. Get products
    r = await api('GET', '/products?page=1&limit=5');
    log('API 8: GET /products', r.data?.length > 0 && r.meta?.total > 0);
    const productId = r.data?.[0]?.id;

    // 9. Product detail
    r = await api('GET', `/products/${productId}`);
    log('API 9: GET /products/:id', r.id === productId && r.name != null);

    // 9E. Not found
    r = await api('GET', '/products/00000000-0000-0000-0000-000000000000');
    log('API 9E: Product not found → PRODUCT_NOT_FOUND', r.errorCode === 'PRODUCT_NOT_FOUND');

    // 10. Search
    r = await api('GET', '/products?search=a&page=1&limit=5');
    log('API 10: GET /products?search=', r.meta != null);

    // 10b. Sort
    r = await api('GET', '/products?sortBy=price_asc&page=1&limit=5');
    log('API 10b: GET /products?sortBy=price_asc', r.data?.length > 0);

    // 10c. Price filter
    r = await api('GET', '/products?minPrice=100000&maxPrice=50000000&page=1&limit=5');
    log('API 10c: GET /products (price filter)', r.meta != null);

    // 11. Categories
    r = await api('GET', '/categories');
    log('API 11: GET /categories', Array.isArray(r) && r.length > 0);
    const catId = r[0]?.id;

    // 11b. Filter by category
    r = await api('GET', `/products?categoryId=${catId}&page=1&limit=5`);
    log('API 11b: GET /products?categoryId=', r.meta != null);

    // ========================================
    console.log('\n===== ROUND 1 SUMMARY =====');
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
