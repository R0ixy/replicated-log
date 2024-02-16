## Self-check acceptance test:

```
Start M + S1
send (Msg1, W=1) - Ok
send (Msg2, W=2) - Ok
send (Msg3, W=3) - Wait
send (Msg4, W=1) - Ok
Start S2
Check messages on S2 - [Msg1, Msg2, Msg3, Msg4] 
```


## M logs:
```
2024-02-16T22:16:17.507131014Z Listening on http://localhost:3000/
2024-02-16T22:16:17.507171510Z Socket is live on 0.0.0.0:8080
2024-02-16T22:16:36.437541987Z [TCP] received {"route":"connect","data":{"serverId":"c63c00fb93c5","isBlank":true}}
2024-02-16T22:16:55.009148211Z [HTTP] received POST request on /
2024-02-16T22:16:55.009640587Z [TCP] sent {"route":"new","data":{"id":1,"message":"Msg1"}}
2024-02-16T22:16:55.010575061Z [HTTP] response without ACK for message 1
2024-02-16T22:16:55.022949532Z [TCP] received {"route":"replication","data":{"messageId":1,"status":"ACK"}}
2024-02-16T22:17:04.491740613Z [HTTP] received POST request on /
2024-02-16T22:17:04.500363302Z [TCP] sent {"route":"new","data":{"id":2,"message":"Msg2"}}
2024-02-16T22:17:04.509865749Z [TCP] received {"route":"replication","data":{"messageId":2,"status":"ACK"}}
2024-02-16T22:17:04.510555224Z [HTTP] response after 1 ACK for message 2
2024-02-16T22:17:14.202028821Z [HTTP] received POST request on /
2024-02-16T22:17:14.202113299Z [TCP] sent {"route":"new","data":{"id":3,"message":"Msg3"}}
2024-02-16T22:17:14.215251614Z [TCP] received {"route":"replication","data":{"messageId":3,"status":"ACK"}}
2024-02-16T22:17:31.494348199Z [HTTP] received POST request on /
2024-02-16T22:17:31.494559132Z [TCP] sent {"route":"new","data":{"id":4,"message":"Msg4"}}
2024-02-16T22:17:31.494797155Z [HTTP] response without ACK for message 4
2024-02-16T22:17:34.507715096Z [TCP] sent {"route":"retry","data":{"id":4,"message":"Msg4"}}
2024-02-16T22:17:39.008799623Z [TCP] sent {"route":"retry","data":{"id":4,"message":"Msg4"}}
2024-02-16T22:17:45.761770696Z [TCP] sent {"route":"retry","data":{"id":4,"message":"Msg4"}}
2024-02-16T22:17:47.828463404Z [TCP] received {"route":"connect","data":{"serverId":"b48ac3fe0764","isBlank":true}}
2024-02-16T22:17:47.828516289Z [TCP] sent {"route":"old","data":[{"id":1,"message":"Msg1"},{"id":2,"message":"Msg2"},{"id":3,"message":"Msg3"},{"id":4,"message":"Msg4"}]}
2024-02-16T22:17:55.923954099Z [TCP] sent {"route":"retry","data":{"id":4,"message":"Msg4"}}
2024-02-16T22:17:55.926252022Z [TCP] received {"route":"replication","data":{"messageId":4,"status":"ACK"}}
2024-02-16T22:18:07.677589196Z [HTTP] received GET request on /
2024-02-16T22:18:07.677641129Z [HTTP] response for GET request on /: [{"id":1,"message":"Msg1"},{"id":2,"message":"Msg2"},{"id":3,"message":"Msg3"},{"id":4,"message":"Msg4"}]
```

## S1 logs:
```
2024-02-16T22:16:36.425918496Z Listening on http://localhost:3001/
2024-02-16T22:16:36.425998791Z [TCP] sent {"route":"connect","data":{"serverId":"c63c00fb93c5","isBlank":true}}
2024-02-16T22:16:36.435690400Z open socket connection
2024-02-16T22:16:36.435755296Z socket is healthy
2024-02-16T22:16:55.011062940Z [TCP] received {"route":"new","data":{"id":1,"message":"Msg1"}}
2024-02-16T22:16:55.022498537Z [TCP] sent {"route":"replication","data":{"messageId":1,"status":"ACK"}}
2024-02-16T22:17:04.500385988Z [TCP] received {"route":"new","data":{"id":2,"message":"Msg2"}}
2024-02-16T22:17:04.508228657Z [TCP] sent {"route":"replication","data":{"messageId":2,"status":"ACK"}}
2024-02-16T22:17:14.204339525Z [TCP] received {"route":"new","data":{"id":3,"message":"Msg3"}}
2024-02-16T22:17:14.214845219Z [TCP] sent {"route":"replication","data":{"messageId":3,"status":"ACK"}}
2024-02-16T22:17:31.496862993Z [TCP] received {"route":"new","data":{"id":4,"message":"Msg4"}}
2024-02-16T22:17:31.507430707Z simulating replication error
2024-02-16T22:17:34.509087585Z [TCP] received {"route":"retry","data":{"id":4,"message":"Msg4"}}
2024-02-16T22:17:34.509118580Z simulating replication error
2024-02-16T22:17:39.015196042Z [TCP] received {"route":"retry","data":{"id":4,"message":"Msg4"}}
2024-02-16T22:17:39.015233336Z simulating replication error
2024-02-16T22:17:45.762903222Z [TCP] received {"route":"retry","data":{"id":4,"message":"Msg4"}}
2024-02-16T22:17:45.762947123Z simulating replication error
2024-02-16T22:17:55.925592587Z [TCP] received {"route":"retry","data":{"id":4,"message":"Msg4"}}
2024-02-16T22:17:55.925678766Z [TCP] sent {"route":"replication","data":{"messageId":4,"status":"ACK"}}
2024-02-16T22:18:12.642511749Z [HTTP] received GET request on /
2024-02-16T22:18:12.642552996Z [HTTP] response for GET request on /: [{"id":1,"message":"Msg1"},{"id":2,"message":"Msg2"},{"id":3,"message":"Msg3"},{"id":4,"message":"Msg4"}]
```

## S2 logs:
```
2024-02-16T22:17:47.810448305Z Listening on http://localhost:3001/
2024-02-16T22:17:47.811083325Z [TCP] sent {"route":"connect","data":{"serverId":"b48ac3fe0764","isBlank":true}}
2024-02-16T22:17:47.828513789Z open socket connection
2024-02-16T22:17:47.828529185Z socket is healthy
2024-02-16T22:17:47.840352137Z [TCP] received {"route":"old","data":[{"id":1,"message":"Msg1"},{"id":2,"message":"Msg2"},{"id":3,"message":"Msg3"},{"id":4,"message":"Msg4"}]}
2024-02-16T22:18:15.977880152Z [HTTP] received GET request on /
2024-02-16T22:18:15.977935338Z [HTTP] response for GET request on /: [{"id":1,"message":"Msg1"},{"id":2,"message":"Msg2"},{"id":3,"message":"Msg3"},{"id":4,"message":"Msg4"}]
```
