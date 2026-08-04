import { http, HttpResponse } from "msw";
import {
  createTestCustomer,
  createTestMenuItem,
  createTestOrder,
  createTestRestaurant,
} from "@/tests/fixtures";

const base = "http://localhost";

export const apiHandlers = [
  http.get(`${base}/api/health`, () =>
    HttpResponse.json({
      status: "healthy",
      ok: true,
      version: "0.1.0",
      environment: "development",
    })
  ),
  http.get(`${base}/api/restaurants/:id`, ({ params }) =>
    HttpResponse.json(
      createTestRestaurant({ id: String(params.id) })
    )
  ),
  http.get(`${base}/api/menu-items`, () =>
    HttpResponse.json({ items: [createTestMenuItem()] })
  ),
  http.get(`${base}/api/orders`, () =>
    HttpResponse.json({ items: [createTestOrder()] })
  ),
  http.get(`${base}/api/customers`, () =>
    HttpResponse.json({ items: [createTestCustomer()] })
  ),
];
