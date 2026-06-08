$base = "http://localhost:3000/api"
$results = @()

function Log($name, $pass) {
    $icon = if ($pass) { "PASS" } else { "FAIL" }
    $script:results += @{ name = $name; pass = $pass }
    Write-Host "[$icon] $name"
}

function Api($method, $path, $body, $token) {
    $a = @("-s", "-X", $method, "$base$path")
    if ($body) { $a += @("-H", "Content-Type: application/json", "-d", $body) }
    if ($token) { $a += @("-H", "Authorization: Bearer $token") }
    $resp = & curl.exe @a 2>$null
    return $resp | ConvertFrom-Json
}

# Delete test user if exists
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pdaithang -e "DELETE FROM ecommerce_db.users WHERE email='testapi@test.com';" 2>$null

Write-Host "`n===== AUTH APIs (1-7) + Error Cases ====="

# 1. Register
$r = Api "POST" "/auth/register" '{"email":"testapi@test.com","password":"Test123456","fullName":"Test User","phone":"0901234567"}'
Log "API 1: Register" ($null -ne $r.user -and $r.user.email -eq 'testapi@test.com')

# 1E. Duplicate email
$r = Api "POST" "/auth/register" '{"email":"testapi@test.com","password":"Test123456","fullName":"Test","phone":"0901234567"}'
Log "API 1E: Duplicate email (AUTH_EMAIL_EXISTS)" ($r.errorCode -eq 'AUTH_EMAIL_EXISTS')

# 1V. Validation - empty body
$r = Api "POST" "/auth/register" '{}'
Log "API 1V: Validation error" ($r.errorCode -eq 'VALIDATION_ERROR')

# 2. Login
$r = Api "POST" "/auth/login" '{"email":"testapi@test.com","password":"Test123456"}'
$token = $r.accessToken
$refresh = $r.refreshToken
Log "API 2: Login" ($null -ne $token -and $token.Length -gt 10)

# 2E. Wrong password
$r = Api "POST" "/auth/login" '{"email":"testapi@test.com","password":"wrongpass"}'
Log "API 2E: Wrong password (AUTH_INVALID_CREDENTIALS)" ($r.errorCode -eq 'AUTH_INVALID_CREDENTIALS')

# 2E2. Non-existent email
$r = Api "POST" "/auth/login" '{"email":"notexist@x.com","password":"123456"}'
Log "API 2E2: Non-existent email" ($r.errorCode -eq 'AUTH_INVALID_CREDENTIALS')

# 3. Profile
$r = Api "GET" "/auth/profile" $null $token
Log "API 3: Get profile" ($r.email -eq 'testapi@test.com')

# 3E. Unauthorized (no token)
$r = Api "GET" "/auth/profile"
Log "API 3E: No token (401)" ($r.statusCode -eq 401)

# 4. Update profile
$r = Api "PUT" "/auth/profile" '{"fullName":"Updated User"}' $token
Log "API 4: Update profile" ($r.fullName -eq 'Updated User')

# 5. Refresh token
$rBody = "{""refreshToken"":""$refresh""}"
$r = Api "POST" "/auth/refresh" $rBody
Log "API 5: Refresh token" ($null -ne $r.accessToken -and $r.accessToken.Length -gt 10)
$token = $r.accessToken  # use new token

# 5E. Invalid refresh token
$r = Api "POST" "/auth/refresh" '{"refreshToken":"invalid.jwt.token"}'
Log "API 5E: Invalid refresh (401)" ($r.statusCode -eq 401)

# 6. Forgot password
$r = Api "POST" "/auth/forgot-password" '{"email":"testapi@test.com"}'
Log "API 6: Forgot password" ($null -ne $r.message)

# 7. Logout
$r = Api "POST" "/auth/logout" $null $token
Log "API 7: Logout" ($null -ne $r.message)

Write-Host "`n===== PUBLIC APIs (8-11) ====="

# Re-login
$r = Api "POST" "/auth/login" '{"email":"testapi@test.com","password":"Test123456"}'
$token = $r.accessToken

# 8. Get products (paginated)
$r = Api "GET" "/products?page=1&limit=5"
Log "API 8: Get products" ($r.data.Count -gt 0 -and $r.meta.total -gt 0)
$productId = $r.data[0].id

# 9. Product detail
$r = Api "GET" "/products/$productId"
Log "API 9: Product detail" ($null -ne $r.name -and $null -ne $r.id)

# 9E. Product not found
$r = Api "GET" "/products/00000000-0000-0000-0000-000000000000"
Log "API 9E: Product not found (PRODUCT_NOT_FOUND)" ($r.errorCode -eq 'PRODUCT_NOT_FOUND')

# 10. Search products
$r = Api "GET" "/products?search=a&page=1&limit=5"
Log "API 10: Search products" ($null -ne $r.meta)

# 10b. Filter by category
$cats = Api "GET" "/categories"
if ($cats.Count -gt 0) {
    $catId = $cats[0].id
    $r = Api "GET" "/products?categoryId=$catId&page=1&limit=5"
    Log "API 10b: Filter by category" ($null -ne $r.meta)
}

# 11. Get categories
Log "API 11: Get categories" ($cats.Count -gt 0)

# ========================================
Write-Host "`n===== ROUND 1 SUMMARY ====="
$pass = ($results | Where-Object { $_.pass }).Count
$fail = ($results | Where-Object { -not $_.pass }).Count
$total = $results.Count
Write-Host "Total: $total | Pass: $pass | Fail: $fail"
if ($fail -gt 0) {
    Write-Host "`nFailed:"
    $results | Where-Object { -not $_.pass } | ForEach-Object { Write-Host "  X $($_.name)" }
}
