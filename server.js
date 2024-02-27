const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Чтение и обработка файла locations.json
const locationsData = fs.readFileSync(path.resolve(__dirname, 'locations.json'));
const locations = JSON.parse(locationsData);

// Используем body-parser для обработки данных в формате JSON
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Redirect users to the /index route when they access the root URL
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/server', (req, res) => {
   // Получаем переменные из тела запроса
   const price = parseFloat(req.body.variable1); // Преобразуем в число
   const auction = req.body.variable2;

   // Делаем что-то с полученными переменными (например, выводим их в консоль)
   console.log('Первая переменная:', price);
   console.log('Вторая переменная:', auction);

   let foundLocation;
   if (auction === "Copart") {
      foundLocation = locations.COPART;
   }
   else if (auction === "IAAI") {
      foundLocation = locations.IAAI;
   }

   // Находим объект, в котором carPrice содержит в себе значение цены
   let carPriceObject;
   if (price >= 15000) {
      carPriceObject = foundLocation.find(location => location.carPrice === "15000+");
      if (!carPriceObject.auctionFeeAdded) {
         carPriceObject.auctionFee = Math.round(price * carPriceObject.additionFee + carPriceObject.auctionFee);
         carPriceObject.auctionFeeAdded = true; // Устанавливаем флаг, чтобы показать, что значение уже было добавлено
     }
   } else {
      carPriceObject = foundLocation.find(location => {
         const [minPrice, maxPrice] = location.carPrice.split('-').map(parseFloat);
         return price >= minPrice && price <= maxPrice;
      });
   }

   if (carPriceObject) {
      // Найден объект, соответствующий диапазону цены
      res.json(carPriceObject);
   } else {
      // Объект не найден для заданного диапазона цены
      res.status(404).json({ error: 'Объект для заданного диапазона цены не найден' });
   }
});

// Обработка запроса на получение данных
app.get('/data', async (req, res) => {
   try {
      // Отправляем запрос на указанный URL для получения JSON-данных
      const response = await axios.get('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json');
      // Отправляем полученные данные обратно на клиент
      const usdObject = response.data.find(obj => obj.txt === "Долар США");
      const euroObject = response.data.find(obj => obj.txt === "Євро");

      res.json({ usdObject: usdObject, euroObject: euroObject });
   } catch (error) {
      console.error('Ошибка при получении данных:', error);
      res.status(500).json({ error: 'Произошла ошибка при получении данных' });
   }
});

// Запуск сервера
app.listen(PORT, () => {
   console.log(`Сервер запущен на порту ${PORT}`);
});
