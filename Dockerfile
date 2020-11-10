FROM varunsridharan/actions-alpine:latest

LABEL maintainer="Varun Sridharan<varunsridharan23@gmail.com>"

LABEL org.opencontainers.image.source = "https://github.com/varunsridharan/action-github-workflow-sync/"

LABEL org.opencontainers.image.authors="Varun Sridharan <varunsridharan23@gmail.com>"

LABEL org.opencontainers.image.url="https://github.com/varunsridharan/action-github-workflow-sync/"

LABEL org.opencontainers.image.documentation="https://github.com/varunsridharan/action-github-workflow-sync/"

LABEL org.opencontainers.image.vendor="Varun Sridharan"

COPY entrypoint.sh /entrypoint.sh

RUN chmod 777 entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]