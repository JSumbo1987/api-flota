// app.js
const path = require("path");
require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const checkDocumentos = require('./controllers/notificationController');
const router = require('./router');
const cors = require('cors');

const corsOptions = {
    //origin: 'https://sistema-transporte-react-js.vercel.app',
    origin: '*', // ou '*' para testes
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

//Configuração Inicial.
const app = express();
app.use(cors(corsOptions)); // 👈 deve vir antes de tudo

//Configuração para permitir o JSON
app.use(express.json());
app.use(express.static(path.join(__dirname, 'upload')));


//Usar as Rotas.
app.use('/api', router);

// Job que roda todos os dias às 00:00
cron.schedule('* * * * *', async () => {
    try {
      await checkDocumentos();
      console.log("Job Rodando...");
    } catch (err) {
      console.error("Erro ao rodar o cron job:", err);
    }
});
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});