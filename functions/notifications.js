exports.handler = function (event, context, callback) {

    const device_id = event.queryStringParameters.device_id

    callback(null, {
      statusCode: 200,
      body: device_id,
    });
  };