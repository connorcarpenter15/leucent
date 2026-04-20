FROM rust:1.83-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
      pkg-config libssl-dev ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY apps/realtime-server/Cargo.toml apps/realtime-server/Cargo.lock* ./
COPY apps/realtime-server/src ./src

RUN cargo build --release --bin leucent-realtime

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /build/target/release/leucent-realtime /app/leucent-realtime

EXPOSE 4000
ENV RUST_LOG=info
CMD ["/app/leucent-realtime"]
