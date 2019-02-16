const fs = require('fs');

exports.extractSubscriptions = jsonFile => {
  if (!jsonFile) {
    return new Error('Please provide JSON file as first argument.');
  }

  return new Promise((resolve, reject) => {
    fs.readFile(jsonFile, function (err, jsonString) {
      if (err) {
        reject(err);
      }

      const subscriptions = JSON.parse(jsonString);
      resolve(subscriptions);
    });
  });
};
