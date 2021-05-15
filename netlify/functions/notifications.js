exports.handler = async (event, context) => {
  const device_id = event.queryStringParameters.device_id

  if (!device_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "missing device_id",
      }),
    }
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "missing body",
      }),
    }
  }

  let bodyJson = {}
  console.log(event)
  try {
    bodyJson = JSON.parse(event.body)
  } catch (e) {
    console.log(e)
  }

  var apn = require("node-apn")

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

  var successBody = "Netlify has successfully deployed your site."
  var failedBody = "Netlify couldn’t deploy your site."

  note.rawPayload = {
    from: "node-apn",
    source: "web",
    aps: {
      alert: {
        title: bodyJson.state == "ready" ? "Success deploy" : "Failed deploy",
        subtitle: bodyJson.name,
        body: bodyJson.state == "ready" ? successBody : failedBody,
        action: `netliphy://open?deployId=${bodyJson.id}`,
      },
      sound: "ping.aiff",
      category: "deploy",
    },
  }

  note.topic = "com.darkfox.netliphy"

  apnProvider.send(note, device_id).then(result => {
    console.log("sent:", result.sent.length)
    console.log("failed:", result.failed.length)
    console.log(result.failed)
  })

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: "Notification success sent!",
      device_id: device_id,
    }),
  }
}
