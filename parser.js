const fs = require('fs');
const util = require('util');
const xml2js = require('xml2js');

exports.extractTransactions = (xmlFile, tnxExpression) => {
  if (!xmlFile) {
    return new Error('Please provide XML file as first argument.');
  }

  return new Promise((resolve, reject) => {
    fs.readFile(xmlFile, function (err, xmlString) {
      if (err) {
        reject(err);
      }

      const parserOptions = { attrkey: 'elementAttributes', charkey: 'elementValue' };
      util.promisify(xml2js.parseString)(xmlString, parserOptions)
        .then(data => resolve(extractDataFromXMLObject(data, tnxExpression)))
        .catch(err => reject(err));
    });
  });
};

function extractDataFromXMLObject (data, tnxExpression) {
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

  const transactions = parseTransactions(statement, tnxExpression);

  return transactions;
}

function parseTransactions (statement, tnxExpression) {
  // filtering in CREDIT transaction only as we want to get the incoming amounts only
  const entries = statement.Ntry.filter(entry => {
    const matchReferenceRegex = tnxExpression
      ? tnxExpression.test(entry.NtryDtls[0].TxDtls[0].RmtInf[0].Ustrd[0])
      : true;
    return entry.CdtDbtInd[0] === 'CRDT' && matchReferenceRegex;
  });

  const processedTransactions = entries.map(entry => {
    const transactionAmount = +entry.Amt[0].elementValue;
    const transactionCurrency = entry.Amt[0].elementAttributes.Ccy;
    const transactionReference = entry.NtryDtls[0].TxDtls[0].RmtInf[0].Ustrd[0];
    const transactionReferenceParts = tnxExpression.exec(transactionReference);
    const transactionId = entry.NtryDtls[0].TxDtls[0].Refs[0].TxId[0];
    const transactionDateTime = entry.BookgDt[0].DtTm[0];
    const transactionUnixDateTime = new Date(transactionDateTime).getTime();

    const transaction = {
      dateTime: transactionDateTime,
      unixDateTime: transactionUnixDateTime,
      tnxId: transactionId,
      reference: transactionReference,
      referenceMatch: transactionReferenceParts,
      amount: transactionAmount,
      currency: transactionCurrency
    };

    return transaction;
  });

  return processedTransactions;
}
