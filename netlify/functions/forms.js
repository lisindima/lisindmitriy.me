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
      key: `/var/task/src/files/AuthKey_L3F379QHSL.p8`, // `/var/task/src/files/AuthKey_L3F379QHSL.p8`
      keyId: "L3F379QHSL",
      teamId: "48HFZR3X8K",
    },
    production: false,
  }

  var apnProvider = new apn.Provider(options)
  var note = new apn.Notification()

  note.rawPayload = {
    from: "node-apn",
    source: "web",
    aps: {
      alert: {
        title: "New submissions",
        subtitle: body.form_name,
        body: body.body,
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
