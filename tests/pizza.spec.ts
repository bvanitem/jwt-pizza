import { test, expect } from 'playwright-test-coverage';

test("home page", async ({ page }) => {
	await page.goto("/");

	expect(await page.title()).toBe("JWT Pizza");
});

test('register', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const registerReq = {
      "name": "Test",
      "email": "t@jwt.com",
      "password": "t"
    };
    const registerRes = {
      "user": {
        "id": 4,
        "name": "Test",
        "email": "t@jwt.com"
      }
   };
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: registerRes });
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('Test');
  await page.getByRole('textbox', { name: 'Email address' }).fill('t@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('t');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.locator('#navbar-dark')).toContainText('Logout');
});

test('bad login', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'x@jwt.com', password: 'x' };
    const loginRes = { status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'unknown user' }), };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill(loginRes);
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('x@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('x');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('main')).toContainText('{"code":404,"message":"unknown user"}');
});

test('purchase with login', async ({ page }) => {
  // Mock Menu Items
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });
  // Mock Franchise
  await page.route('*/**/api/franchise', async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: 'LotaPizza',
        stores: [
          { id: 4, name: 'Lehi' },
          { id: 5, name: 'Springville' },
          { id: 6, name: 'American Fork' },
        ],
      },
      { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
      { id: 4, name: 'topSpot', stores: [] },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });
  // Mock Admin
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'a@jwt.com', password: 'admin' };
    const loginRes = { user: { id: 1, name: "常用名字", email: "a@jwt.com", roles: [{ role: "admin" }] }, token: 'imanadmin' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });
  // Mock Diner
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });
  // Mock Order
  await page.route('*/**/api/order', async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: 'Veggie', price: 0.0038 },
        { menuId: 2, description: 'Pepperoni', price: 0.0042 },
      ],
      storeId: '4',
      franchiseId: 2,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
        id: 23,
      },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.goto('/');

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
});

test('login, diner dashboard, and logout', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'diner' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    const logoutRes = { message: 'logout successful' };
    if (route.request().method() === 'PUT') {
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    } 
    else {
      expect(route.request().method()).toBe('DELETE');
      expect(route.request().headers()['authorization']).toBe('Bearer abcdef');
      await route.fulfill({ json: logoutRes });
    }
  });


  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'kc' }).click();
  await expect(page.getByRole('heading')).toContainText('Your pizza kitchen');
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.locator('#navbar-dark')).toContainText('Login');
  await expect(page.locator('#navbar-dark')).toContainText('Register');
});

test('about', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('main')).toContainText('At JWT Pizza, our amazing employees are the secret behind our delicious pizzas. They are passionate about their craft and spend every waking moment dreaming about how to make our pizzas even better. From selecting the finest ingredients to perfecting the dough and sauce recipes, our employees go above and beyond to ensure the highest quality and taste in every bite. Their dedication and attention to detail make all the difference in creating a truly exceptional pizza experience for our customers. We take pride in our team and their commitment to delivering the best pizza in town.');
  await expect(page.getByRole('link', { name: 'about', exact: true })).toBeVisible();
});

test('history', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'History' }).click();

  await expect(page.getByRole('heading')).toContainText('Mama Rucci, my my');
  await expect(page.getByRole('link', { name: 'history', exact: true })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toContainText('© 2024 JWT Pizza LTD. All rights reserved. Version: 20000101.000000');
});

test('franchise', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Franchise' }).click();
  await expect(page.getByRole('link', { name: 'franchise-dashboard' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Now is the time to get in on the JWT Pizza tsunami. The pizza sells itself. People cannot get enough. Setup your shop and let the pizza fly. Here are all the reasons why you should buy a franchise with JWT Pizza.');
  await expect(page.getByRole('main')).toContainText('Owning a franchise with JWT Pizza can be highly profitable. With our proven business model and strong brand recognition, you can expect to generate significant revenue. Our profit forecasts show consistent growth year after year, making it a lucrative investment opportunity.');
  await expect(page.getByRole('main')).toContainText('In addition to financial success, owning a franchise also allows you to make a positive impact on your community. By providing delicious pizzas and creating job opportunities, you contribute to the local economy and bring joy to people\'s lives. It\'s a rewarding experience that combines entrepreneurship with social responsibility. The following table shows a possible stream of income from your franchise.');
  await expect(page.locator('thead')).toContainText('Year');
  await expect(page.locator('thead')).toContainText('Profit');
  await expect(page.locator('thead')).toContainText('Costs');
  await expect(page.locator('thead')).toContainText('Franchise Fee');
  await expect(page.getByRole('main')).toContainText('Unleash Your Potential');
  await expect(page.getByRole('main')).toContainText('Are you ready to embark on a journey towards unimaginable wealth? Owning a franchise with JWT Pizza is your ticket to financial success. With our proven business model and strong brand recognition, you have the opportunity to generate substantial revenue. Imagine the thrill of watching your profits soar year after year, as customers flock to your JWT Pizza, craving our mouthwatering creations.');
});

test('franchisee login, create store, delete store', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
      const loginReq = { email: 'f@jwt.com', password: 'franchisee' };
      const loginRes = { user: { id: 3, name: 'franchisee', email: 'f@jwt.com', roles: [{
          "role": "diner"
      },
      {
          "objectId": 1,
          "role": "franchisee"
      }] }, token: 'abcdef' };
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    });

  await page.route('*/**/api/franchise/3', async (route) => {
    const franchiseRes = [
      {
        "id": 1,
        "name": "pizzaPocket",
        "admins": [
          {
            "id": 3,
            "name": "pizza franchisee",
            "email": "f@jwt.com"
          }
        ],
        "stores": [
          {
            "id": 1,
            "name": "SLC",
            "totalRevenue": 2.8518
          },
          {
            "id": 10,
            "name": "test",
            "totalRevenue": 1000000
          }
        ]
      }
    ];
    expect(route.request().headers()['authorization']).toBe('Bearer abcdef');
    await route.fulfill({ json: franchiseRes });
    });

  await page.route('*/**/api/franchise/1/store', async (route) => {
    const storeReq = { name: 'test' };
    const storeRes = {id:16,franchiseId:1,name:"test"};
    expect(route.request().postDataJSON()).toMatchObject(storeReq);
    await route.fulfill({ json: storeRes });
  });

  await page.route('*/**/api/franchise/1/store/10', async (route) => {
    const res = { message: 'store deleted' };
    await expect(route.request().method()).toBe('DELETE');
    await route.fulfill({ json: res });
  });

  await page.goto('/');
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await page.getByRole('link', { name: 'login', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'franchise-dashboard' }).isVisible();
  await expect(page.getByRole('main')).toContainText('Create store');

  await page.getByRole('button', { name: 'Create store' }).click();
  await page.getByRole('textbox', { name: 'store name' }).click();
  await page.getByRole('textbox', { name: 'store name' }).fill('test');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('tbody')).toContainText('test');

  await page.getByRole('row', { name: 'test 1,000,000 ₿ Close' }).getByRole('button').click();
  await expect(page.getByRole('heading')).toContainText('Sorry to see you go');
  await expect(page.getByRole('main')).toContainText('Are you sure you want to close the pizzaPocket store test ? This cannot be restored. All outstanding revenue will not be refunded.');

  await page.getByRole('button', { name: 'Close' }).click();
});


test('admin login', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'x@jwt.com', password: 'x' };
    const loginRes = { user: { id: 1, name: 'X', email: 'x@jwt.com', roles: [{ role: 'admin' }] }, token: 'imadmin' };
    const logoutRes = { message: 'logout successful' };
    if (route.request().method() === 'PUT') {
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    } 
    else {
      expect(route.request().method()).toBe('DELETE');
      expect(route.request().headers()['authorization']).toBe('Bearer imadmin');
      await route.fulfill({ json: logoutRes });
    }
  });


  await page.goto('/');
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('x@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('x');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.locator('#navbar-dark')).toContainText('Admin');
  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('heading')).toContainText('Mama Ricci\'s kitchen');
  await expect(page.getByRole('main')).toContainText('Add Franchise');
});