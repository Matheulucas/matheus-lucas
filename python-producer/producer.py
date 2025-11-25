import os
import json
import time
import pika
import requests

RABBIT_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
QUEUE = os.getenv("RABBITMQ_QUEUE", "weather_logs")


CITY_LAT = "-15.61"  
CITY_LON = "-56.10"   

def connect_rabbit():
    """Conecta ao RabbitMQ com retry infinito."""
    params = pika.URLParameters(RABBIT_URL)

    while True:
        try:
            print("[producer] Connecting to RabbitMQ...")
            conn = pika.BlockingConnection(params)
            print("[producer] Connected successfully.")
            return conn
        except Exception as e:
            print(f"[producer] RabbitMQ not ready: {e}")
            time.sleep(3)


def fetch_weather_data():
    """Busca clima real da API Open-Meteo."""
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={CITY_LAT}&longitude={CITY_LON}&current_weather=true"
        print("[producer] Fetching weather data...")
        resp = requests.get(url, timeout=10)
        data = resp.json()

        current = data.get("current_weather", {})

        payload = {
            "timestamp": current.get("time"),
            "temperature": current.get("temperature"),
            "wind_kph": current.get("windspeed"),
            "wind_direction": current.get("winddirection"),
            "source": "python-producer"
        }

        print("[producer] Weather data collected:", payload)
        return payload

    except Exception as e:
        print("[producer] Error fetching weather:", e)
        return None


def publish_message(channel, msg):
    """Publica mensagem na fila."""
    channel.basic_publish(
        exchange="",
        routing_key=QUEUE,
        body=json.dumps(msg),
        properties=pika.BasicProperties(delivery_mode=2)
    )
    print("[producer] Message published:", msg)


def main_loop():
    """Loop infinito: coleta clima → envia → espera 1 hora."""
    while True:
        conn = connect_rabbit()
        ch = conn.channel()
        ch.queue_declare(queue=QUEUE, durable=True)

        weather = fetch_weather_data()
        if weather:
            publish_message(ch, weather)

        conn.close()

        print("[producer] Sleeping for 1 hour...\n")
        time.sleep(3600)  # 1 hora


if __name__ == "__main__":
    print("[producer] Starting periodic weather producer...")
    main_loop()
