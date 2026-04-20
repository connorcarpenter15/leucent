# Base image used inside each per-interview sandbox container.
# Built and pushed separately; the provisioner just references it by name.
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      git curl ca-certificates build-essential nodejs npm postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -ms /bin/bash leucent
WORKDIR /workspace
RUN chown leucent:leucent /workspace

USER leucent

CMD ["sleep", "infinity"]
