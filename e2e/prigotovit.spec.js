const { test, expect } = require('@playwright/test');

const apiPattern = '**/functions/v1/food-suggest';
const response = {
  request_id: 'e2e-request-1',
  suggestions: [
    { name: 'Курица с рисом', cooking_time: 30, servings: 2, description: 'Сытный ужин.', have: ['курица', 'рис'], missing: ['морковь', 'помидоры'], ingredients: ['Курица', 'Рис', 'Морковь', 'Помидоры'], steps: ['Нарежьте курицу.', 'Потушите с рисом.'] },
    { name: 'Рисовая запеканка', cooking_time: 45, servings: 2, description: 'Простое блюдо.', have: ['рис'], missing: ['сыр'], ingredients: ['Рис', 'Сыр'], steps: ['Смешайте продукты.', 'Запекайте.'] },
    { name: 'Овощи с курицей', cooking_time: 25, servings: 2, description: 'Быстрый вариант.', have: ['курица'], missing: ['морковь'], ingredients: ['Курица', 'Морковь'], steps: ['Подготовьте овощи.', 'Обжарьте всё вместе.'] }
  ]
};

async function mockApi(page, status = 200, body = response) {
  await page.route(apiPattern, route => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }));
}

async function openGenerator(page) {
  await page.goto('/prigotovit/');
  await expect(page.locator('#food-form')).toBeVisible();
}

test.beforeEach(async ({ context }) => context.clearCookies());

test('1. генератор загружается без console/page ошибок и без горизонтального переполнения', async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await openGenerator(page);
  await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(1);
  await expect(page.locator('img')).toHaveCount(6);
  expect(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
});

test('2–3. продукты добавляются вручную и из примеров, затем удаляются', async ({ page }) => {
  await openGenerator(page);
  await page.locator('#home-product-add').fill('Курица');
  await page.locator('#home-product-add-button').click();
  await page.getByText('Рис', { exact: true }).last().click();
  await expect(page.locator('#ingredients')).toHaveValue(/Курица.*рис/i);
  await expect(page.locator('.home-product-chip')).toHaveCount(2);
  await page.locator('.home-product-chip button').first().click();
  await expect(page.locator('#ingredients')).not.toHaveValue(/Курица/i);
  await expect(page.locator('.home-product-chip')).toHaveCount(1);
});

test('4. выбираются порции 1, 2, 4, 12, произвольные 20 и отклоняются границы', async ({ page }) => {
  await openGenerator(page);
  await page.locator('#choose-people').click();
  for (const value of ['1', '2', '4', '12']) {
    await page.locator(`input[name="people"][value="${value}"]`).check();
    await expect(page.locator(`input[name="people"][value="${value}"]`)).toBeChecked();
  }
  await page.locator('input[name="people"][value="custom"]').check();
  const custom = page.locator('#custom-people');
  await custom.fill('20');
  await expect(custom).toHaveValue('20');
  await custom.fill('0');
  expect(await custom.evaluate(element => !element.checkValidity())).toBeTruthy();
  await custom.fill('21');
  expect(await custom.evaluate(element => !element.checkValidity())).toBeTruthy();
  await custom.fill('20');
  expect(await custom.evaluate(element => element.checkValidity())).toBeTruthy();
});

test('5. выбираются все временные ограничения, включая «Неважно»', async ({ page }) => {
  await openGenerator(page);
  await page.locator('#choose-cook-time').click();
  for (const value of ['10', '30', '60', '120', '']) {
    await page.locator(`input[name="max_time"][value="${value}"]`).check();
    await expect(page.locator(`input[name="max_time"][value="${value}"]`)).toBeChecked();
  }
});

test('6–7. API-мок рисует три полных рецепта и не выводит исключённый ингредиент', async ({ page }) => {
  await mockApi(page);
  await openGenerator(page);
  await page.locator('#ingredients').fill('курица, рис');
  await page.locator('#excluded').fill('лук');
  await page.locator('#food-form').getByRole('button', { name: /Показать рецепты/ }).click();
  await expect(page.locator('.dish-card')).toHaveCount(3);
  await expect(page.locator('.dish-card').first()).toContainText('Курица с рисом');
  await page.locator('.recipe-open').first().click();
  await expect(page.locator('#recipe-detail')).toContainText('Ингредиенты');
  await expect(page.locator('#recipe-detail')).toContainText('Как приготовить');
  await expect(page.locator('#recipe-detail ol li')).toHaveCount(2);
  await expect(page.locator('#recipe-detail')).not.toContainText('лук');
});

test('8. недостающие продукты переносятся без дублей, отмечаются и переходят в домашние', async ({ page }) => {
  await mockApi(page);
  await openGenerator(page);
  await page.locator('#ingredients').fill('курица, рис');
  await page.locator('#food-form').getByRole('button', { name: /Показать рецепты/ }).click();
  await page.locator('.add-missing').first().click();
  await expect(page).toHaveURL(/\/spisok-pokupok\//);
  await expect(page.locator('#shopping-items li')).toHaveCount(2);
  await page.locator('#shopping-input').fill('морковь');
  await page.locator('#shopping-form').getByRole('button', { name: /Добавить/ }).click();
  // Дубликат, введённый вручную, не должен оставаться в списке.
  await expect(page.locator('#shopping-items li')).toHaveCount(2);
  await page.getByRole('checkbox', { name: /Куплено: морковь/ }).check();
  await page.locator('#shopping-to-home').click();
  await expect(page).toHaveURL(/\/prigotovit\//);
  await expect(page.locator('#ingredients')).toHaveValue(/морковь/i);
});

test('9. домашние продукты сохраняются после обновления и перехода между разделами', async ({ page }) => {
  await openGenerator(page);
  await page.locator('#home-product-add').fill('Гречка');
  await page.locator('#home-product-add-button').click();
  await page.reload();
  await expect(page.locator('#ingredients')).toHaveValue(/Гречка/i);
  await page.goto('/spisok-pokupok/');
  await page.getByRole('link', { name: /Вернуться к подбору/ }).click();
  await expect(page.locator('#ingredients')).toHaveValue(/Гречка/i);
});

test('10. HTTP 429 переводит на подписку без платёжного запроса', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await mockApi(page, 429, { error: 'daily_limit' });
  await openGenerator(page);
  await page.locator('#ingredients').fill('рис');
  await page.locator('#food-form').getByRole('button', { name: /Показать рецепты/ }).click();
  await expect(page).toHaveURL(/\/podpiska\/\?from=limit/);
  expect(requests.some(url => /payment|yookassa|stripe/i.test(url))).toBeFalsy();
});
