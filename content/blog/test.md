---
path: test
date: 2019-12-10T08:47:44.307Z
title: Test
description: test
---
```
struct ContentView : View {

@EnvironmentObject var session: SessionStore

  func getUser() {
    session.listen()
  }
  var body: some View {
    Group {
      if (session.session != nil) {
        Tabbed()
      } else {
        AuthenticationScreen()
      }
    }.onAppear(perform: getUser)
  }
}
```
twtst teadfss
