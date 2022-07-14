import axios from "axios";

export const request = axios.create({
  baseURL: process.env.BACKEND_URL,
  withCredentials: true,
});
