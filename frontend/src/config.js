// src/config.js

// ✅ manually toggle this when you switch environments
const isProduction = false;

// ✅ define your backend IPs
const LOCAL_IP = "http://localhost:3002";
const SERVER_IP = "http://82.29.179.227:8082"; // your hosted backend IP

// ✅ export whichever one you're using
export const BASE_URL = isProduction ? SERVER_IP : LOCAL_IP;
