import { parse } from 'querystring'

exports.handler = function (event, context, callback) {

    const device_id = event.queryStringParameters.device_id
    const body = event.body

    let deploy = {} 

    try {
        deploy = JSON.parse(body)
      } catch (e) {
        deploy = parse(body)
      }


    callback(null, {
      statusCode: 200,
      body: deploy,
    });
  };