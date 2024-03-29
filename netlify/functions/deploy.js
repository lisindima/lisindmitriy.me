exports.handler = (event, context, callback) => {
  if (!event.queryStringParameters.device_id) {
    return callback(null, {
      statusCode: 400,
      body: JSON.stringify({
        error: "missing device_id",
      }),
    })
  }

  if (!event.body) {
    return callback(null, {
      statusCode: 400,
      body: JSON.stringify({
        error: "missing body",
      }),
    })
  }

  let body

  try {
    body = JSON.parse(event.body)
  } catch (err) {
    return callback(null, {
      statusCode: 500,
      body: err.message,
    })
  }
  const device_id = event.queryStringParameters.device_id

  var apn = require("@parse/node-apn")

  var options = {
    token: {
      key: `./files/AuthKey_L3F379QHSL.p8`,
      keyId: "L3F379QHSL",
      teamId: "48HFZR3X8K",
    },
    production: true,
  }

  var apnProvider = new apn.Provider(options)
  var note = new apn.Notification()

  var successBody = "Netlify has successfully deployed your site."

  var context = body.context == "production" ? "Production" : "Deploy-preview"

  note.rawPayload = {
    from: "node-apn",
    source: "web",
    aps: {
      alert: {
        title: body.state == "ready" ? "Success deploy" : "Failed deploy",
        subtitle: `${body.name}` + " | " + context,
        body: body.state == "ready" ? successBody : body.error_message,
        action: `netliphy://open?deployId=${body.id}`,
      },
      sound: "ping.aiff",
      badge: 1,
    },
  }

  note.topic = "com.darkfox.netliphy"

  apnProvider.send(note, device_id).then(result => {
    console.log("sent:", result.sent.length)
    console.log("failed:", result.failed.length)
    console.log("error:", result.failed)

    apnProvider.shutdown()

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        success: result.sent,
      }),
    })
  })
}
