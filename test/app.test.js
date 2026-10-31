const test = require('node:test');
const assert = require('node:assert');
const app = require('../app');

let server;
let base;

test.before(() => {
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
});

test.after(() => server.close());

test('главная страница открывается', async () => {
  const res = await fetch(base + '/');
  assert.strictEqual(res.status, 200);
  assert.match(await res.text(), /Статистика посещений/);
});

test('каталог показывает товары', async () => {
  const res = await fetch(base + '/products');
  assert.strictEqual(res.status, 200);
  assert.match(await res.text(), /Ноутбук/);
});

test('профиль без входа перенаправляет на /login', async () => {
  const res = await fetch(base + '/profile', { redirect: 'manual' });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.get('location'), '/login');
});

test('неверный пароль возвращает 401', async () => {
  const res = await fetch(base + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'username=admin&password=wrong',
  });
  assert.strictEqual(res.status, 401);
});

test('админ-панель без входа недоступна', async () => {
  const res = await fetch(base + '/admin', { redirect: 'manual' });
  assert.strictEqual(res.status, 302);
});

test('после добавления товара показывается сообщение', async () => {
  const add = await fetch(base + '/cart/add/1', { method: 'POST', redirect: 'manual' });
  const cookie = add.headers.get('set-cookie').split(';')[0];
  const res = await fetch(base + '/products', { headers: { cookie } });
  assert.match(await res.text(), /добавлен в корзину/);
});
