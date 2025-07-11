// routes/index.js
const express = require('express');
const router = express.Router();
const sendMail = require('../controllers/emailController');
const notification = require('../controllers/notificationController');

//Rota Padrão
router.get('/', async (req, res) => {
  return res.status(200).json(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Bem-vindo à API Flota</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f5f5f5;
          color: #333;
          margin: 0;
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
        }
        h1 {
          color: #0070f3;
          margin-bottom: 20px;
        }
        p {
          font-size: 1.1rem;
          line-height: 1.6;
        }
        code {
          background: #eee;
          padding: 4px 8px;
          border-radius: 5px;
          font-size: 0.95rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 API Flota</h1>
        <p>Bem-vindo à API de Gestão de Viaturas e Licenças.</p>
        <p>Use os endpoints disponíveis em <code>/api</code> para interagir com os recursos da plataforma.</p>
        <p>Documentação estará disponível em breve.</p>
      </div>
    </body>
    </html>
  `);
});

// Enviar confirmação
router.get("/check-documentos", notification.checkDocumentosENotificar);
router.post("/send-confirmation", sendMail.saveConfirmationEmail);
router.post("/notifications", sendMail.enviarMailNotificacao);
router.post("/reset-password", sendMail.enviarMailResetPassword);

// Confirmar e-mail
router.get("/confirm-email", sendMail.validationEmailConfirmation);

module.exports = router;