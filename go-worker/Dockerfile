FROM golang:1.20-alpine AS build
WORKDIR /app

RUN apk add --no-cache git ca-certificates

ENV GOPROXY=https://proxy.golang.org,direct

COPY go.mod ./

RUN go mod download || true

RUN go get github.com/rabbitmq/amqp091-go@v1.10.0 || true

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o worker main.go


FROM alpine:3.18
RUN apk add --no-cache ca-certificates
WORKDIR /root/
COPY --from=build /app/worker .
ENV RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
ENV BACKEND_URL=http://nest-api:3000/api/weather/logsgs
CMD ["./worker"]
