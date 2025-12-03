```
 k6 run scripts/backend/product.ts

         /\      Grafana   /‾‾/
    /\  /  \     |\  __   /  /
   /  \/    \    | |/ /  /   ‾‾\
  /          \   |   (  |  (‾)  |
 / __________ \  |_|\_\  \_____/

     execution: local
        script: scripts/backend/product.ts
        output: -

     scenarios: (100.00%) 2 scenarios, 150 max VUs, 2m30s max duration (incl. graceful stop):
              * details: Up to 50 looping VUs for 2m0s over 3 stages (gracefulRampDown: 30s, exec: gets, gracefulStop: 30s)
              * list: Up to 100 looping VUs for 2m0s over 4 stages (gracefulRampDown: 30s, exec: list, gracefulStop: 30s)



  █ TOTAL RESULTS

    HTTP
    http_req_duration..............: avg=2.44s min=6.34ms  med=864.26ms max=12.76s p(90)=6.51s p(95)=7.55s
      { expected_response:true }...: avg=2.44s min=6.34ms  med=864.26ms max=12.76s p(90)=6.51s p(95)=7.55s
    http_req_failed................: 0.00%  0 out of 4823
    http_reqs......................: 4823   40.017607/s

    EXECUTION
    iteration_duration.............: avg=5.56s min=87.76ms med=5.56s    max=15.38s p(90)=8.2s  p(95)=9.21s
    iterations.....................: 2127   17.648238/s
    vus............................: 25     min=4         max=150
    vus_max........................: 150    min=150       max=150

    NETWORK
    data_received..................: 1.3 GB 10 MB/s
    data_sent......................: 3.9 MB 32 kB/s




running (2m00.5s), 000/150 VUs, 2127 complete and 0 interrupted iterations
details ✓ [======================================] 00/50 VUs    2m0s
list    ✓ [======================================] 000/100 VUs  2m0s
```

```
Every 1.0s: kubectl get pods --label-columns app.kubernetes.io/name=backend-electricilies --namespace electricilies-… kevostro-arch: 03:13:04 PM
                                                                                                                                   in 0.067s (0)
NAME                             READY   STATUS    RESTARTS         AGE    NAME=BACKEND-ELECTRICILIES
electricilies-759bdb8776-bnmsv   1/1     Running   0                3m9s
electricilies-759bdb8776-grxsn   1/1     Running   0                35m
electricilies-759bdb8776-lrm9b   1/1     Running   0                3m9s
redis-0                          2/2     Running   14 (3d18h ago)   44d
```
