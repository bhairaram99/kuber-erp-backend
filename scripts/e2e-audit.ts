const BASE_URL = 'http://localhost:5000/api/v1';

async function request(url: string, options: any = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;

  const res = await fetch(fullUrl, {
    method: options.method || 'GET',
    headers,
    body,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runE2EAudit() {
  console.log('====================================================');
  console.log('🪵 WOOD BUSINESS ERP: END-TO-END INTEGRATION AUDIT');
  console.log('====================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition: boolean, message: string) {
    totalChecks++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedChecks++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // WORKFLOW 1: AUTHENTICATION (SUPER_ADMIN)
    // -------------------------------------------------------------
    console.log('--- Step 1: LOGIN (Super Admin) ---');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'superadmin@wooderp.com',
        password: 'Admin123!',
      },
    });
    assert(loginRes.status === 200 || loginRes.status === 201, 'Login endpoint returned 200 OK');
    const superAdminToken = loginRes.data?.data?.accessToken;
    const superAdminUser = loginRes.data?.data?.user;
    assert(!!superAdminToken, 'Super Admin JWT token issued');
    assert(superAdminUser?.email === 'superadmin@wooderp.com', 'Super admin profile verified');

    const adminAuth = {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    };

    // -------------------------------------------------------------
    // WORKFLOW 2: CREATE CATEGORY
    // -------------------------------------------------------------
    console.log('\n--- Step 2: CREATE CATEGORY ---');
    const catRes = await request('/categories', {
      method: 'POST',
      ...adminAuth,
      body: {
        name: `Exotic Hardwood ${Date.now()}`,
        description: 'Premium imported timber and hard species',
        status: 'ACTIVE',
      },
    });
    assert(catRes.ok, 'Category creation API returned 201 Created');
    const categoryId = catRes.data?.data?._id;
    assert(!!categoryId, `Category created with ID: ${categoryId}`);

    // -------------------------------------------------------------
    // WORKFLOW 3: CREATE PRODUCT
    // -------------------------------------------------------------
    console.log('\n--- Step 3: CREATE PRODUCT ---');
    const prodSku = `TEAK-E2E-${Date.now().toString().slice(-4)}`;
    const prodRes = await request('/products', {
      method: 'POST',
      ...adminAuth,
      body: {
        name: 'Burma Teak Wood Sawn Flitch',
        sku: prodSku,
        categoryId,
        woodType: 'TEAK',
        grade: 'A',
        quality: 'EXPORT_GRADE',
        thickness: 75,
        width: 150,
        length: 2400,
        unit: 'cft',
        purchasePrice: 1200,
        sellingPrice: 2200,
        taxPercentage: 18,
        openingStock: 0,
        minimumStock: 10,
        maximumStock: 500,
        location: 'Yard Bay A-12',
        status: 'ACTIVE',
      },
    });
    assert(prodRes.ok, 'Product creation API returned 201 Created');
    const productId = prodRes.data?.data?._id;
    assert(prodRes.data?.data?.currentStock === 0, 'New product initial stock is exactly 0 cft');
    assert(prodRes.data?.data?.sku === prodSku, 'Product SKU properly stored');

    // -------------------------------------------------------------
    // WORKFLOW 4: CREATE CUSTOMER & SUPPLIER
    // -------------------------------------------------------------
    console.log('\n--- Step 4: CREATE CUSTOMER & SUPPLIER ---');
    const custRes = await request('/customers', {
      method: 'POST',
      ...adminAuth,
      body: {
        name: 'Apex Woodcraft & Furnishings',
        phone: '+91 9822011223',
        email: `apex_${Date.now()}@example.com`,
        company: 'Apex Furnishings LLP',
        address: 'Plot 45, GIDC Industrial Estate, Surat',
        city: 'Surat',
        state: 'Gujarat',
        customerType: 'WHOLESALE',
        taxNumber: '24AAAAA1234A1Z5',
        creditLimit: 500000,
      },
    });
    assert(custRes.ok, 'Customer creation API returned 201 Created');
    const customerId = custRes.data?.data?._id;
    assert(!!customerId, `Customer created with ID: ${customerId}`);

    const suppList = await request('/suppliers', adminAuth);
    let supplierId = suppList.data?.data?.[0]?._id;
    if (!supplierId) {
      const suppRes = await request('/suppliers', {
        method: 'POST',
        ...adminAuth,
        body: {
          name: 'Gujarat Timber Importers',
          phone: '+91 9822099887',
          email: 'info@gujarattimber.com',
          company: 'Gujarat Timber Corporation',
          address: 'Port Road, Kandla, Gujarat',
          taxNumber: '24BBBBB5678B1Z6',
        },
      });
      supplierId = suppRes.data?.data?._id;
    }
    assert(!!supplierId, `Supplier verified with ID: ${supplierId}`);

    // -------------------------------------------------------------
    // WORKFLOW 5: CREATE PURCHASE ORDER & VERIFY STOCK INCREASE
    // -------------------------------------------------------------
    console.log('\n--- Step 5: CREATE PURCHASE & VERIFY STOCK INCREASE ---');
    const purchaseRes = await request('/purchases', {
      method: 'POST',
      ...adminAuth,
      body: {
        supplierId,
        items: [
          {
            productId,
            quantity: 50,
            purchasePrice: 1200,
            taxPercentage: 18,
          },
        ],
        discount: 0,
        paidAmount: 40000,
        paymentMethod: 'BANK_TRANSFER',
        notes: 'Consignment of Burma Teak Flitches',
      },
    });
    assert(purchaseRes.ok, 'Purchase PO creation API returned 201 Created');
    const purchaseId = purchaseRes.data?.data?._id;
    assert(!!purchaseId, `Purchase PO created with ID: ${purchaseId}`);
    assert(purchaseRes.data?.data?.total === 70800, 'Purchase total correctly calculated (60,000 + 18% GST)');
    assert(purchaseRes.data?.data?.dueAmount === 30800, 'Purchase due balance correctly calculated (70,800 - 40,000)');

    // Verify Stock Increase
    const checkStock1 = await request(`/products/${productId}`, adminAuth);
    assert(
      checkStock1.data?.data?.currentStock === 50,
      `Stock INCREASE verified: Burma Teak stock is now 50 cft (was 0)`,
    );

    // -------------------------------------------------------------
    // WORKFLOW 6: CREATE SALE INVOICE & VERIFY STOCK DECREASE
    // -------------------------------------------------------------
    console.log('\n--- Step 6: CREATE SALE & VERIFY STOCK DECREASE ---');
    const saleRes = await request('/sales', {
      method: 'POST',
      ...adminAuth,
      body: {
        customerId,
        items: [
          {
            productId,
            quantity: 15,
            sellingPrice: 2200,
            discount: 0,
            taxPercentage: 18,
          },
        ],
        discount: 0,
        paidAmount: 20000,
        paymentMethod: 'CASH',
        notes: 'Delivered to Surat workshop',
      },
    });
    assert(saleRes.ok, 'Sale invoice creation API returned 201 Created');
    const saleId = saleRes.data?.data?._id;
    assert(!!saleId, `Sale invoice created with ID: ${saleId}`);
    assert(saleRes.data?.data?.total === 38940, 'Sale total correctly calculated (33,000 + 18% GST = 38,940)');
    assert(saleRes.data?.data?.dueAmount === 18940, 'Sale due balance correctly calculated (38,940 - 20,000 = 18,940)');
    assert(saleRes.data?.data?.costOfGoodsSold === 18000, 'Authoritative COGS calculated: 15 * ₹1,200 = ₹18,000');
    assert(saleRes.data?.data?.grossProfit === 15000, 'Authoritative Gross Profit calculated: ₹33,000 - ₹18,000 = ₹15,000');

    // Verify Stock Decrease
    const checkStock2 = await request(`/products/${productId}`, adminAuth);
    assert(
      checkStock2.data?.data?.currentStock === 35,
      `Stock DECREASE verified: Burma Teak stock is now 35 cft (50 - 15 = 35)`,
    );

    // -------------------------------------------------------------
    // WORKFLOW 7: VERIFY CUSTOMER BALANCE
    // -------------------------------------------------------------
    console.log('\n--- Step 7: VERIFY CUSTOMER BALANCE ---');
    const custProfile = await request(`/customers/${customerId}`, adminAuth);
    assert(
      custProfile.data?.data?.totalPurchases === 38940,
      `Customer totalPurchases updated to: ₹${custProfile.data?.data?.totalPurchases}`,
    );
    assert(
      custProfile.data?.data?.totalPaid === 20000,
      `Customer totalPaid updated to: ₹${custProfile.data?.data?.totalPaid}`,
    );
    assert(
      custProfile.data?.data?.totalDue === 18940,
      `Customer totalDue balance is accurately ₹18,940`,
    );

    // -------------------------------------------------------------
    // WORKFLOW 8: RECORD PAYMENT & VERIFY BALANCE SETTLEMENT
    // -------------------------------------------------------------
    console.log('\n--- Step 8: VERIFY PAYMENT SETTLEMENT ---');
    const payRes = await request('/payments', {
      method: 'POST',
      ...adminAuth,
      body: {
        type: 'RECEIVED',
        customerId,
        amount: 18940,
        paymentMethod: 'UPI',
        notes: 'Settlement of remaining invoice balance via GPay',
      },
    });
    assert(payRes.ok, 'Payment receipt recorded successfully');
    assert(payRes.data?.data?.amount === 18940, 'Customer payment receipt recorded for ₹18,940');

    const custSettled = await request(`/customers/${customerId}`, adminAuth);
    assert(
      custSettled.data?.data?.totalDue === 0,
      'Customer totalDue balance is now exactly ₹0 after full settlement',
    );
    assert(
      custSettled.data?.data?.totalPaid === 38940,
      'Customer totalPaid reflects complete payment of ₹38,940',
    );

    // -------------------------------------------------------------
    // WORKFLOW 9: VERIFY CENTRAL TRANSACTIONS
    // -------------------------------------------------------------
    console.log('\n--- Step 9: VERIFY CENTRAL TRANSACTIONS LEDGER ---');
    const txList = await request('/transactions?limit=20', adminAuth);
    const txItems = txList.data?.data || [];
    const invoiceNum = saleRes.data?.data?.invoiceNumber;
    const purchaseNum = purchaseRes.data?.data?.purchaseNumber;
    const paymentNum = payRes.data?.data?.paymentNumber;

    const saleTx = txItems.find(
      (t: any) =>
        t.type === 'SALE' &&
        (t.referenceId === saleId || t.referenceId === invoiceNum),
    );
    const purchaseTx = txItems.find(
      (t: any) =>
        t.type === 'PURCHASE' &&
        (t.referenceId === purchaseId || t.referenceId === purchaseNum),
    );
    const payTx = txItems.find(
      (t: any) =>
        t.type === 'PAYMENT_RECEIVED' &&
        (t.referenceId === payRes.data?.data?._id || t.referenceId === paymentNum),
    );
    assert(!!saleTx, 'Central transaction ledger contains corresponding SALE entry');
    assert(!!purchaseTx, 'Central transaction ledger contains corresponding PURCHASE entry');
    assert(!!payTx, 'Central transaction ledger contains corresponding PAYMENT_RECEIVED entry');

    // -------------------------------------------------------------
    // WORKFLOW 10: VERIFY AUDIT LOGS
    // -------------------------------------------------------------
    console.log('\n--- Step 10: VERIFY AUDIT LOGS ---');
    const auditList = await request('/audit-logs?limit=20', adminAuth);
    const auditItems = auditList.data?.data || [];
    const prodAudit = auditItems.find((a: any) => a.module === 'PRODUCTS' && a.entityId === productId);
    const saleAudit = auditItems.find((a: any) => a.module === 'SALES' && (a.entityId === saleId || a.entityId === invoiceNum));
    const custAudit = auditItems.find((a: any) => a.module === 'CUSTOMERS' && a.entityId === customerId);
    assert(!!prodAudit, 'Audit log recorded product creation');
    assert(!!saleAudit, 'Audit log recorded sale creation');
    assert(!!custAudit, 'Audit log recorded customer registration');

    // -------------------------------------------------------------
    // WORKFLOW 11: VERIFY REPORTS & PROFIT CALCULATIONS
    // -------------------------------------------------------------
    console.log('\n--- Step 11: VERIFY REPORTS & FINANCIAL AGGREGATIONS ---');
    const pnlReport = await request('/reports/profit-loss', adminAuth);
    const pnl = pnlReport.data?.data;
    assert(pnl.revenue > 0, `Profit & Loss report computes gross revenue: ₹${pnl.revenue.toLocaleString()}`);
    assert(pnl.costOfGoodsSold > 0, `Profit & Loss report computes COGS: ₹${pnl.costOfGoodsSold.toLocaleString()}`);
    assert(pnl.grossProfit > 0, `Profit & Loss report computes gross profit: ₹${pnl.grossProfit.toLocaleString()}`);

    const dashboardSummary = await request('/reports/dashboard', adminAuth);
    assert(dashboardSummary.data?.data?.kpi?.totalSales > 0, 'Dashboard KPI totalSales aggregation verified');
    assert(dashboardSummary.data?.data?.kpi?.currentStockValue > 0, 'Dashboard KPI currentStockValue verified');

    // -------------------------------------------------------------
    // WORKFLOW 12: ROLE-BASED ACCESS CONTROL AUDIT (ADMIN, MANAGER, STAFF, CUSTOM)
    // -------------------------------------------------------------
    console.log('\n--- Step 12: ROLE-BASED ACCESS CONTROL & AUTHORIZATION AUDIT ---');

    // Test MANAGER:
    console.log('  Testing MANAGER role...');
    const managerLogin = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'manager@wooderp.com',
        password: 'Admin123!',
      },
    });
    const managerToken = managerLogin.data?.data?.accessToken;
    const managerAuth = {
      headers: { Authorization: `Bearer ${managerToken}` },
    };

    // Manager CAN view products
    const mgrProd = await request('/products', managerAuth);
    assert(mgrProd.status === 200, 'Manager CAN view products');

    // Manager CANNOT manage users (403 Forbidden)
    const mgrUsers = await request('/users', managerAuth);
    assert(mgrUsers.status === 403, 'Manager correctly received 403 FORBIDDEN on /users');

    // Manager CANNOT update settings (403 Forbidden)
    const mgrSettings = await request('/settings', {
      method: 'PATCH',
      ...managerAuth,
      body: { businessName: 'Hacked' },
    });
    assert(mgrSettings.status === 403, 'Manager correctly received 403 FORBIDDEN on /settings update');

    // Test STAFF:
    console.log('  Testing STAFF role...');
    const staffLogin = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'staff@wooderp.com',
        password: 'Staff123!',
      },
    });
    const staffToken = staffLogin.data?.data?.accessToken;
    const staffAuth = {
      headers: { Authorization: `Bearer ${staffToken}` },
    };

    // Staff CAN view products
    const staffProd = await request('/products', staffAuth);
    assert(staffProd.status === 200, 'Staff CAN view products');

    // Staff CANNOT view reports (403 Forbidden)
    const staffReports = await request('/reports/profit-loss', staffAuth);
    assert(staffReports.status === 403, 'Staff correctly received 403 FORBIDDEN on /reports/profit-loss');

    // Staff CANNOT reset inventory baseline (403 Forbidden)
    const staffReset = await request('/inventory/reset', {
      method: 'POST',
      ...staffAuth,
      body: {
        productId,
        newStock: 999,
        reason: 'Illegal reset attempt',
      },
    });
    assert(staffReset.status === 403, 'Staff correctly received 403 FORBIDDEN on /inventory/reset');

    // Staff CANNOT access audit logs (403 Forbidden)
    const staffAudit = await request('/audit-logs', staffAuth);
    assert(staffAudit.status === 403, 'Staff correctly received 403 FORBIDDEN on /audit-logs');

    // Test CUSTOM ROLE:
    console.log('  Testing CUSTOM ROLE creation and enforcement...');
    const customRoleRes = await request('/roles', {
      method: 'POST',
      ...adminAuth,
      body: {
        name: `CASHIER_${Date.now()}`,
        description: 'Cashier with sales access only',
        permissions: ['products.view', 'sales.view', 'sales.create', 'customers.view'],
      },
    });
    const customRoleId = customRoleRes.data?.data?._id;
    assert(!!customRoleId, `Custom role created: ${customRoleRes.data?.data?.name}`);

    // Create a new user with this custom role
    const customUserEmail = `cashier_${Date.now()}@wooderp.com`;
    const customUserRes = await request('/users', {
      method: 'POST',
      ...adminAuth,
      body: {
        name: 'Custom Cashier User',
        email: customUserEmail,
        password: 'Cashier123!',
        roleId: customRoleId,
        status: 'ACTIVE',
      },
    });
    assert(!!customUserRes.data?.data?._id, 'User with custom role created');

    // Login as the Custom Cashier
    const cashierLogin = await request('/auth/login', {
      method: 'POST',
      body: {
        email: customUserEmail,
        password: 'Cashier123!',
      },
    });
    const cashierToken = cashierLogin.data?.data?.accessToken;
    const cashierAuth = {
      headers: { Authorization: `Bearer ${cashierToken}` },
    };

    // Custom Cashier CAN view products
    const cashierProd = await request('/products', cashierAuth);
    assert(cashierProd.status === 200, 'Custom Cashier CAN view products');

    // Custom Cashier CANNOT view purchases (403 Forbidden)
    const cashierPurchases = await request('/purchases', cashierAuth);
    assert(cashierPurchases.status === 403, 'Custom Cashier correctly received 403 FORBIDDEN on /purchases');

    // Custom Cashier CANNOT adjust inventory (403 Forbidden)
    const cashierAdjust = await request('/inventory/adjust', {
      method: 'POST',
      ...cashierAuth,
      body: {
        productId,
        type: 'DAMAGE',
        quantity: 1,
        reason: 'Unauthorized adjust',
      },
    });
    assert(cashierAdjust.status === 403, 'Custom Cashier correctly received 403 FORBIDDEN on /inventory/adjust');

    console.log('\n====================================================');
    console.log(`🎉 ALL INTEGRATION AUDIT WORKFLOWS & RBAC PASSED!`);
    console.log(`Total Checks: ${totalChecks} | Passed: ${passedChecks} | Failed: 0`);
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('\n❌ AUDIT FAILED WITH ERROR:', err.message);
    process.exit(1);
  }
}

runE2EAudit();
