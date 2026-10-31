const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const hbs = require('hbs');

const app = express();
const PORT = 3000;

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

hbs.registerHelper('multiply', (a, b) => a * b);
hbs.registerHelper('eq', (a, b) => a === b);

app.use(express.static('public'));

// запрос иконки обрабатываем до сессий
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(express.urlencoded({ extended: true }));

// Задание 1, 6, 7 - настройка сессий: хранение в файлах, время жизни 1 час, rolling
app.use(session({
  store: new FileStore({
    path: './sessions',
    ttl: 3600,
    retries: 1,
  }),
  secret: 'my secret key 2026',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    maxAge: 60 * 60 * 1000,
    httpOnly: true,
  },
}));

// Задание 2 - счётчик посещений при каждом запросе
app.use((req, res, next) => {
  if (!req.session.count) {
    req.session.count = 0;
    req.session.firstVisit = new Date().toLocaleString('ru-RU');
  }
  req.session.count++;

  // предыдущий визит показываем на странице, потом обновляем
  res.locals.prevVisit = req.session.lastVisit || 'это первое посещение';
  req.session.lastVisit = new Date().toLocaleString('ru-RU');
  next();
});

// Задание 3 - товары и инициализация корзины
const products = [
  { id: 1, title: 'Ноутбук', price: 55000 },
  { id: 2, title: 'Мышь', price: 1200 },
  { id: 3, title: 'Клавиатура', price: 3500 },
  { id: 4, title: 'Монитор', price: 18000 },
];

app.use((req, res, next) => {
  if (!Array.isArray(req.session.cart)) {
    req.session.cart = [];
  }
  let cartCount = 0;
  req.session.cart.forEach((item) => (cartCount += item.quantity));
  res.locals.cartCount = cartCount;

  // Задание 4 - сессия доступна во всех шаблонах
  res.locals.session = req.session;
  next();
});

// Задание 1 - запись в сессию
app.get('/set-session', (req, res) => {
  req.session.visitCount = (req.session.visitCount || 0) + 1;
  req.session.lastVisitTime = new Date().toISOString();

  // Задание 7 - эксперимент: так хранить пароль нельзя
  req.session.secret = 'my-password-123';

  res.send('Сессия обновлена. <a href="/get-session">Показать</a>');
});

// Задание 1 - чтение сессии
app.get('/get-session', (req, res) => {
  if (!req.session.visitCount) {
    return res.send('Сессия пуста. <a href="/set-session">Записать</a>');
  }
  res.send('<pre>' + JSON.stringify(req.session, null, 2) + '</pre>');
});

// Задание 1 - очистка сессии
app.get('/clear-session', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.clearCookie('connect.sid');
    res.redirect('/get-session');
  });
});

// Задание 2 - главная страница со статистикой
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Главная',
    count: req.session.count,
    firstVisit: req.session.firstVisit,
    lastVisit: res.locals.prevVisit,
  });
});

// Задание 2 - сброс счётчика
app.get('/reset-counter', (req, res) => {
  delete req.session.count;
  delete req.session.firstVisit;
  delete req.session.lastVisit;
  req.session.save(() => res.redirect('/'));
});

// Задание 3 - каталог
app.get('/products', (req, res) => {
  res.render('products', { title: 'Каталог', products });
});

// Задание 3 - добавление в корзину
app.post('/cart/add/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);
  const item = req.session.cart.find((i) => i.id === id);

  if (item) {
    item.quantity++;
  } else if (product) {
    req.session.cart.push({ id: product.id, title: product.title, price: product.price, quantity: 1 });
  }
  req.session.save(() => res.redirect('/products'));
});

// Задание 3 - удаление из корзины
app.post('/cart/remove/:id', (req, res) => {
  req.session.cart = req.session.cart.filter((i) => i.id !== Number(req.params.id));
  req.session.save(() => res.redirect('/cart'));
});

// Задание 3 - изменение количества
app.post('/cart/update/:id', (req, res) => {
  const quantity = parseInt(req.body.quantity);
  const item = req.session.cart.find((i) => i.id === Number(req.params.id));

  if (item) {
    if (quantity <= 0) {
      req.session.cart = req.session.cart.filter((i) => i.id !== item.id);
    } else {
      item.quantity = quantity;
    }
  }
  req.session.save(() => res.redirect('/cart'));
});

// Задание 3 - просмотр корзины
app.get('/cart', (req, res) => {
  let total = 0;
  req.session.cart.forEach((i) => (total += i.price * i.quantity));
  res.render('cart', { title: 'Корзина', cart: req.session.cart, total });
});

// Задание 4, 5 - пользователи с ролями
let users = [
  { id: 1, username: 'admin', password: 'admin', role: 'admin' },
  { id: 2, username: 'user', password: 'user', role: 'user' },
];

// Задание 4 - форма входа
app.get('/login', (req, res) => {
  res.render('login', { title: 'Вход' });
});

// Задание 4 - вход
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).render('login', { title: 'Вход', error: 'Неверные данные' });
  }

  // новая сессия после входа (защита от session fixation)
  req.session.regenerate((err) => {
    if (err) return res.status(500).send('Ошибка');
    req.session.isLoggedIn = true;
    req.session.user = { id: user.id, username: user.username, role: user.role };
    req.session.save(() => res.redirect('/profile'));
  });
});

// Задание 4 - проверка авторизации
function requireAuth(req, res, next) {
  if (!req.session.isLoggedIn) {
    return res.redirect('/login');
  }
  next();
}

// Задание 5 - проверка роли
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    if (req.session.user.role !== role) return res.status(403).send('Доступ запрещён');
    next();
  };
}

// Задание 4 - защищённые страницы
app.get('/profile', requireAuth, (req, res) => {
  res.render('profile', { title: 'Профиль', user: req.session.user });
});

app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', { title: 'Личный кабинет', user: req.session.user });
});

// Задание 4 - выход
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// Задание 5 - админ-панель
app.get('/admin', requireRole('admin'), (req, res) => {
  res.render('admin', { title: 'Админ-панель', users, error: req.query.error });
});

// Задание 5 - добавление пользователя
app.post('/admin/users', requireRole('admin'), (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || users.find((u) => u.username === username) || !['user', 'admin'].includes(role)) {
    return res.redirect('/admin?error=Проверьте данные или логин уже занят');
  }
  users.push({ id: Date.now(), username, password, role });
  res.redirect('/admin');
});

// Задание 5 - редактирование пользователя
app.post('/admin/users/:id', requireRole('admin'), (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (user) {
    user.username = req.body.username;
    user.role = req.body.role;
  }
  res.redirect('/admin');
});

// Задание 5 - удаление пользователя (себя удалить нельзя)
app.post('/admin/users/:id/delete', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  if (id === req.session.user.id) {
    return res.redirect('/admin?error=Нельзя удалить самого себя');
  }
  users = users.filter((u) => u.id !== id);
  res.redirect('/admin');
});

// Задание 6 - страница с таймером
app.get('/timer', (req, res) => {
  res.render('timer', { title: 'Таймер сессии', maxAge: req.session.cookie.maxAge });
});

// Задание 6 - продление сессии
app.get('/extend-session', (req, res) => {
  req.session.touch();
  res.redirect('/timer');
});

// запуск сервера (при подключении в тестах сервер не стартует)
if (require.main === module) {
  app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
}

module.exports = app;
