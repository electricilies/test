import http from "k6/http";
import { sleep } from "k6";
import { Options } from "k6/options";

export const options: Options = {};

export default function () {
  const endpoint = process.env.FRONTEND_ENDPOINT;
  if (!endpoint) {
    throw new Error("FRONTEND_ENDPOINT environment variable is not set");
  }

  http.get(endpoint);
  sleep(1);
}
