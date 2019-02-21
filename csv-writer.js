const fs = require('fs');

exports.writeToCsv = (csvFile, data) => {
  if (!csvFile) {
    return new Error('Please provide CSV file as first argument.');
  }

  const csvString = 'tnxId,dateTime,unixDateTime,reference,referenceMatches,amount,currency\r\n' +
    data
      .map(tnx => `${tnx.tnxId},${tnx.dateTime},${tnx.unixDateTime},"${tnx.reference}","${tnx.referenceMatch.join(',')}",${tnx.amount},${tnx.currency}`)
      .join('\r\n');

  return new Promise((resolve, reject) => {
    fs.writeFile(csvFile, csvString, err => {
      if (err) {
        reject(err);
      } else {
        resolve(csvFile);
      }
    });
  });
};
