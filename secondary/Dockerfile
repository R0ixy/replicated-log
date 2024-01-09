# Dockerfile in the "secondary" directory
FROM oven/bun:slim
WORKDIR /app
COPY . .
RUN bun install
CMD ["bun", "start"]
