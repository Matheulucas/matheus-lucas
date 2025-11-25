package main

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)


type WeatherPayload struct {
	Timestamp         string  `json:"timestamp"`
	Temperature       float64 `json:"temperature"`
	Humidity          float64 `json:"humidity"`
	WindSpeed         float64 `json:"wind_speed"`
	Condition         string  `json:"condition"`
	Location          string  `json:"location,omitempty"`
	ProbabilityOfRain *float64 `json:"probability_of_rain,omitempty"`
}

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}

func main() {
	
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@rabbitmq:5672/"
	}

	apiURL := os.Getenv("BACKEND_URL")
	if apiURL == "" {
		apiURL = "http://backend:3000/api/weather/logs"
	}

	
	conn, err := amqp.Dial(rabbitURL)
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	queueName := "weather_logs"
	
	_, err = ch.QueueDeclare(
		queueName,
		true,  
		false, 
		false, 
		false, 
		nil,   
	)
	failOnError(err, "Failed to declare queue")

	
	err = ch.Qos(1, 0, false)
	failOnError(err, "Failed to set QoS")

	msgs, err := ch.Consume(
		queueName,
		"",    
		false, 
		false, 
		false, 
		false,
		nil,   
	)
	failOnError(err, "Failed to register a consumer")

	forever := make(chan bool)

	log.Println(" [*] Waiting for messages. To exit press CTRL+C")
	go func() {
		for d := range msgs {
			log.Printf("Received a message: %s", d.Body)

			
			var payload WeatherPayload
			if err := json.Unmarshal(d.Body, &payload); err != nil {
				log.Printf("Invalid JSON payload: %v. Nacking (requeue=false)", err)
				
				d.Nack(false, false)
				continue
			}

			
			jsonBytes, _ := json.Marshal(payload)
			req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonBytes))
			if err != nil {
				log.Printf("Failed to create request: %v. Nacking (requeue=true)", err)
				d.Nack(false, true)
				continue
			}
			req.Header.Set("Content-Type", "application/json")

			client := &http.Client{Timeout: 10 * time.Second}
			resp, err := client.Do(req)
			if err != nil {
				log.Printf("HTTP request failed: %v. Nacking (requeue=true)", err)
				d.Nack(false, true)
				continue
			}

			body, _ := ioutil.ReadAll(resp.Body)
			resp.Body.Close()

			if resp.StatusCode >= 200 && resp.StatusCode < 300 {
				log.Printf("Successfully posted to backend: %s", string(body))
				d.Ack(false)
			} else {
				log.Printf("Backend returned status %d: %s. Nacking (requeue=true)", resp.StatusCode, string(body))
				
				d.Nack(false, true)
			}
		}
	}()

	<-forever
}
