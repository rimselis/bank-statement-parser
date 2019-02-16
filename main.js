const { extractTransactions } = require('./parser');
const { extractSubscriptions } = require('./subscriptions');

Promise.all([
  extractTransactions('SEB_EXPORT_DEV_0003.xml', /\s*txnx\s*(VI|ST|OC|FL|1OFF)\s*(\d+)\s*/i),
  extractSubscriptions('INITIAL_SUBSCRIPTIONS.json')
])
  .then(([data, subscriptions]) => {
    const transactions = [...data].sort((tnx1, tnx2) => tnx1.unixDateTime - tnx2.unixDateTime);

    const unprocessedPayments =
      transactions.filter(tnx => !subscriptions.processedPayments.includes(tnx.tnxId));

    unprocessedPayments.map(tnx => console.log(tnx));
  });
