import http from "k6/http";
import { Options } from "k6/options";

const endpoint = process.env.BACKEND_ENDPOINT;
if (!endpoint) {
  throw new Error("BACKEND_ENDPOINT environment variable is not set");
}
const api = `${endpoint}/api`;

export const options: Options = {
  scenarios: {
    list: {
      executor: "shared-iterations",
      vus: 50,
      maxDuration: "30s",
      exec: "list",
    },
    details: {
      executor: "shared-iterations",
      vus: 20,
      maxDuration: "30s",
      exec: "gets",
    },
  },
};

export function list() {
  http.get(`${api}/products`);
}

export function gets() {
  const productIds = [
    "00000000-0000-7000-0000-000278711036",
    "00000000-0000-7000-0000-000278630285",
    "00000000-0000-7000-0000-000278628812",
    "00000000-0000-7000-0000-000278620827",
    "00000000-0000-7000-0000-000278524463",
  ];
  for (const id of productIds) {
    http.get(`${api}/products/${id}`);
  }
}
