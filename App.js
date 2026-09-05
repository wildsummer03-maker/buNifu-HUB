import { supabase, configured } from './config.js';

/* ============================================================
   buNifu HUB
   Wendo Arts
   Management + Staff Sales System
   ============================================================ */

const sources = [
  'WhatsApp',
  'Facebook',
  'Instagram',
  'TikTok',
  'Google/Search',
  'Referral',
  'Walk-in',
  'Existing Customer',
  'Website',
  'Advertisement',
  'Event',
  'Other'
];

const statuses = [
  'Lead',
  'Confirmed',
  'Closed',
  'Cancelled'
];

let S = {
  user: null,
  profile: null,
  page: 'dashboard',
  sales: [],
  products: [],
  expenses: [],
  staff: [],
  forcedStaffId: null,
  salesFilterStaffId: ''
};


/* ============================================================
   HELPERS
   ============================================================ */

const money = n =>
  'KSh ' +
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const esc = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    x => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[x])
  );


/* ============================================================
   START
   ============================================================ */

async function start() {

  if (!configured) {
    setup();
    return;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    await loadUser(session.user);
  } else {
    renderLogin();
  }

  supabase.auth.onAuthStateChange(
    async (_, session) => {

      if (session) {
        await loadUser(session.user);
      } else {
        S.user = null;
        S.profile = null;
        S.sales = [];
        S.products = [];
        S.expenses = [];
        S.staff = [];
        renderLogin();
      }

    }
  );
}


/* ============================================================
   SETUP
   ============================================================ */

function setup() {

  document.body.innerHTML = `
    <div class="login">
      <div class="card">
        <div class="brand">
          buNifu <span>HUB</span>
        </div>

        <h2>Configuration Required</h2>

        <p>
          Connect the Supabase project before using buNifu HUB.
        </p>

        <p class="muted">
          Powered by Wendo Arts
        </p>
      </div>
    </div>
  `;
}


/* ============================================================
   LOGIN
   ============================================================ */

function renderLogin() {

  document.body.innerHTML = `
    <div class="login">

      <form class="card login-card" id="loginForm">

        <div class="brand">
          buNifu <span>HUB</span>
        </div>

        <p class="muted">
          Wendo Arts
        </p>

        <h2>Sign in</h2>

        <div class="field">
          <label>Email</label>
          <input
            id="loginEmail"
            type="email"
            autocomplete="email"
            required
          >
        </div>

        <div class="field">
          <label>Password</label>
          <input
            id="loginPassword"
            type="password"
            autocomplete="current-password"
            required
          >
        </div>

        <button
          class="btn primary full"
          type="submit"
        >
          Sign in
        </button>

        <p
          id="loginMessage"
          class="muted"
        ></p>

        <p class="muted">
          © 2026 Wendo Arts. All Rights Reserved.
        </p>

      </form>

    </div>
  `;

  document
    .querySelector('#loginForm')
    .addEventListener('submit', async e => {

      e.preventDefault();

      const email =
        document.querySelector('#loginEmail').value.trim();

      const password =
        document.querySelector('#loginPassword').value;

      const message =
        document.querySelector('#loginMessage');

      message.textContent = 'Signing in...';

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        message.textContent = error.message;
      }

    });
}


/* ============================================================
   USER
   ============================================================ */

async function loadUser(user) {

  S.user = user;

  const { data, error } =
    await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

  if (error) {

    document.body.innerHTML = `
      <div class="login">
        <div class="card">
          <div class="brand">
            buNifu <span>HUB</span>
          </div>

          <h2>Profile Error</h2>

          <p>${esc(error.message)}</p>

          <button
            class="btn"
            onclick="location.reload()"
          >
            Try Again
          </button>
        </div>
      </div>
    `;

    return;
  }

  S.profile = data;

  await loadData();

  render();
}


/* ============================================================
   LOAD DATA
   ============================================================ */

async function loadData() {

  if (!S.profile) return;

  const salesResult =
    await supabase
      .from('sales')
      .select(`
        *,
        products(product_name),
        staff_members(
          full_name,
          email,
          commission_percent,
          management_only
        )
      `)
      .order('created_at', {
        ascending: false
      });

  S.sales = salesResult.data || [];

  const productsResult =
    await supabase
      .from('products')
      .select('*')
      .order('product_name');

  S.products = productsResult.data || [];


  if (S.profile.role === 'management') {

    const expensesResult =
      await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', {
          ascending: false
        });

    S.expenses =
      expensesResult.data || [];


    const staffResult =
      await supabase
        .from('staff_members')
        .select('*')
        .order('full_name');

    S.staff =
      staffResult.data || [];

  } else {

    S.expenses = [];
    S.staff = [];

    const ownStaffResult =
      await supabase
        .from('staff_members')
        .select('*')
        .order('full_name');

    if (ownStaffResult.data) {
      S.staff = ownStaffResult.data;
    }

  }
}


/* ============================================================
   RENDER
   ============================================================ */

function render() {

  if (!S.user || !S.profile) {
    renderLogin();
    return;
  }

  const management =
    S.profile.role === 'management';

  const nav =
    management
      ? [
          'dashboard',
          'sales',
          'francis',
          'josephine',
          'pnl',
          'debt',
          'products',
          'staff',
          'expenses'
        ]
      : [
          'dashboard',
          'sales',
          'new'
        ];


  document.body.innerHTML = `
    <div class="shell">

      <aside class="side">

        <div class="brand">
          buNifu <span>HUB</span>
        </div>

        <p class="muted light">
          Wendo Arts
        </p>

        <div class="role-badge">
          ${management ? 'MANAGEMENT' : 'STAFF'}
        </div>

        <nav class="nav">

          ${nav.map(item => `
            <button
              class="${S.page === item ? 'active' : ''}"
              data-page="${item}"
            >
              ${navLabel(item)}
            </button>
          `).join('')}

        </nav>

        <button
          id="logoutButton"
          class="btn logout"
        >
          Log out
        </button>

      </aside>


      <main class="main">

        <div class="topbar">

          <div>
            <h1>${pageTitle()}</h1>

            <p class="muted">
              ${esc(S.profile.full_name)}
              ·
              ${esc(S.profile.role)}
            </p>
          </div>

        </div>

        <section id="content">
          ${page()}
        </section>

      </main>

    </div>
  `;


  document
    .querySelectorAll('[data-page]')
    .forEach(button => {

      button.onclick = () => {

        S.page =
          button.dataset.page;

        S.forcedStaffId = null;

        render();

      };

    });


  document
    .querySelector('#logoutButton')
    .onclick = () => {
      supabase.auth.signOut();
    };


  bind();
}


/* ============================================================
   NAVIGATION LABELS
   ============================================================ */

function navLabel(item) {

  const labels = {
    dashboard: 'Dashboard',
    sales: 'Sales',
    francis: 'Francis Sales',
    josephine: 'Josephine Sales',
    pnl: 'Profit & Loss',
    debt: 'Debt Collection',
    products: 'Products',
    staff: 'Staff',
    expenses: 'Expenses',
    new: 'New Sale'
  };

  return labels[item] || item;
}


function pageTitle() {

  return navLabel(S.page);
}


/* ============================================================
   FINANCIAL HELPERS
   ============================================================ */

function closedSales() {

  return S.sales.filter(
    sale => sale.status === 'Closed'
  );
}


function saleValue(sale) {

  return (
    Number(sale.quantity || 0) *
    Number(sale.unit_selling_price || 0)
  );
}


function saleCost(sale) {

  return (
    Number(sale.quantity || 0) *
    Number(sale.unit_production_cost || 0)
  );
}


function saleCommission(sale) {

  return (
    saleValue(sale) *
    Number(sale.commission_percent || 0) /
    100
  );
}


function totals(rows = closedSales()) {

  const revenue =
    rows.reduce(
      (sum, sale) =>
        sum + saleValue(sale),
      0
    );

  const paid =
    rows.reduce(
      (sum, sale) =>
        sum + Number(sale.amount_paid || 0),
      0
    );

  const cost =
    rows.reduce(
      (sum, sale) =>
        sum + saleCost(sale),
      0
    );

  const commission =
    rows.reduce(
      (sum, sale) =>
        sum + saleCommission(sale),
      0
    );

  const expenses =
    S.expenses.reduce(
      (sum, expense) =>
        sum + Number(expense.amount || 0),
      0
    );

  return {

    count: rows.length,

    revenue,

    paid,

    balance:
      revenue - paid,

    cost,

    grossProfit:
      revenue - cost,

    commission,

    expenses,

    netProfit:
      revenue -
      cost -
      commission -
      expenses

  };
}


/* ============================================================
   DASHBOARD
   ============================================================ */

function dashboard() {

  const x = totals();

  return `

    <div class="welcome card">

      <div>

        <p class="eyebrow">
          ${S.profile.role === 'management'
            ? 'MANAGEMENT CONTROL CENTRE'
            : 'STAFF SALES PORTAL'}
        </p>

        <h2>
          Welcome, ${esc(S.profile.full_name)}
        </h2>

        <p class="muted">
          ${S.profile.role === 'management'
            ? 'Monitor company sales, staff performance and profitability.'
            : 'Manage and track your own sales.'}
        </p>

      </div>

    </div>


    <div class="grid">

      ${statCard(
        'Closed Sales',
        x.count
      )}

      ${statCard(
        'Revenue',
        money(x.revenue)
      )}

      ${statCard(
        'Paid',
        money(x.paid)
      )}

      ${statCard(
        'Outstanding',
        money(x.balance)
      )}

      ${statCard(
        'Production Cost',
        money(x.cost)
      )}

      ${statCard(
        'Gross Profit',
        money(x.grossProfit)
      )}

      ${statCard(
        'Commissions',
        money(x.commission)
      )}

      ${
        S.profile.role === 'management'
          ? statCard(
              'Net Profit/Loss',
              money(x.netProfit)
            )
          : ''
      }

    </div>


    <div class="card section-card">

      <h3>Sales Status</h3>

      <div class="status-grid">

        ${statusCard('Lead')}

        ${statusCard('Confirmed')}

        ${statusCard('Closed')}

        ${statusCard('Cancelled')}

      </div>

    </div>

  `;
}


function statCard(label, value) {

  return `
    <div class="stat">

      <span class="muted">
        ${label}
      </span>

      <b>
        ${value}
      </b>

    </div>
  `;
}


function statusCard(status) {

  const count =
    S.sales.filter(
      sale => sale.status === status
    ).length;

  return `
    <div class="status-card">

      <span>
        ${status}
      </span>

      <strong>
        ${count}
      </strong>

    </div>
  `;
}


/* ============================================================
   SALES PAGE
   ============================================================ */

function salesPage() {

  const management =
    S.profile.role === 'management';

  let rows = [...S.sales];


  if (!management) {

    rows =
      rows.filter(
        sale =>
          sale.visibility === 'staff' &&
          sale.staff_member_id ===
            S.profile.staff_member_id
      );

  } else if (S.salesFilterStaffId) {

    rows =
      rows.filter(
        sale =>
          sale.staff_member_id ===
          S.salesFilterStaffId
      );

  }


  const toolbar = management
    ? `

      <div class="toolbar">

        <div class="field inline">

          <label>
            Staff Name
          </label>

          <select id="salesFilter">

            <option value="">
              All Staff Sales
            </option>

            ${staffOptions(
              true,
              S.salesFilterStaffId
            )}

          </select>

        </div>

        <button
          class="btn primary"
          id="newSaleButton"
        >
          New Sale
        </button>

      </div>

    `
    : `

      <div class="toolbar">

        <div class="field inline">

          <label>
            Staff Name
          </label>

          <select disabled>

            <option>
              ${esc(S.profile.full_name)}
            </option>

          </select>

        </div>

        <button
          class="btn primary"
          id="newSaleButton"
        >
          New Sale
        </button>

      </div>

    `;


  return `
    ${toolbar}

    ${salesTable(rows)}
  `;
}


/* ============================================================
   FRANCIS / JOSEPHINE
   ============================================================ */

function specialSales(name) {

  if (S.profile.role !== 'management') {
    return accessDenied();
  }


  const rows =
    S.sales.filter(
      sale =>
        sale.staff_members?.full_name
          ?.toLowerCase() ===
        name.toLowerCase()
    );


  return `

    <div class="special-header card">

      <div>

        <p class="eyebrow">
          MANAGEMENT ONLY
        </p>

        <h2>
          ${esc(name)} Sales
        </h2>

        <p class="muted">
          These sales are hidden from ordinary staff.
        </p>

      </div>

      <button
        class="btn primary"
        id="specialNewSale"
        data-name="${esc(name)}"
      >
        New ${esc(name)} Sale
      </button>

    </div>

    ${salesTable(rows)}

  `;
}


/* ============================================================
   SALES TABLE
   ============================================================ */

function salesTable(rows) {

  if (!rows.length) {

    return `
      <div class="card empty">
        No sales found.
      </div>
    `;

  }


  return `

    <div class="table-wrap">

      <table class="table">

        <thead>

          <tr>

            <th>Date</th>
            <th>Customer</th>
            <th>Sales Person</th>
            <th>Product</th>
            <th>Status</th>
            <th>Value</th>
            <th>Paid</th>
            <th>Balance</th>
            <th>Visibility</th>

          </tr>

        </thead>

        <tbody>

          ${rows.map(sale => {

            const value =
              saleValue(sale);

            const balance =
              value -
              Number(
                sale.amount_paid || 0
              );

            return `

              <tr>

                <td>
                  ${esc(
                    sale.original_entry_date
                  )}
                  <br>
                  <small>
                    ${esc(
                      sale.original_entry_time
                    )}
                  </small>
                </td>

                <td>
                  ${esc(
                    sale.customer_name
                  )}
                </td>

                <td>
                  ${esc(
                    sale.staff_members
                      ?.full_name ||
                    '—'
                  )}
                </td>

                <td>
                  ${esc(
                    sale.products
                      ?.product_name ||
                    '—'
                  )}
                </td>

                <td>
                  <span class="status ${statusClass(sale.status)}">
                    ${esc(sale.status)}
                  </span>
                </td>

                <td>
                  ${money(value)}
                </td>

                <td>
                  ${money(
                    sale.amount_paid
                  )}
                </td>

                <td>
                  ${money(balance)}
                </td>

                <td>
                  ${sale.visibility ===
                    'management_only'
                    ? 'Management only'
                    : 'Staff'}
                </td>

              </tr>

            `;

          }).join('')}

        </tbody>

      </table>

    </div>

  `;
}


function statusClass(status) {

  return String(status || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}


/* ============================================================
   P&L
   ============================================================ */

function pnl() {

  if (S.profile.role !== 'management') {
    return accessDenied();
  }


  const x = totals();


  return `

    <div class="card">

      <p class="eyebrow">
        CLOSED SALES ONLY
      </p>

      <h2>
        Profit & Loss
      </h2>

      <p class="muted">
        Only Closed sales are included in the financial calculations.
      </p>

    </div>


    <div class="grid">

      ${statCard(
        'Closed Sales',
        x.count
      )}

      ${statCard(
        'Revenue',
        money(x.revenue)
      )}

      ${statCard(
        'Paid',
        money(x.paid)
      )}

      ${statCard(
        'Outstanding',
        money(x.balance)
      )}

      ${statCard(
        'Production Cost',
        money(x.cost)
      )}

      ${statCard(
        'Gross Profit',
        money(x.grossProfit)
      )}

      ${statCard(
        'Staff Commissions',
        money(x.commission)
      )}

      ${statCard(
        'Expenses',
        money(x.expenses)
      )}

      ${statCard(
        'Net Profit/Loss',
        money(x.netProfit)
      )}

    </div>

  `;
}


/* ============================================================
   DEBT
   ============================================================ */

function debt() {

  const rows =
    closedSales().filter(
      sale =>
        Number(sale.amount_paid || 0) <
        saleValue(sale)
    );


  return `

    <div class="card">

      <p class="eyebrow">
        CLOSED SALES
      </p>

      <h2>
        Outstanding Debt
      </h2>

      <p class="muted">
        Customers with unpaid balances from Closed sales.
      </p>

    </div>

    ${salesTable(rows)}

  `;
}


/* ============================================================
   NEW SALE
   ============================================================ */

function saleForm() {

  const management =
    S.profile.role === 'management';

  const forced =
    S.forcedStaffId || '';

  const own =
    S.profile.staff_member_id || '';

  const defaultStaff =
    forced || own;


  const staffSelect =
    management

      ? staffOptions(
          true,
          defaultStaff
        )

      : `
        <option value="${esc(own)}">
          ${esc(S.profile.full_name)}
        </option>
      `;


  return `

    <div class="card">

      <div class="section-heading">

        <div>

          <p class="eyebrow">
            ${management
              ? 'MANAGEMENT ENTRY'
              : 'STAFF ENTRY'}
          </p>

          <h2>
            New Sale
          </h2>

        </div>

      </div>


      <form
        id="saleForm"
        class="form"
      >

        <div class="field">

          <label>
            Staff Name
          </label>

          <select
            id="staffId"
            ${management ? '' : 'disabled'}
            required
          >

            ${staffSelect}

          </select>

          <small class="muted">

            ${
              management
                ? 'Management can enter sales for any active salesperson.'
                : 'Your login is linked to your own staff identity.'
            }

          </small>

        </div>


        <div class="field">

          <label>
            Customer Name
          </label>

          <input
            id="customerName"
            required
          >

        </div>


        <div class="field">

          <label>
            Phone Number
          </label>

          <input
            id="phoneNumber"
            type="tel"
          >

        </div>


        <div class="field">

          <label>
            Lead Source
          </label>

          <select id="leadSource">

            ${sources.map(source => `
              <option value="${esc(source)}">
                ${esc(source)}
              </option>
            `).join('')}

          </select>

        </div>


        <div class="field">

          <label>
            Status
          </label>

          <select id="saleStatus">

            ${statuses.map(status => `
              <option value="${esc(status)}">
                ${esc(status)}
              </option>
            `).join('')}

          </select>

        </div>


        <div class="field">

          <label>
            Product
          </label>

          <select
            id="productId"
            required
          >

            <option value="">
              Select product
            </option>

            ${S.products
              .filter(product => product.active)
              .map(product => `
                <option value="${product.id}">
                  ${esc(product.product_name)}
                </option>
              `).join('')}

          </select>

        </div>


        <div class="field">

          <label>
            Category
          </label>

          <input
            id="category"
            readonly
          >

        </div>


        <div class="field">

          <label>
            Quantity
          </label>

          <input
            id="quantity"
            type="number"
            min="1"
            step="1"
            value="1"
            required
          >

        </div>


        <div class="field">

          <label>
            Unit Selling Price
          </label>

          <input
            id="sellingPrice"
            readonly
          >

        </div>


        <div class="field">

          <label>
            Unit Production Cost
          </label>

          <input
            id="productionCost"
            readonly
          >

        </div>


        <div class="field">

          <label>
            Amount Paid
          </label>

          <input
            id="amountPaid"
            type="number"
            min="0"
            step="0.01"
            value="0"
          >

        </div>


        <div class="field">

          <label>
            Commission %
          </label>

          <input
            id="commission"
            readonly
            value="0"
          >

        </div>


        <div class="field">

          <label>
            Visibility
          </label>

          <select
            id="visibility"
            ${management ? '' : 'disabled'}
          >

            <option value="staff">
              Visible to assigned staff
            </option>

            <option value="management_only">
              Management only
            </option>

          </select>

        </div>


        <div class="field full">

          <label>
            Notes
          </label>

          <textarea
            id="notes"
            rows="4"
          ></textarea>

        </div>


        <div class="form-note full">

          <strong>
            Entry date/time protection
          </strong>

          <p>
            The original date and time are automatically recorded
            when this sale is created and cannot be changed later.
          </p>

        </div>


        <button
          class="btn primary full"
          type="submit"
        >
          Save Sale
        </button>

      </form>

    </div>

  `;
}


/* ============================================================
   PRODUCTS
   ============================================================ */

function products() {

  if (S.profile.role !== 'management') {
    return accessDenied();
  }


  return `

    <div class="card">

      <p class="eyebrow">
        MANAGEMENT
      </p>

      <h2>
        Products
      </h2>

      <form
        id="productForm"
        class="form"
      >

        <div class="field">
          <label>Product ID</label>
          <input id="productCode" required>
        </div>

        <div class="field">
          <label>Product Name</label>
          <input id="productName" required>
        </div>

        <div class="field">
          <label>Category</label>
          <input id="productCategory" required>
        </div>

        <div class="field">
          <label>Selling Price</label>
          <input
            id="productPrice"
            type="number"
            step="0.01"
            required
          >
        </div>

        <div class="field">
          <label>Production Cost</label>
          <input
            id="productCost"
            type="number"
            step="0.01"
            required
          >
        </div>

        <button
          class="btn primary full"
          type="submit"
        >
          Add Product
        </button>

      </form>

    </div>


    ${simpleTable(
      S.products,
      [
        'product_id',
        'product_name',
        'category',
        'unit_selling_price',
        'unit_production_cost',
        'active'
      ]
    )}

  `;
}


/* ============================================================
   STAFF
   ============================================================ */

function staffPage() {

  if (S.profile.role !== 'management') {
    return accessDenied();
  }


  return `

    <div class="card">

      <p class="eyebrow">
        MANAGEMENT
      </p>

      <h2>
        Staff & Salespeople
      </h2>

      <p class="muted">
        Add salespeople here. Francis and Josephine can be
        marked as management-only salespeople.
      </p>


      <form
        id="staffForm"
        class="form"
      >

        <div class="field">
          <label>Full Name</label>
          <input id="staffName" required>
        </div>

        <div class="field">
          <label>Email</label>
          <input
            id="staffEmail"
            type="email"
          >
        </div>

        <div class="field">
          <label>Commission %</label>

          <input
            id="staffCommission"
            type="number"
            step="0.01"
            min="0"
            value="3"
          >

        </div>


        <div class="field full">

          <label class="checkbox">

            <input
              id="managementOnly"
              type="checkbox"
            >

            Management-only salesperson

          </label>

        </div>


        <button
          class="btn primary full"
          type="submit"
        >
          Add Staff
        </button>

      </form>

    </div>


    ${simpleTable(
      S.staff,
      [
        'full_name',
        'email',
        'commission_percent',
        'active',
        'management_only'
      ]
    )}

  `;
}


/* ============================================================
   EXPENSES
   ============================================================ */

function expenses() {

  if (S.profile.role !== 'management') {
    return accessDenied();
  }


  return `

    <div class="card">

      <p class="eyebrow">
        MANAGEMENT
      </p>

      <h2>
        Expenses
      </h2>


      <form
        id="expenseForm"
        class="form"
      >

        <div class="field">
          <label>Date</label>

          <input
            id="expenseDate"
            type="date"
            required
          >
        </div>


        <div class="field">
          <label>Category</label>

          <input
            id="expenseCategory"
            required
          >
        </div>


        <div class="field full">
          <label>Description</label>

          <input
            id="expenseDescription"
            required
          >
        </div>


        <div class="field">
          <label>Amount</label>

          <input
            id="expenseAmount"
            type="number"
            step="0.01"
            min="0"
            required
          >
        </div>


        <button
          class="btn primary full"
          type="submit"
        >
          Add Expense
        </button>

      </form>

    </div>


    ${simpleTable(
      S.expenses,
      [
        'expense_id',
        'expense_date',
        'description',
        'amount',
        'expense_category'
      ]
    )}

  `;
}


/* ============================================================
   SIMPLE TABLE
   ============================================================ */

function simpleTable(rows, columns) {

  if (!rows.length) {

    return `
      <div class="card empty">
        No records found.
      </div>
    `;

  }


  return `

    <div class="table-wrap">

      <table class="table">

        <thead>

          <tr>

            ${columns.map(column => `
              <th>
                ${esc(column)}
              </th>
            `).join('')}

          </tr>

        </thead>

        <tbody>

          ${rows.map(row => `

            <tr>

              ${columns.map(column => `

                <td>
                  ${esc(row[column])}
                </td>

              `).join('')}

            </tr>

          `).join('')}

        </tbody>

      </table>

    </div>

  `;
}


/* ============================================================
   STAFF OPTIONS
   ============================================================ */

function staffOptions(
  includeManagementOnly = true,
  selected = ''
) {

  return S.staff

    .filter(staff =>
      staff.active &&
      (
        includeManagementOnly ||
        !staff.management_only
      )
    )

    .map(staff => `

      <option
        value="${staff.id}"
        ${selected === staff.id ? 'selected' : ''}
      >

        ${esc(staff.full_name)}

        ${
          staff.management_only
            ? ' · Management only'
            : ''
        }

      </option>

    `)

    .join('');
}


/* ============================================================
   ACCESS DENIED
   ============================================================ */

function accessDenied() {

  return `

    <div class="card">

      <h2>
        Access restricted
      </h2>

      <p class="muted">
        This section is available to Management only.
      </p>

    </div>

  `;
}


/* ============================================================
   PAGE ROUTER
   ============================================================ */

function page() {

  switch (S.page) {

    case 'dashboard':
      return dashboard();

    case 'sales':
      return salesPage();

    case 'new':
      return saleForm();

    case 'francis':
      return specialSales('Francis');

    case 'josephine':
      return specialSales('Josephine');

    case 'pnl':
      return pnl();

    case 'debt':
      return debt();

    case 'products':
      return products();

    case 'staff':
      return staffPage();

    case 'expenses':
      return expenses();

    default:
      return dashboard();

  }
}


/* ============================================================
   EVENT BINDINGS
   ============================================================ */

function bind() {


  /* ----------------------------------------------------------
     NEW SALE
     ---------------------------------------------------------- */

  const newSale =
    document.querySelector('#newSaleButton');

  if (newSale) {

    newSale.onclick = () => {

      S.page = 'new';

      render();

    };

  }


  /* ----------------------------------------------------------
     FRANCIS / JOSEPHINE NEW SALE
     ---------------------------------------------------------- */

  const specialNew =
    document.querySelector('#specialNewSale');

  if (specialNew) {

    specialNew.onclick = () => {

      const name =
        specialNew.dataset.name;

      const match =
        S.staff.find(
          staff =>
            staff.full_name
              ?.toLowerCase() ===
            name.toLowerCase()
        );


      if (!match) {

        alert(
          `${name} is not yet in Staff.`
        );

        return;

      }


      S.forcedStaffId =
        match.id;

      S.page = 'new';

      render();

    };

  }


  /* ----------------------------------------------------------
     STAFF FILTER
     ---------------------------------------------------------- */

  const salesFilter =
    document.querySelector('#salesFilter');

  if (salesFilter) {

    salesFilter.onchange = () => {

      S.salesFilterStaffId =
        salesFilter.value;

      render();

    };

  }


  /* ----------------------------------------------------------
     SALE FORM
     ---------------------------------------------------------- */

  const saleFormElement =
    document.querySelector('#saleForm');


  const staffSelect =
    document.querySelector('#staffId');


  const visibility =
    document.querySelector('#visibility');


  const commission =
    document.querySelector('#commission');


  function updateStaffMeta() {

    if (!staffSelect) return;


    const member =
      S.staff.find(
        staff =>
          staff.id ===
          staffSelect.value
      );


    if (!member) return;


    if (commission) {

      commission.value =
        member.commission_percent ?? 0;

    }


    if (visibility) {

      if (member.management_only) {

        visibility.value =
          'management_only';

        visibility.disabled =
          true;

      } else {

        visibility.value =
          'staff';

        visibility.disabled =
          S.profile.role !== 'management';

      }

    }

  }


  if (staffSelect) {

    staffSelect.onchange =
      updateStaffMeta;

    updateStaffMeta();

  }


  /* ----------------------------------------------------------
     PRODUCT SELECTION
     ---------------------------------------------------------- */

  const productSelect =
    document.querySelector('#productId');


  if (productSelect) {

    productSelect.onchange = () => {

      const product =
        S.products.find(
          item =>
            item.id ===
            productSelect.value
        );


      if (!product) return;


      document.querySelector(
        '#category'
      ).value =
        product.category || '';


      document.querySelector(
        '#sellingPrice'
      ).value =
        product.unit_selling_price || '';


      document.querySelector(
        '#productionCost'
      ).value =
        product.unit_production_cost || '';

    };

  }


  /* ----------------------------------------------------------
     SAVE SALE
     ---------------------------------------------------------- */

  if (saleFormElement) {

    saleFormElement.onsubmit =
      async event => {

        event.preventDefault();


        const button =
          saleFormElement.querySelector(
            'button[type="submit"]'
          );


        button.disabled = true;

        button.textContent =
          'Saving...';


        const customerName =
          document.querySelector(
            '#customerName'
          ).value.trim();


        const phoneNumber =
          document.querySelector(
            '#phoneNumber'
          ).value.trim();


        const leadSource =
          document.querySelector(
            '#leadSource'
          ).value;


        const saleStatus =
          document.querySelector(
            '#saleStatus'
          ).value;


        const productId =
          document.querySelector(
            '#productId'
          ).value;


        const quantity =
          Number(
            document.querySelector(
              '#quantity'
            ).value
          );


        const amountPaid =
          Number(
            document.querySelector(
              '#amountPaid'
            ).value || 0
          );


        const notes =
          document.querySelector(
            '#notes'
          ).value.trim();


        const staffId =
          document.querySelector(
            '#staffId'
          ).value;


        const saleVisibility =
          document.querySelector(
            '#visibility'
          ).value;


        if (!customerName) {

          alert(
            'Customer name is required.'
          );

          button.disabled = false;

          button.textContent =
            'Save Sale';

          return;

        }


        if (!productId) {

          alert(
            'Please select a product.'
          );

          button.disabled = false;

          button.textContent =
            'Save Sale';

          return;

        }


        if (!quantity || quantity < 1) {

          alert(
            'Quantity must be at least 1.'
          );

          button.disabled = false;

          button.textContent =
            'Save Sale';

          return;

        }


        if (amountPaid < 0) {

          alert(
            'Amount paid cannot be negative.'
          );

          button.disabled = false;

          button.textContent =
            'Save Sale';

          return;

        }


        const result =
          await supabase.rpc(
            'create_sale',
            {
              p_customer_name:
                customerName,

              p_phone_number:
                phoneNumber,

              p_lead_source:
                leadSource,

              p_status:
                saleStatus,

              p_product_id:
                productId,

              p_quantity:
                quantity,

              p_amount_paid:
                amountPaid,

              p_notes:
                notes,

              p_staff_member_id:
                staffId || null,

              p_visibility:
                saleVisibility
            }
          );


        if (result.error) {

          alert(
            result.error.message
          );

          button.disabled = false;

          button.textContent =
            'Save Sale';

          return;

        }


        await loadData();


        S.page = 'sales';

        S.forcedStaffId = null;

        render();

      };

  }


  /* ----------------------------------------------------------
     PRODUCTS
     ---------------------------------------------------------- */

  const productForm =
    document.querySelector('#productForm');


  if (productForm) {

    productForm.onsubmit =
      async event => {

        event.preventDefault();


        const result =
          await supabase
            .from('products')
            .insert({

              product_id:
                document.querySelector(
                  '#productCode'
                ).value.trim(),

              product_name:
                document.querySelector(
                  '#productName'
                ).value.trim(),

              category:
                document.querySelector(
                  '#productCategory'
                ).value.trim(),

              unit_selling_price:
                Number(
                  document.querySelector(
                    '#productPrice'
                  ).value
                ),

              unit_production_cost:
                Number(
                  document.querySelector(
                    '#productCost'
                  ).value
                ),

              active:
                true

            });


        if (result.error) {

          alert(
            result.error.message
          );

          return;

        }


        await loadData();

        render();

      };

  }


  /* ----------------------------------------------------------
     STAFF
     ---------------------------------------------------------- */

  const staffForm =
    document.querySelector('#staffForm');


  if (staffForm) {

    staffForm.onsubmit =
      async event => {

        event.preventDefault();


        const result =
          await supabase
            .from('staff_members')
            .insert({

              full_name:
                document.querySelector(
                  '#staffName'
                ).value.trim(),

              email:
                document.querySelector(
                  '#staffEmail'
                ).value.trim() ||
                null,

              commission_percent:
                Number(
                  document.querySelector(
                    '#staffCommission'
                  ).value || 0
                ),

              management_only:
                document.querySelector(
                  '#managementOnly'
                ).checked,

              active:
                true

            });


        if (result.error) {

          alert(
            result.error.message
          );

          return;

        }


        await loadData();

        render();

      };

  }


  /* ----------------------------------------------------------
     EXPENSES
     ---------------------------------------------------------- */

  const expenseForm =
    document.querySelector('#expenseForm');


  if (expenseForm) {

    expenseForm.onsubmit =
      async event => {

        event.preventDefault();


        const result =
          await supabase
            .from('expenses')
            .insert({

              expense_id:
                'EXP-' +
                Date.now(),

              expense_date:
                document.querySelector(
                  '#expenseDate'
                ).value,

              description:
                document.querySelector(
                  '#expenseDescription'
                ).value.trim(),

              amount:
                Number(
                  document.querySelector(
                    '#expenseAmount'
                  ).value
                ),

              expense_category:
                document.querySelector(
                  '#expenseCategory'
                ).value.trim()

            });


        if (result.error) {

          alert(
            result.error.message
          );

          return;

        }


        await loadData();

        render();

      };

  }

}


/* ============================================================
   START APP
   ============================================================ */

start();
