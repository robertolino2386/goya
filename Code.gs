const SPREADSHEET_ID = "COLE_AQUI_O_ID_DA_PLANILHA";

const SHEETS = {
  projetos: "PROJETOS",
  recebimentos: "RECEBIMENTOS",
  vendas: "VENDAS",
  fornecedores: "PAGAMENTOS_FORNECEDORES"
};

const HEADERS = {
  PROJETOS: ["ID","Nome Projeto","BKO","Cliente","Data Inicio","Data Fim","Valor Antecipado","Status","Consultor","Email Consultor","Observacoes","Criado Em","Atualizado Em"],
  RECEBIMENTOS: ["ID","Projeto ID","Forma","Valor Previsto","Autorizacao","Parcela","Data Prevista","Valor Recebido","Data Recebimento","Status","Observacoes","Criado Em","Atualizado Em"],
  VENDAS: ["ID","Projeto ID","Pax","Fornecedor","Servico","RLOC","Data Servico","Valor Venda","Custo Fornecedor","Status","Observacoes","Criado Em","Atualizado Em"],
  PAGAMENTOS_FORNECEDORES: ["ID","Projeto ID","Fornecedor","RLOC","Valor","Data Pagamento","Comprovante","Status","Observacoes","Criado Em","Atualizado Em"]
};

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "bootstrap";
    if (action === "bootstrap") return jsonOk(bootstrap());
    return jsonError("Ação GET inválida: " + action);
  } catch (err) {
    return jsonError(err.message);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || "{}");
    switch (body.action) {
      case "saveProject": return jsonOk(saveProject(body.item));
      case "saveReceipt": return jsonOk(saveReceipt(body.item));
      case "saveSale": return jsonOk(saveSale(body.item));
      case "saveSupplierPayment": return jsonOk(saveSupplierPayment(body.item));
      case "deleteItem": return jsonOk(deleteItem(body.type, body.id));
      default: return jsonError("Ação POST inválida.");
    }
  } catch (err) {
    return jsonError(err.message);
  }
}

function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.values(SHEETS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = HEADERS[name];
    if (sh.getLastRow() === 0) sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,headers.length).setFontWeight("bold");
    sh.autoResizeColumns(1, headers.length);
  });
}

function bootstrap() {
  setup();
  const projects = readObjects(SHEETS.projetos).map(projectFromRow);
  const receipts = readObjects(SHEETS.recebimentos).map(receiptFromRow);
  const sales = readObjects(SHEETS.vendas).map(saleFromRow);
  const supplierPayments = readObjects(SHEETS.fornecedores).map(supplierFromRow);

  const summary = projects.map(p => {
    const recs = receipts.filter(x => String(x.projetoId) === String(p.id) && x.status !== "Cancelado");
    const sls = sales.filter(x => String(x.projetoId) === String(p.id) && x.status !== "Cancelado");
    const pays = supplierPayments.filter(x => String(x.projetoId) === String(p.id) && x.status === "Pago");

    const recebido = sum(recs, "valorRecebido");
    const previsto = sum(recs, "valorPrevisto");
    const vendas = sum(sls, "valorVenda");
    const pago = sum(pays, "valor");

    return {
      projetoId: p.id,
      antecipado: num(p.valorAntecipado),
      recebido,
      vendas,
      pago,
      saldoCaixa: recebido - pago,
      aReceber: Math.max(0, previsto - recebido)
    };
  });

  return { projects, receipts, sales, supplierPayments, summary };
}

function saveProject(item) {
  if (!/^\d{1,6}$/.test(String(item.bko || ""))) throw new Error("BKO deve conter somente números e no máximo 6 dígitos.");
  if (!item.cliente || !item.nomeProjeto || !item.consultor || !item.emailConsultor) throw new Error("Preencha os campos obrigatórios do projeto.");

  const row = {
    ID: item.id || uid("PRJ"),
    "Nome Projeto": item.nomeProjeto,
    BKO: item.bko,
    Cliente: item.cliente,
    "Data Inicio": item.dataInicio || "",
    "Data Fim": item.dataFim || "",
    "Valor Antecipado": num(item.valorAntecipado),
    Status: item.status || "Em aberto",
    Consultor: item.consultor,
    "Email Consultor": item.emailConsultor,
    Observacoes: item.observacoes || ""
  };
  upsert(SHEETS.projetos, row.ID, row);
  return row;
}

function saveReceipt(item) {
  ensureProject(item.projetoId);
  const isCard = String(item.forma || "").indexOf("Cartão") >= 0;
  if (isCard && !String(item.autorizacao || "").trim()) throw new Error("Número da autorização é obrigatório para cartão.");
  if (!item.valorPrevisto) throw new Error("Informe o valor previsto.");

  const row = {
    ID: item.id || uid("REC"),
    "Projeto ID": item.projetoId,
    Forma: item.forma,
    "Valor Previsto": num(item.valorPrevisto),
    Autorizacao: item.autorizacao || "",
    Parcela: item.parcela || "",
    "Data Prevista": item.dataPrevista || "",
    "Valor Recebido": num(item.valorRecebido),
    "Data Recebimento": item.dataRecebimento || "",
    Status: item.status || "Pendente",
    Observacoes: item.observacoes || ""
  };
  upsert(SHEETS.recebimentos, row.ID, row);
  return row;
}

function saveSale(item) {
  ensureProject(item.projetoId);
  if (!item.pax || !item.fornecedor || !item.rloc) throw new Error("Pax, fornecedor e RLOC são obrigatórios.");

  const row = {
    ID: item.id || uid("VEN"),
    "Projeto ID": item.projetoId,
    Pax: item.pax,
    Fornecedor: item.fornecedor,
    Servico: item.servico,
    RLOC: item.rloc,
    "Data Servico": item.dataServico || "",
    "Valor Venda": num(item.valorVenda),
    "Custo Fornecedor": num(item.custoFornecedor),
    Status: item.status || "Reservado",
    Observacoes: item.observacoes || ""
  };
  upsert(SHEETS.vendas, row.ID, row);
  return row;
}

function saveSupplierPayment(item) {
  ensureProject(item.projetoId);
  const valor = num(item.valor);
  if (item.status === "Pago") {
    const disponivel = getAvailableCash(item.projetoId, item.id);
    if (valor > disponivel + 0.009) {
      throw new Error("Pagamento bloqueado: valor recebido disponível no projeto é " + brl(disponivel) + ".");
    }
  }

  const row = {
    ID: item.id || uid("FOR"),
    "Projeto ID": item.projetoId,
    Fornecedor: item.fornecedor,
    RLOC: item.rloc || "",
    Valor: valor,
    "Data Pagamento": item.dataPagamento || "",
    Comprovante: item.comprovante || "",
    Status: item.status || "Pago",
    Observacoes: item.observacoes || ""
  };
  upsert(SHEETS.fornecedores, row.ID, row);
  return row;
}

function getAvailableCash(projetoId, excludePaymentId) {
  const receipts = readObjects(SHEETS.recebimentos).map(receiptFromRow)
    .filter(x => String(x.projetoId) === String(projetoId) && x.status !== "Cancelado");
  const pays = readObjects(SHEETS.fornecedores).map(supplierFromRow)
    .filter(x => String(x.projetoId) === String(projetoId) && x.status === "Pago" && String(x.id) !== String(excludePaymentId || ""));
  return sum(receipts, "valorRecebido") - sum(pays, "valor");
}

function deleteItem(type, id) {
  const map = { project:SHEETS.projetos, receipt:SHEETS.recebimentos, sale:SHEETS.vendas, supplier:SHEETS.fornecedores };
  const sheetName = map[type];
  if (!sheetName) throw new Error("Tipo inválido.");

  if (type === "project") {
    const inUse = [
      ...readObjects(SHEETS.recebimentos).map(receiptFromRow),
      ...readObjects(SHEETS.vendas).map(saleFromRow),
      ...readObjects(SHEETS.fornecedores).map(supplierFromRow)
    ].some(x => String(x.projetoId) === String(id));
    if (inUse) throw new Error("Não é possível excluir um projeto que possui movimentações.");
  }

  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  const values = sh.getDataRange().getValues();
  const ix = values.findIndex((r, i) => i > 0 && String(r[0]) === String(id));
  if (ix < 0) throw new Error("Registro não encontrado.");
  sh.deleteRow(ix + 1);
  return true;
}

function ensureProject(id) {
  if (!id) throw new Error("Selecione o projeto.");
  const exists = readObjects(SHEETS.projetos).some(x => String(x.ID) === String(id));
  if (!exists) throw new Error("Projeto não encontrado.");
}

function upsert(sheetName, id, rowObj) {
  setup();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(sheetName);
  const headers = HEADERS[sheetName];
  const values = sh.getDataRange().getValues();
  const now = new Date();
  const existingIndex = values.findIndex((r,i)=>i>0 && String(r[0])===String(id));

  const existing = existingIndex > 0 ? objectFrom(headers, values[existingIndex]) : {};
  const finalObj = Object.assign({}, existing, rowObj, {
    "Criado Em": existing["Criado Em"] || now,
    "Atualizado Em": now
  });

  const out = headers.map(h => finalObj[h] !== undefined ? finalObj[h] : "");
  if (existingIndex > 0) sh.getRange(existingIndex+1,1,1,headers.length).setValues([out]);
  else sh.appendRow(out);
}

function readObjects(sheetName) {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  const data = sh.getDataRange().getValues();
  const headers = data.shift().map(String);
  return data.filter(r => r.some(v => v !== "")).map(r => objectFrom(headers,r));
}

function objectFrom(headers,row){ const o={}; headers.forEach((h,i)=>o[h]=row[i]); return o; }

function projectFromRow(o){ return {
  id:o.ID,nomeProjeto:o["Nome Projeto"],bko:String(o.BKO||""),cliente:o.Cliente,
  dataInicio:dateOut(o["Data Inicio"]),dataFim:dateOut(o["Data Fim"]),valorAntecipado:num(o["Valor Antecipado"]),
  status:o.Status,consultor:o.Consultor,emailConsultor:o["Email Consultor"],observacoes:o.Observacoes
};}
function receiptFromRow(o){ return {
  id:o.ID,projetoId:o["Projeto ID"],forma:o.Forma,valorPrevisto:num(o["Valor Previsto"]),autorizacao:o.Autorizacao,
  parcela:o.Parcela,dataPrevista:dateOut(o["Data Prevista"]),valorRecebido:num(o["Valor Recebido"]),
  dataRecebimento:dateOut(o["Data Recebimento"]),status:o.Status,observacoes:o.Observacoes
};}
function saleFromRow(o){ return {
  id:o.ID,projetoId:o["Projeto ID"],pax:o.Pax,fornecedor:o.Fornecedor,servico:o.Servico,rloc:o.RLOC,
  dataServico:dateOut(o["Data Servico"]),valorVenda:num(o["Valor Venda"]),custoFornecedor:num(o["Custo Fornecedor"]),
  status:o.Status,observacoes:o.Observacoes
};}
function supplierFromRow(o){ return {
  id:o.ID,projetoId:o["Projeto ID"],fornecedor:o.Fornecedor,rloc:o.RLOC,valor:num(o.Valor),
  dataPagamento:dateOut(o["Data Pagamento"]),comprovante:o.Comprovante,status:o.Status,observacoes:o.Observacoes
};}

function sum(arr,key){ return arr.reduce((a,x)=>a+num(x[key]),0); }
function num(v){ if(typeof v==="number") return v; if(v===null||v==="")return 0; return Number(String(v).replace(/\./g,"").replace(",","."))||0; }
function uid(prefix){ return prefix + "-" + Utilities.getUuid().slice(0,8).toUpperCase(); }
function dateOut(v){ if(!v)return ""; if(Object.prototype.toString.call(v)==="[object Date]"&&!isNaN(v)) return Utilities.formatDate(v,Session.getScriptTimeZone(),"yyyy-MM-dd"); return String(v).slice(0,10); }
function brl(v){ return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

function jsonOk(data){ return ContentService.createTextOutput(JSON.stringify({ok:true,data})).setMimeType(ContentService.MimeType.JSON); }
function jsonError(error){ return ContentService.createTextOutput(JSON.stringify({ok:false,error})).setMimeType(ContentService.MimeType.JSON); }
