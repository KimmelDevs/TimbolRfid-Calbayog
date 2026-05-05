"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import mqtt, { MqttClient } from "mqtt";

const BROKER = "wss://broker.hivemq.com:8884/mqtt";

export type MqttStatus = "disconnected" | "connecting" | "connected" | "error";

interface UseMqttOptions {
  topic: string;
  onMessage: (payload: string) => void;
  enabled?: boolean;
}

export function useMqtt({ topic, onMessage, enabled = true }: UseMqttOptions) {
  const clientRef    = useRef<MqttClient | null>(null);
  const onMessageRef = useRef(onMessage);
  const [status, setStatus] = useState<MqttStatus>("disconnected");

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    setStatus("connecting");
    const clientId  = `web-${Math.random().toString(16).slice(2, 8)}`;
    const mqttClient = mqtt.connect(BROKER, {
      clientId,
      clean: true,
      reconnectPeriod: 3000,
    });

    clientRef.current = mqttClient;

    mqttClient.on("connect", () => {
      mqttClient.subscribe(topic, { qos: 1 });
      setStatus("connected");
    });

    mqttClient.on("message", (_topic: string, message: Buffer) => {
      onMessageRef.current(message.toString());
    });

    mqttClient.on("error", (err: Error) => {
      console.error("[mqtt] error:", err.message);
      setStatus("error");
    });

    mqttClient.on("offline",   () => setStatus("connecting"));
    mqttClient.on("reconnect", () => setStatus("connecting"));

    return () => {
      mqttClient.end(true);
      clientRef.current = null;
      setStatus("disconnected");
    };
  }, [enabled, topic, disconnect]);

  return { disconnect, status };
}
