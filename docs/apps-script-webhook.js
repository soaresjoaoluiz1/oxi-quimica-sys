/**
 * OXIQUÍMICA VARGINHA — Webhook do form + integração CRM Dros
 *
 * Versão 2: aceita TODOS os campos novos (CNPJ, região, UTMs, fbp/fbc,
 * gclid/fbclid, referrer, page_url, event_id, user_agent).
 *
 * Cola TODO esse arquivo no editor do Apps Script (substitui o conteúdo)
 * e clica em "Implantar → Gerenciar implantações → Editar (lápis) →
 * Versão: nova → Implantar".
 */

const SHEET_NAME = 'Cadastros';
const CRM_WEBHOOK_URL = 'https://drosagencia.com.br/crm/api/webhooks/sheets/oxi-quimica';

/**
 * Ordem ideal das colunas. Se a planilha já tiver outras colunas (legacy
 * tipo "Segmento"), elas são preservadas — só são ADICIONADAS as que
 * faltarem, no final.
 */
const COLUMNS = [
  'Data/Hora',
  'Nome',
  'WhatsApp',
  'Cidade/UF',
  'Objetivo',
  'Tem CNPJ',
  'Região',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'Referrer',
  'First Landing',
  'Page URL',
  'User Agent',
  'Event ID',
  'FBP',
  'FBC'
];

/**
 * Mapeia cada nome de header pra função que extrai o valor do payload.
 * Centralizado: muda aqui, não precisa mexer em outro lugar.
 */
const FIELD_MAP = {
  'Data/Hora':     d => d.data || new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  'Nome':          d => d.nome || '',
  'WhatsApp':      d => d.telefone || '',
  'Cidade/UF':     d => d.cidade || d.regiao || '',
  'Segmento':      d => d.segmento || '',  // legacy
  'Objetivo':      d => d.objetivo || '',
  'Tem CNPJ':      d => d.tem_cnpj || '',
  'Região':        d => d.regiao || '',
  'utm_source':    d => d.utm_source || '',
  'utm_medium':    d => d.utm_medium || '',
  'utm_campaign':  d => d.utm_campaign || '',
  'utm_content':   d => d.utm_content || '',
  'utm_term':      d => d.utm_term || '',
  'gclid':         d => d.gclid || '',
  'fbclid':        d => d.fbclid || '',
  'Referrer':      d => d.referrer || '',
  'First Landing': d => d.first_landing || '',
  'Page URL':      d => d.page_url || '',
  'User Agent':    d => d.user_agent || '',
  'Event ID':      d => d.event_id || '',
  'FBP':           d => d.fbp || '',
  'FBC':           d => d.fbc || ''
};

/* ─────────────── ENTRY POINT ─────────────── */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrUpdateSheet();
    appendRowMapped(sheet, data);
    forwardToCRM(data);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('ERRO doPost: ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ─────────────── SHEET ─────────────── */

/**
 * Garante que a aba existe e que TODAS as colunas em COLUMNS estão
 * presentes (adiciona as que faltarem ao FINAL, preservando as legacy).
 */
function getOrUpdateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length)
      .setFontWeight('bold').setBackground('#0f1f4b').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    return sheet;
  }

  /* Adiciona colunas faltantes ao final */
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(h => String(h || '').trim());

  const missing = COLUMNS.filter(c => !headers.includes(c));
  if (missing.length > 0) {
    const startCol = headers.length + 1;
    sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
    sheet.getRange(1, startCol, 1, missing.length)
      .setFontWeight('bold').setBackground('#0f1f4b').setFontColor('#ffffff');
    Logger.log('Headers adicionadas: ' + missing.join(', '));
  }

  if (sheet.getFrozenRows() < 1) sheet.setFrozenRows(1);
  return sheet;
}

/**
 * Lê os headers atuais e monta a linha respeitando a ordem REAL da
 * planilha. Headers desconhecidos viram string vazia.
 */
function appendRowMapped(sheet, data) {
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(h => String(h || '').trim());

  const row = headers.map(h => {
    const fn = FIELD_MAP[h];
    return fn ? String(fn(data) ?? '') : '';
  });

  sheet.appendRow(row);
}

/* ─────────────── CRM ─────────────── */

const OBJETIVO_MAP = {
  'ampliar':     'Já revendo e quero ampliar o meu portfólio',
  'loja':        'Vender em minha loja ou estabelecimento',
  'renda-extra': 'Renda extra pra complementar meu salário',
  'negocio':     'Montar meu próprio negócio de revenda',
  'negócio':     'Montar meu próprio negócio de revenda'
};

function forwardToCRM(data) {
  if (!CRM_WEBHOOK_URL) {
    Logger.log('CRM: URL nao configurada');
    return;
  }

  const slug = String(data.objetivo || '').toLowerCase().trim();
  const objetivoTexto = OBJETIVO_MAP[slug] || data.objetivo || '';

  /* Notas formatadas com info qualificadora + atribuição
     (CRM aceita esse campo como texto livre) */
  const notas = montaNotas(data);

  /* Source enriquecido com utm_source, se houver */
  let source = 'LP_REVENDEDOR';
  if (data.utm_source) source += ` | ${data.utm_source}`;
  if (data.utm_campaign) source += ` | ${data.utm_campaign}`;

  const payload = {
    nome:     data.nome || '',
    telefone: data.telefone || '',
    cidade:   data.cidade || data.regiao || '',
    empresa:  data.segmento || '',  // legacy — não vem mais do form mas mantém compat
    objetivo: objetivoTexto,
    source:   source,
    notas:    notas,
    /* Campos extras (CRM ignora os que não conhecer): */
    tem_cnpj:     data.tem_cnpj || '',
    regiao:       data.regiao || '',
    utm_source:   data.utm_source || '',
    utm_medium:   data.utm_medium || '',
    utm_campaign: data.utm_campaign || '',
    utm_content:  data.utm_content || '',
    utm_term:     data.utm_term || '',
    gclid:        data.gclid || '',
    fbclid:       data.fbclid || '',
    referrer:     data.referrer || '',
    page_url:     data.page_url || '',
    event_id:     data.event_id || ''
  };

  try {
    const resp = UrlFetchApp.fetch(CRM_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log('CRM [' + resp.getResponseCode() + ']: ' + resp.getContentText().substring(0, 300));
  } catch (err) {
    Logger.log('Erro CRM: ' + err.message);
  }
}

/**
 * Monta um texto bonito com tudo que vale registrar nas notas do CRM.
 */
function montaNotas(data) {
  const linhas = [];
  if (data.tem_cnpj) linhas.push('Tem CNPJ: ' + data.tem_cnpj);
  if (data.regiao && data.regiao !== data.cidade) linhas.push('Região: ' + data.regiao);

  const utms = [];
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(k => {
    if (data[k]) utms.push(k + '=' + data[k]);
  });
  if (utms.length) linhas.push('UTM: ' + utms.join(' · '));

  if (data.gclid) linhas.push('gclid: ' + data.gclid);
  if (data.fbclid) linhas.push('fbclid: ' + data.fbclid);
  if (data.referrer) linhas.push('Veio de: ' + data.referrer);
  if (data.first_landing) linhas.push('1ª URL: ' + data.first_landing);

  return linhas.join('\n');
}

/* ─────────────── TESTE LOCAL ─────────────── */

function testar() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        data:     '07/05/2026 10:00:00',
        nome:     'Teste Manual',
        telefone: '(35) 99999-9999',
        cidade:   'Varginha/MG',
        objetivo: 'renda-extra',
        tem_cnpj: 'sim',
        regiao:   'Varginha/MG',
        utm_source:   'meta',
        utm_medium:   'cpc',
        utm_campaign: 'revendedor-mai26',
        utm_content:  'video-vertical-1',
        gclid:    '',
        fbclid:   'fbclid_teste_123',
        referrer: 'https://www.facebook.com/',
        first_landing: 'https://revendedor.oxiquimicavarginha.com.br/?utm_source=meta&utm_campaign=revendedor-mai26',
        page_url: 'https://revendedor.oxiquimicavarginha.com.br/',
        event_id: 'lead_1746000000_abc123',
        fbp:      'fb.1.1746000000.123456789',
        fbc:      'fb.1.1746000000.fbclid_teste_123',
        user_agent: 'Mozilla/5.0 (Linux; Android 13)...'
      })
    }
  };
  const result = doPost(fakeEvent);
  Logger.log(result.getContent());
}
