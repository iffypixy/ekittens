import axios from "axios";

export const request = axios.create({
  baseURL: process.env.BACKEND_URL,
  withCredentials: true,
});

export interface HTTPD {
  error: string;
  message: string | string[];
  statusCode: number;
}
