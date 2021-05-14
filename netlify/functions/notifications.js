exports.handler = function (event, context, callback) {

    const device_id = event.queryStringParameters.device_id
    const { APNS } = require('apns2')
    const key = require(`../../files/AuthKey_L3F379QHSL.p8`);
    const fs = require('fs')

    const client = new APNS({
      team: `48HFZR3X8K`,
      keyId: `L3F379QHSL`,
      signingKey: fs.readFileSync(`../../files/AuthKey_L3F379QHSL.p8`),
      defaultTopic: `com.darkfox.netliphy`
    })
    
    const { BasicNotification } = require('apns2')

    const bn = new BasicNotification('51c1238490bddaf8aa1812b33e7b53825af1a9046aec00b7acf4cb5b29b6cb68', 'Hello, World')

    try {
      client.send(bn)
    } catch (err) {
      console.error(err.reason)
    }

    callback(null, {
      statusCode: 200,
      body: `Notification sent: 51c1238490bddaf8aa1812b33e7b53825af1a9046aec00b7acf4cb5b29b6cb68`,
    });
  };