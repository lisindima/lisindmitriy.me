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
  try {
    bodyJson = JSON.parse(event.body)
  } catch (e) {
    console.log(e)
  }

  const jwt = require("jsonwebtoken")
  const http2 = require("http2")
  const fs = require("fs")

  /*
Read p8 file. Assumes p8 file to be in same directory
*/
  const key = fs.readFileSync(
    "/var/task/src/files/AuthKey_L3F379QHSL.p8",
    "utf8"
  )

  //"iat" should not be older than 1 hr from current time or will get rejected
  const token = jwt.sign(
    {
      iss: "48HFZR3X8K", //"team ID" of your developer account
      iat: 1621172963, //Replace with current unix epoch time [Not in milliseconds, frustated me :D]
    },
    key,
    {
      header: {
        alg: "ES256",
        kid: "L3F379QHSL", //issuer key which is "key ID" of your p8 file
      },
    }
  )

  /*
  Use 'https://api.push.apple.com' for production build
*/

  host = "https://api.sandbox.push.apple.com"
  path = `/3/device/${device_id}`

  const client = http2.connect(host)

  client.on("error", err => console.error(err))

  body = {
    aps: {
      alert: "hello",
      "content-available": 1,
    },
  }

  headers = {
    ":method": "POST",
    "apns-topic": "com.darkfox.netliphy", //your application bundle ID
    ":scheme": "https",
    ":path": path,
    authorization: `bearer ${token}`,
  }

  const request = client.request(headers)

  request.on("response", (headers, flags) => {
    for (const name in headers) {
      console.log(`${name}: ${headers[name]}`)
    }
  })

  request.setEncoding("utf8")
  let data = ""
  request.on("data", chunk => {
    data += chunk
  })
  request.write(JSON.stringify(body))
  request.on("end", () => {
    console.log(`\n${data}`)
    client.close()
  })
  request.end()

  // var apn = require("node-apn")

  // var options = {
  //   token: {
  //     key: `files/AuthKey_L3F379QHSL.p8`, // `/var/task/src/files/AuthKey_L3F379QHSL.p8`
  //     keyId: "L3F379QHSL",
  //     teamId: "48HFZR3X8K",
  //   },
  //   production: false,
  // }

  // var apnProvider = new apn.Provider(options)
  // var note = new apn.Notification()

  // var successBody = "Netlify has successfully deployed your site."
  // var failedBody = "Netlify couldn’t deploy your site."

  // note.rawPayload = {
  //   from: "node-apn",
  //   source: "web",
  //   aps: {
  //     alert: {
  //       title: bodyJson.state == "ready" ? "Success deploy" : "Failed deploy",
  //       subtitle: bodyJson.name,
  //       body: bodyJson.state == "ready" ? successBody : failedBody,
  //       action: `netliphy://open?deployId=${bodyJson.id}`,
  //     },
  //     sound: "ping.aiff",
  //     category: "deploy",
  //   },
  // }

  // note.topic = "com.darkfox.netliphy"

  // apnProvider.send(note, device_id).then(result => {
  //   console.log("sent:", result.sent.length)
  //   console.log("failed:", result.failed.length)
  //   console.log(result.failed)
  // })

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: "Notification success sent!",
      device_id: device_id,
    }),
  }
}
