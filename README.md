# WebRtc
WebRtc With Audio And Video Conncet

## Warning:Must use with Chrome.

## Install
Config the nginx

server {
        listen       443 ssl;
        server_name  rtc.iu2us.com;

        ssl_certificate      cert/rtc.iu2us.com.crt;
        ssl_certificate_key  cert/rtc.iu2us.com.key;

        ssl_session_cache    shared:SSL:1m;
        ssl_session_timeout  5m;

        ssl_ciphers  HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers  on;

        location / {
            root   /usr/local/var/www/WebRtc;
            index  index.html index.htm;
        }

        location /uploadOtherCard {
             proxy_redirect off;
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
             proxy_pass https://XXXXXXX.com;
        }
    }

You can find the cert in the dir.

