exports.handler = function (event, context, callback) {

    const device_id = event.queryStringParameters.device_id
    var apn = require('@parse/node-apn');
    const key = require(`../../files/AuthKey_L3F379QHSL.p8`);

    var options = {
        token: {
          key: key,
          keyId: "L3F379QHSL",
          teamId: "48HFZR3X8K"
        },
        production: false
    };
      
    var apnProvider = new apn.Provider(options);

    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
    note.payload = {'messageFrom': 'John Appleseed'};
    note.topic = "<your-app-bundle-id>";

    apnProvider.send(note, "51c1238490bddaf8aa1812b33e7b53825af1a9046aec00b7acf4cb5b29b6cb68").then( (result) => {
        // see documentation for an explanation of result
    });

    callback(null, {
      statusCode: 200,
      body: `Notification sent: 51c1238490bddaf8aa1812b33e7b53825af1a9046aec00b7acf4cb5b29b6cb68`,
    });
  };