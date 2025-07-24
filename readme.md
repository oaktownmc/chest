# <img src="https://github.com/oaktownmc/chest/blob/master/static/oakchest.png?raw=true" alt="oak chest" height="60" />
a free file sharing service! source code for https://chest.oaktown.cc
## self-hosting
you will need nginx. here is the server config:
```nginx
server {
    # ...

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_cache_bypass $http_upgrade;

        client_max_body_size 6G;
    }

    # ...
}
```
to install the requirements, run:
```shell
npm install
```
to start the server, run:
```shell
node server.js
```
the server will start and host at http://localhost:3000.
