exports.handler = function (event, context, callback) {

    const device_id = event.queryStringParameters.device_id
    const name_site = event.queryStringParameters.name_site
    const type = event.queryStringParameters.type

    callback(null, {
      statusCode: 200,
      body: `Notification sent: ${device_id}`,
    });
  };