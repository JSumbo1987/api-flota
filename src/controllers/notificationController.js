const path = require("path");
const fs = require('fs');
const { checkDocumentExpirations } = require("../services/notificationService");

 //Carregar Ficheiros HTML.
  let welcome = fs.readFileSync(path.join(__dirname, "../upload/welcome.html"), 'utf-8');

const checkDocumentos = async(req, res)=>{
    try {
        await checkDocumentExpirations();
    } catch (error) {
        return res.status(500).json({message: 'Erro ao checar documentos, por favor verifique a console.', error});
    }
};

const welcomeRoute = async(req, res)=>{
    try {
        res.sendFile(__dirname + '/welcome.html');
    } catch (error) {
        return res.status(500).json({message: 'Erro ao encaminhar para rota padrão, por favor verifique a console.', error});
    }
};

module.exports = { checkDocumentos, welcomeRoute};