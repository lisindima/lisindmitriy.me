---
path: test
date: 2019-12-10T08:44:02.110Z
title: Test
description: Test descrpription
---
**Test**

`struct ContentView : View {`

`    @EnvironmentObject var session: SessionStore`

`    func getUser() {`

`        session.listen()`

`    }`

`    var body: some View {`

`        Group {`

`            if (session.session != nil) {`

`                Tabbed()`

`            } else {`

`                AuthenticationScreen()`

`            }`

`        }.onAppear(perform: getUser)`

`    }`

`}`

****
