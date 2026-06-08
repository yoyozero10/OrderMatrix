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

function log(name, pass, detail) {
    results.push({ name, pass });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}${!pass && detail ? ' → ' + JSON.stringify(detail).substring(0, 80) : ''}`);
}

async function run() {
    // Login
    let r = await api('POST', '/auth/login', { email: 'r1test@test.com', password: 'NewPass789' });
    let token = r.accessToken;
    if (!token) {
        // Register if not exists
        await api('POST', '/auth/register', {
            email: 'r1test@test.com', password: 'NewPass789',
            fullName: 'R1 Test', phone: '0901234567'
        });
        r = await api('POST', '/auth/login', { email: 'r1test@test.com', password: 'NewPass789' });
        token = r.accessToken;
    }
    console.log('Logged in:', !!token);

    // Get a product
    r = await api('GET', '/products?page=1&limit=5');
    const product1 = r.data[0];
    const product2 = r.data[1];
    console.log(`Products: ${product1?.name} (${product1?.id}), ${product2?.name} (${product2?.id})\n`);

    console.log('===== CART APIs (12-17) =====');

    // 12. Add to cart
    r = await api('POST', '/cart/items', { productId: product1.id, quantity: 2 }, token);
    log('API 12: POST /cart/items (add)', r.items?.length > 0 || r.id != null, r);

    // 12b. Add second product
    r = await api('POST', '/cart/items', { productId: product2.id, quantity: 1 }, token);
    log('API 12b: Add second product', r.items?.length >= 2 || r.id != null, r);

    // 12E. Add without token
    r = await api('POST', '/cart/items', { productId: product1.id, quantity: 1 });
    log('API 12E: Add to cart no token → 401', r.statusCode === 401, r);

    // 12V. Validation - missing productId
    r = await api('POST', '/cart/items', { quantity: 1 }, token);
    log('API 12V: Add cart missing productId → error', r.errorCode != null || r.statusCode === 400, r);

    // 13. Get cart
    r = await api('GET', '/cart', null, token);
    log('API 13: GET /cart', r.items?.length >= 2 || Array.isArray(r.items), r);
    const cartItemId = r.items?.[0]?.id;

    // 13E. Get cart no token
    r = await api('GET', '/cart');
    log('API 13E: GET /cart no token → 401', r.statusCode === 401, r);

    // 14. Update cart item quantity
    if (cartItemId) {
        r = await api('PUT', `/cart/items/${cartItemId}`, { quantity: 3 }, token);
        log('API 14: PUT /cart/items/:id', r.items != null || r.id != null, r);
    } else {
        log('API 14: PUT /cart/items/:id', false, 'no cartItemId');
    }

    // 14E. Update non-existent cart item
    r = await api('PUT', '/cart/items/00000000-0000-0000-0000-000000000000', { quantity: 1 }, token);
    log('API 14E: Update non-existent → error', r.errorCode != null || r.statusCode === 404, r);

    // 15. Delete cart item (delete the second product)
    const cart = await api('GET', '/cart', null, token);
    const secondItemId = cart.items?.[1]?.id || cart.items?.[0]?.id;
    if (secondItemId) {
        r = await api('DELETE', `/cart/items/${secondItemId}`, null, token);
        log('API 15: DELETE /cart/items/:id', r.items != null || r.statusCode !== 500, r);
    } else {
        log('API 15: DELETE /cart/items/:id', false, 'no secondItemId');
    }

    // 16. Clear cart - then re-add for orders
    r = await api('DELETE', '/cart', null, token);
    log('API 16: DELETE /cart (clear)', r.message != null || Array.isArray(r.items), r);

    // Re-add to cart for orders test
    await api('POST', '/cart/items', { productId: product1.id, quantity: 1 }, token);
    await api('POST', '/cart/items', { productId: product2.id, quantity: 1 }, token);

    console.log('\n===== ORDER APIs (18-22) =====');

    // 17/18. Checkout → Create order
    r = await api('POST', '/orders', {
        shippingAddress: { fullName: 'Test User', phone: '0901234567', address: '123 Test St', city: 'HCM' },
        paymentMethod: 'COD'
    }, token);
    const orderId = r.id;
    const orderCode = r.orderCode;
    log('API 18: POST /orders/checkout', orderId != null && orderCode != null, r);

    // 18E. Checkout empty cart
    r = await api('POST', '/orders', {
        shippingAddress: { fullName: 'Test', phone: '0901234567', address: '456 St', city: 'HN' },
        paymentMethod: 'COD'
    }, token);
    log('API 18E: Checkout empty cart → error', r.errorCode === 'ORDER_CART_EMPTY', r);

    // 18E2. Checkout no token
    r = await api('POST', '/orders', { shippingAddress: { fullName: 'x', phone: '0', address: 'x', city: 'x' }, paymentMethod: 'COD' });
    log('API 18E2: Checkout no token → 401', r.statusCode === 401, r);

    // 19. Get orders
    r = await api('GET', '/orders?page=1&limit=10', null, token);
    log('API 19: GET /orders', r.data?.length > 0 && r.meta?.total > 0, r);

    // 19b. Filter by status
    r = await api('GET', '/orders?orderStatus=pending', null, token);
    log('API 19b: GET /orders?status=pending', r.data?.length >= 0, r);

    // 20. Get order detail
    r = await api('GET', `/orders/${orderId}`, null, token);
    log('API 20: GET /orders/:id', r.id === orderId, r);

    // 20E. Order not found
    r = await api('GET', '/orders/00000000-0000-0000-0000-000000000000', null, token);
    log('API 20E: Order not found', r.errorCode === 'ORDER_NOT_FOUND' || r.statusCode === 404, r);

    // 21. Cancel order (user)
    // Create another order to cancel
    await api('POST', '/cart/items', { productId: product1.id, quantity: 1 }, token);
    const cancelOrder = await api('POST', '/orders', {
        shippingAddress: { fullName: 'Cancel Test', phone: '0901234567', address: '456 Cancel St', city: 'HCM' },
        paymentMethod: 'COD'
    }, token);
    if (cancelOrder.id) {
        r = await api('PUT', `/orders/${cancelOrder.id}/cancel`, null, token);
        log('API 21: PUT /orders/:id/cancel', r.orderStatus === 'cancelled', r);

        // 21E. Cancel already cancelled
        r = await api('PUT', `/orders/${cancelOrder.id}/cancel`, null, token);
        log('API 21E: Cancel already cancelled → error', r.errorCode != null || r.statusCode === 400, r);
    } else {
        log('API 21: PUT /orders/:id/cancel', false, cancelOrder);
        log('API 21E: Cancel already cancelled', false, 'skipped');
    }

    // 22E. Business logic: oversell test
    // Get current stock of product1
    const productDetail = await api('GET', `/products/${product1.id}`);
    const stock = productDetail.stock;
    await api('POST', '/cart/items', { productId: product1.id, quantity: stock + 100 }, token);
    r = await api('POST', '/orders', {
        shippingAddress: { fullName: 'Oversell', phone: '0', address: 'x', city: 'x' },
        paymentMethod: 'COD'
    }, token);
    log('API 22E: Oversell → CART_OUT_OF_STOCK', r.errorCode === 'CART_OUT_OF_STOCK', r);

    // Clear cart after test
    await api('DELETE', '/cart', null, token);

    // ========================================
    console.log('\n===== ROUND 2 SUMMARY =====');
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
