exports.handler = function (event, context, callback) {

    const device_id = event.queryStringParameters.device_id

    // try {
    //   deploy = JSON.parse(event.body)
    // } catch (e) {
    //   console.log(e)
    // }


    callback(null, {
      statusCode: 200,
      body: JSON.parse(event.body),
    });
  };