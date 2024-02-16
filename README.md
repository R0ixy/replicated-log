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
2024-02-16T21:56:57.788408334Z Listening on http://localhost:3000/
2024-02-16T21:56:57.788446935Z Socket is live on 0.0.0.0:8080
2024-02-16T21:57:04.492924213Z [TCP] received {"route":"connect","data":{"serverId":"159c212228a7","isBlank":true}}
2024-02-16T21:57:29.074961433Z [HTTP] received POST request on /
2024-02-16T21:57:29.075495820Z [TCP] sent {"route":"new","data":{"id":1,"message":"something"}}
2024-02-16T21:57:29.082858332Z [HTTP] response without ACK for message 1
2024-02-16T21:57:29.091953999Z [TCP] received {"route":"replication","data":{"messageId":1,"status":"ACK"}}
2024-02-16T21:57:37.143954265Z [HTTP] received POST request on /
2024-02-16T21:57:37.144226755Z [TCP] sent {"route":"new","data":{"id":2,"message":"something"}}
2024-02-16T21:57:37.160568807Z [TCP] received {"route":"replication","data":{"messageId":2,"status":"ACK"}}
2024-02-16T21:57:37.160696402Z [HTTP] response after 1 ACK for message 2
2024-02-16T21:57:42.560554130Z [HTTP] received POST request on /
2024-02-16T21:57:42.569889719Z [TCP] sent {"route":"new","data":{"id":3,"message":"something"}}
2024-02-16T21:57:45.564367318Z [TCP] sent {"route":"retry","data":{"id":3,"message":"something"}}
2024-02-16T21:57:50.073893870Z [TCP] sent {"route":"retry","data":{"id":3,"message":"something"}}
2024-02-16T21:57:50.076354552Z [TCP] received {"route":"replication","data":{"messageId":3,"status":"ACK"}}
2024-02-16T21:58:02.576302017Z [HTTP] received POST request on /
2024-02-16T21:58:02.576430888Z [TCP] sent {"route":"new","data":{"id":4,"message":"something from another client"}}
2024-02-16T21:58:02.576938572Z [HTTP] response without ACK for message 4
2024-02-16T21:58:02.590365313Z [TCP] received {"route":"replication","data":{"messageId":4,"status":"ACK"}}
2024-02-16T21:58:13.019294381Z [TCP] received {"route":"connect","data":{"serverId":"ac9e2817daf8","isBlank":true}}
2024-02-16T21:58:13.019887514Z [TCP] sent {"route":"old","data":[{"id":1,"message":"something"},{"id":2,"message":"something"},{"id":3,"message":"something"},{"id":4,"message":"something from another client"}]}
```

## S1 logs:
```
2024-02-16T21:57:04.483076845Z Listening on http://localhost:3001/
2024-02-16T21:57:04.483137646Z [TCP] sent {"route":"connect","data":{"serverId":"159c212228a7","isBlank":true}}
2024-02-16T21:57:04.487083013Z open socket connection
2024-02-16T21:57:04.487110214Z socket is healthy
2024-02-16T21:57:29.082858032Z [TCP] received {"route":"new","data":{"id":1,"message":"something"}}
2024-02-16T21:57:29.091036923Z [TCP] sent {"route":"replication","data":{"messageId":1,"status":"ACK"}}
2024-02-16T21:57:37.146064682Z [TCP] received {"route":"new","data":{"id":2,"message":"something"}}
2024-02-16T21:57:37.156745159Z [TCP] sent {"route":"replication","data":{"messageId":2,"status":"ACK"}}
2024-02-16T21:57:42.571802535Z [TCP] received {"route":"new","data":{"id":3,"message":"something"}}
2024-02-16T21:57:42.582389070Z simulating replication error
2024-02-16T21:57:45.570492549Z [TCP] received {"route":"retry","data":{"id":3,"message":"something"}}
2024-02-16T21:57:45.570538347Z simulating replication error
2024-02-16T21:57:50.076085054Z [TCP] received {"route":"retry","data":{"id":3,"message":"something"}}
2024-02-16T21:57:50.076130453Z [TCP] sent {"route":"replication","data":{"messageId":3,"status":"ACK"}}
2024-02-16T21:58:02.579637757Z [TCP] received {"route":"new","data":{"id":4,"message":"something from another client"}}
2024-02-16T21:58:02.590073079Z [TCP] sent {"route":"replication","data":{"messageId":4,"status":"ACK"}}
```

S2 logs:
```
2024-02-16T21:58:13.018781439Z Listening on http://localhost:3001/
2024-02-16T21:58:13.018826034Z [TCP] sent {"route":"connect","data":{"serverId":"ac9e2817daf8","isBlank":true}}
2024-02-16T21:58:13.018837132Z open socket connection
2024-02-16T21:58:13.024823356Z socket is healthy
2024-02-16T21:58:13.039426007Z [TCP] received {"route":"old","data":[{"id":1,"message":"something"},{"id":2,"message":"something"},{"id":3,"message":"something"},{"id":4,"message":"something from another client"}]}
```
