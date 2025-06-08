const nodemailer = require("nodemailer");
require("dotenv").config();
const logo = require('../upload/logo');

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
    from: `'Flota Vista' <${process.env.EMAIL_FROM}>`,
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

function enviarEmailDocumentosExpirados(destinatario, documentos) {
  const html = gerarEmailHTML(documentos);

  const mailOptions = {
    from:  `'Flota Vista' <${process.env.EMAIL_FROM}>`,
    to: destinatario,
    subject: 'Documentos expirados ou a vencer - Flota Vista',
    html
  };

  transporter.sendMail(mailOptions);
};

function gerarEmailHTML(documentos) {
  const listaHTML = documentos.map(doc => {
    const dataFormatada = new Date(doc.validade).toLocaleDateString('pt-BR');
    const statusLabel = doc.status === 'expirado' ? 'Vencido' : 'A vencer';
    return `<li><strong>${doc.tipo}</strong> (Nº ${doc.numero}) - ${statusLabel} em: <strong>${dataFormatada}</strong></li>`;
  }).join('');

  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <title>Licenças Expiradas - Flota Vista</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px; color: #000000;">
    <div style="max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 40px; border-radius: 8px;">
      <div style="text-align: center;">
        <img src="${logo}" alt="Flota Vista" style="width: 150px; margin-bottom: 30px;">
      </div>
      <h2 style="color: #d32f2f;">Atenção! Documentos vencidos ou a vencer</h2>
      <p>Detectamos que os seguintes documentos vinculados à sua frota precisam de atenção:</p>

      <ul style="margin: 20px 0;">
        ${listaHTML}
      </ul>

      <p>É importante renovar estes documentos o quanto antes para evitar penalidades ou interrupções nas atividades.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://flotavista.com/licencas" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Ver Documentos
        </a>
      </div>

      <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;">

      <p><strong>Precisa de ajuda?</strong></p>
      <p>
        Acesse nossa <a href="https://flotavista.com/ajuda" style="color: #4f46e5;">página de ajuda</a> ou entre em contato pelo e-mail 
        <a href="mailto:suporte@flotavista.com" style="color: #4f46e5;">suporte@flotavista.com</a>.
      </p>

      <p style="margin-top: 40px;">Atenciosamente, <br><strong>Equipe Flota Vista</strong></p>
    </div>
  </body>
  </html>
  `;
};

module.exports = {
  sendMail,
  enviarEmailDocumentosExpirados
};
