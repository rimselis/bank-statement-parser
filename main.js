const { extractTransactions } = require('./parser');
const { writeToCsv } = require('./csv-writer');
// const { extractSubscriptions } = require('./subscriptions');

Promise.all([
  extractTransactions('SEB_EXPORT_DEV_0003.xml', /\s*txnx\s*(VI|ST|OC|FL|1OFF)\s*(\d+)\s*/i),
  // extractSubscriptions('INITIAL_SUBSCRIPTIONS.json')
])
  .then(([data, subscriptions]) => {
    const transactions = [...data].sort((tnx1, tnx2) => tnx1.unixDateTime - tnx2.unixDateTime);

    const unprocessedPayments = subscriptions
      ? transactions.filter(tnx => !subscriptions.processedPayments.includes(tnx.tnxId))
      : transactions;

    unprocessedPayments.map(tnx => console.log(tnx));
    writeToCsv(`${new Date().getTime()}.csv`, unprocessedPayments).then(() => console.log('success'));
  });
