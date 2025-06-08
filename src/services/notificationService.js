// services/notifications.js
const { supabase } = require('../config/supabaseClient');

// Utilitário para calcular dias restantes até o vencimento
function calcularDiasParaVencer(dataVencimentoStr) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataVencimento = new Date(dataVencimentoStr);
  dataVencimento.setHours(0, 0, 0, 0);

  const diffEmMs = dataVencimento.getTime() - hoje.getTime();
  return Math.ceil(diffEmMs / (1000 * 60 * 60 * 24));
}

// Formata data para string no formato YYYY-MM-DD HH:mm:ss
function formatarData(data) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())} ${pad(data.getHours())}:${pad(data.getMinutes())}:${pad(data.getSeconds())}`;
}

// Cria uma notificação se ainda não existir igual
async function saveNotification(titulo, descricao, tipo, rota) {
  const { data: existentes, error: fetchError } = await supabase
    .from('tblnotificacoes')
    .select('id')
    .eq('titulo', titulo)
    .eq('descricao', descricao)
    .eq('tipo', tipo)
    .eq('rota', rota);

  if (fetchError) {
    console.error('Erro ao verificar notificação existente:', fetchError);
    return null;
  }

  if (existentes.length > 0) {
    console.log(`Notificação já existe: "${titulo}"`);
    return null;
  }

  const created_at = formatarData(new Date());
  const { data, error } = await supabase
    .from('tblnotificacoes')
    .insert([{ titulo, descricao, lido: false, tipo, rota, created_at }]);

  if (error) {
    console.error('Erro ao inserir notificação:', error);
    return null;
  }

  console.log(`Notificação criada: "${titulo}"`);
  return data;
}

// Atualiza o status de um documento
async function updateDocumentStatus(tabela, campoStatus, novoStatus, campoId, id) {
  try {
    // Se a tabela for 'usuarios' (ou 'tblusuarios'), não faz atualização e retorna null
    if (tabela === 'tblfuncionarios') {
      console.log(`Ignorando atualização de status para a tabela ${tabela}`);
      return null;
    };

    const { data, error } = await supabase
      .from(tabela)
      .update({ [campoStatus]: novoStatus })
      .eq(campoId, id);

    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`Erro ao atualizar status em ${tabela}:`, err);
    return null;
  }
}

// Verifica e gera notificações para documentos prestes a vencer ou expirados
async function checkDocumentExpirations() {
  console.log("Verificando vencimento de documentos...");

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const tables = [
    { table: 'tblfuncionarios', fieldNumber: 'cartadeconducaonr', field: 'datavalidade', idField: 'funcionarioid', rota: '/funcionarios', label: 'Carta de condução', status: 'estado' },
    { table: 'tblcertificadoinspeccao', fieldNumber: 'numerocertificado', field: 'proximainspeccao', idField: 'id', rota: '/certificados', label: 'Certificado de inspeção', status: 'status' },
    { table: 'tbllicencapublicidade', fieldNumber: 'licencanumero', field: 'datavencimento', idField: 'id', rota: '/licenca-publicidade', label: 'Licença de publicidade', status: 'licencastatus' },
    { table: 'tbllicencatransportacao', fieldNumber: 'licencanumero', field: 'datavencimento', idField: 'id', rota: '/licenca-transporte', label: 'Licença de transportação', status: 'licencastatus' },
  ];

  for (const { table, fieldNumber, field, idField, rota, label, status } of tables) {
    const { data, error } = await supabase.from(table).select(`${fieldNumber}, ${field}, ${idField}, ${status}`);
    if (error || !data) continue;

    for (const item of data) {
      if (!item || typeof item[status] === 'undefined') {
        console.warn('Item inválido ou campo status ausente:', item);
        continue;
      }
      const validade = item[field];
      const estado = item[status];
      if (!validade) continue;

      const dataStr = new Date(validade).toISOString().split('T')[0];
      const diffDias = calcularDiasParaVencer(dataStr);
      const tituloBase = `${label} (Nº ${item[fieldNumber]})`;

      const notificacoes = [
        { cond: diffDias < 0, titulo: 'expirado', tipo: 'error', novoStatus: 'expirado' },
        { cond: diffDias === 0, titulo: 'expira hoje', tipo: 'error', novoStatus: 'expirado' },
        { cond: diffDias <= 5 && diffDias >= 1, titulo: `expira em ${diffDias} dias`, tipo: 'warning', novoStatus: 'a_vencer' },
        { cond: diffDias === 15, titulo: 'expira em 15 dias', tipo: 'warning', novoStatus: 'a_vencer' },
        {
          cond: diffDias > 15 && validade >= primeiroDiaMes && validade <= ultimoDiaMes,
          titulo: 'expira este mês',
          tipo: 'info'
        }
      ];

      for (const notif of notificacoes) {
        if (notif.cond) {
          await saveNotification(`${tituloBase} ${notif.titulo}`, `Vencimento em ${dataStr}`, notif.tipo, `${rota}/${item[idField]}`);
          if (notif.novoStatus && (estado === 'válido' || estado === 'a_vencer')) {
            await updateDocumentStatus(table, status, notif.novoStatus, idField, item[idField]);
          }
          break;
        }
      }
    }
  }
}

// Lista documentos vencidos ou prestes a vencer
async function listarDocumentosVencidosOuAVencer() {
  const hoje = new Date();
  const resultados = [];

  const tables = [
    {
      table: 'tblfuncionarios',
      fieldNumber: 'cartadeconducaonr',
      fieldDate: 'datavalidade',
      idField: 'funcionarioid',
      label: 'Carta de condução',
      rota: '/funcionarios',
      usaStatus: false
    },
    {
      table: 'tblcertificadoinspeccao',
      fieldNumber: 'numerocertificado',
      fieldDate: 'proximainspeccao',
      idField: 'id',
      label: 'Certificado de inspeção',
      rota: '/certificados',
      statusField: 'status',
      usaStatus: true
    },
    {
      table: 'tbllicencapublicidade',
      fieldNumber: 'licencanumero',
      fieldDate: 'datavencimento',
      idField: 'id',
      label: 'Licença de publicidade',
      rota: '/licenca-publicidade',
      statusField: 'licencastatus',
      usaStatus: true
    },
    {
      table: 'tbllicencatransportacao',
      fieldNumber: 'licencanumero',
      fieldDate: 'datavencimento',
      idField: 'id',
      label: 'Licença de transportação',
      rota: '/licenca-transporte',
      statusField: 'licencastatus',
      usaStatus: true
    }
  ];

  for (const config of tables) {
    const { table, fieldNumber, fieldDate, idField, label, rota, usaStatus, statusField } = config;
    let query = supabase.from(table).select(`${fieldNumber}, ${fieldDate}, ${idField}${usaStatus ? `, ${statusField}` : ''}`);
    if (usaStatus) {
      query = query.in(statusField, ['expirado', 'a_vencer']);
    }

    const { data, error } = await query;
    if (error || !data) continue;

    for (const item of data) {
      const validade = item[fieldDate];
      if (!validade) continue;

      const diff = Math.ceil((new Date(validade) - hoje) / (1000 * 60 * 60 * 24));
      const status = usaStatus ? item[statusField] : (diff < 0 ? 'expirado' : diff <= 15 ? 'a_vencer' : 'válido');

      if (['expirado', 'a_vencer'].includes(status)) {
        resultados.push({
          tipo: label,
          numero: item[fieldNumber],
          validade: validade,
          status: status,
          rota: `${rota}/${item[idField]}`
        });
      }
    }
  }

  return resultados;
}

async function obterEmailsPermitidos() {
  const { data, error } = await supabase
    .from('tblusuarios')
    .select('useremail')
    .eq('userreceberemail', true)
    .eq('useremailconfirmed', true);

  if (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
console.log('Meu Email: ',data);
  // Extraindo os e-mails em um array simples
  const emailsPermitidos = data.map(usuario => usuario.useremail);
  return emailsPermitidos;
}

module.exports = {
  saveNotification,
  checkDocumentExpirations,
  listarDocumentosVencidosOuAVencer,
  obterEmailsPermitidos
};

