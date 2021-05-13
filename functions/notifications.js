exports.handler = function (event, context, callback) {

    const device_id = event.queryStringParameters.device_id
    const body = event.body

    let deploy = {} 

    try {
        deploy = JSON.parse(body)
      } catch (e) {
        console.log(e)
      }


    callback(null, {
      statusCode: 200,
      body: deploy,
    });
  };