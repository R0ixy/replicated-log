# Dockerfile in the "master" directory
FROM oven/bun:slim
WORKDIR /app
COPY . .
RUN bun install
CMD ["bun", "start"]
