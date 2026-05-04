"use client";
import { useEffect, useRef, useCallback } from "react";
import mqtt, { MqttClient } from "mqtt";

const BROKER = "wss://broker.hivemq.com:8884/mqtt";

interface UseMqttOptions {
  topic: string;
  onMessage: (payload: string) => void;
  enabled?: boolean; // connect only when true — avoids always-on connections
}

export function useMqtt({ topic, onMessage, enabled = true }: UseMqttOptions) {
  const clientRef = useRef<MqttClient | null>(null);
  // Keep onMessage stable so the effect doesn't re-run when it changes
  const onMessageRef = useRef(onMessage);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    const clientId = `web-${Math.random().toString(16).slice(2, 8)}`;
    const mqttClient = mqtt.connect(BROKER, {
      clientId,
      clean: true,
      reconnectPeriod: 3000,
    });

    clientRef.current = mqttClient;

    mqttClient.on("connect", () => {
      mqttClient.subscribe(topic, { qos: 1 });
    });

    mqttClient.on("message", (_topic: string, message: Buffer) => {
      onMessageRef.current(message.toString());
    });

    mqttClient.on("error", (err: Error) => {
      console.error("[mqtt] error:", err.message);
    });

    return () => {
      mqttClient.end(true);
      clientRef.current = null;
    };
  }, [enabled, topic, disconnect]);

  return { disconnect };
}