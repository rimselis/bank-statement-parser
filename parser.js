const fs = require('fs');
const xmlParser = require('xml2js').Parser({
  attrkey: 'elementAttributes',
  charkey: 'elementValue',
});

const xmlFile = process.argv[2];
if (!xmlFile) {
  console.log('Please provide XML file as first argument.');
  process.exit(0);
}

fs.readFile(xmlFile, function (err, data) {
  if (err) {
    console.log('File could not be opened');
    process.exit(0);
  }

  xmlParser.parseString(data, extractData);
});

function extractData(err, data) {

  if (err) {
    console.log('XML could not be parsed');
    process.exit(0);
  }
  
  const rootElement = data.Document.BkToCstmrStmt[0];

  console.log(`\nParsing bank statement generated: ${rootElement.GrpHdr[0].CreDtTm}\n`);
  console.log('Statement period:');
  console.log(`From: ${new Date(rootElement.Stmt[0].FrToDt[0].FrDtTm).toLocaleString('lt')}`);
  console.log(`To  : ${new Date(rootElement.Stmt[0].FrToDt[0].ToDtTm).toLocaleString('lt')}`);
  console.log();

  // taking first statement only - assuming one currency only
  const statement = rootElement.Stmt[0];
  if (statement.Acct[0].Ccy[0] !== 'EUR') {
    console.log('Account statement currency not EUR');
    process.exit(0);
  }

  const transactions = parseTransactions(statement);

  transactions.map(tx => {
    console.log(tx);
  });
}

function parseTransactions(statement) {

  // filtering in CREDIT transaction only as we want to get the incoming amounts only
  const entries = statement.Ntry.filter(entry => entry.CdtDbtInd[0] === 'CRDT');

  const processedTransactions = entries.map(entry => {

    const transactionAmount = +entry.Amt[0].elementValue;
    const transactionCurrency = entry.Amt[0].elementAttributes.Ccy;
    const transactionReference = entry.NtryDtls[0].TxDtls[0].RmtInf[0].Ustrd[0];
    const transactionId = entry.NtryDtls[0].TxDtls[0].Refs[0].TxId[0];
    const transactionDateTime = new Date(entry.BookgDt[0].DtTm[0]);

    return {
      dateTime: transactionDateTime,
      id: transactionId,
      reference: transactionReference,
      amount: transactionAmount,
      currency: transactionCurrency, 
    };
  });

  return processedTransactions;
}
