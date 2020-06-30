#FROM debian:stable-slim

#RUN apt-get update && apt-get install -y git

FROM alpine:latest

RUN apk add --no-cache bash

RUN apk add git

COPY entrypoint.sh /entrypoint.sh

RUN chmod 777 entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]