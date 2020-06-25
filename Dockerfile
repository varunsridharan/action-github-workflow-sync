FROM debian:stable-slim

RUN apt-get update && apt-get install -y git

COPY entrypoint.sh /entrypoint.sh

RUN chmod 777 entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]