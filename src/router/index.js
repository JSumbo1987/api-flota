// routes/index.js
const express = require('express');
const router = express.Router();
const sendMail = require('../controllers/emailController');

//Rota Padrão
router.get('/', async (req, res) => {
  return res.status(200).json({
    message: "Bem-Vindo a API de integração com o sistema de gestão de Frota."
  });
});

// Enviar confirmação
router.post("/send-confirmation", sendMail.saveConfirmationEmail);
router.post("/notifications", sendMail.enviarMailNotificacao);
router.post("/reset-password", sendMail.enviarMailResetPassword);

// Confirmar e-mail
router.get("/confirm-email", sendMail.validationEmailConfirmation);

module.exports = router;