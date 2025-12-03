import http from "k6/http";
import { Options } from "k6/options";

const api = `${__ENV.BACKEND_ENDPOINT}/api`;

export const options: Options = {
  scenarios: {
    list: {
      executor: "ramping-vus",
      exec: "list",
      stages: [
        { duration: "10s", target: 20 },
        { duration: "10s", target: 50 },
        { duration: "90s", target: 100 },
        { duration: "10s", target: 5 },
      ],
    },
    details: {
      executor: "ramping-vus",
      exec: "gets",
      stages: [
        { duration: "10s", target: 20 },
        { duration: "100s", target: 50 },
        { duration: "10s", target: 5 },
      ],
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
