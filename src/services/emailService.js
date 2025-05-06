const nodemailer = require("nodemailer");
require("dotenv").config();

//Criar o Transporte SMTP.
/*const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  //secure: true, //Para uso do certificado SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});*/

//Criar Transporte com GMAIL
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//Envio de e-mail de confirmação.
const sendMail = (to, subject, body)=>{
  transporter.sendMail({
    from: `"Flota Vista" <${process.env.EMAIL_FROM}>`,
    to: to,
    subject: subject,
    html: body,
  }, (error, info) => {
    if (error) {
      return console.error("Erro ao enviar e-mail:", error);
    }
    console.log(`E-mail enviado para ${email}: ${info.response}`);
  });
};

module.exports = sendMail;
