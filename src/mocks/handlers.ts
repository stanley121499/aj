import { http, HttpResponse } from "msw";
import { mockResults, mockUsers, mockAccountBalances, mockBakis } from "./resultData";

// Define types for request handlers
type RequestParams = Record<string, string>;

// Define your mock API endpoints here
export const handlers = [
  // Results endpoints
  http.get("*/rest/v1/results", () => {
    return HttpResponse.json(mockResults);
  }),

  http.post("*/rest/v1/results", () => {
    return HttpResponse.json(mockResults[0], { status: 201 });
  }),

  http.patch("*/rest/v1/results", () => {
    return HttpResponse.json(mockResults[0]);
  }),

  http.delete("*/rest/v1/results", () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // Users endpoints
  http.get("*/rest/v1/users", () => {
    return HttpResponse.json(mockUsers);
  }),

  // Account balances endpoints
  http.get("*/rest/v1/account_balances", () => {
    return HttpResponse.json(mockAccountBalances);
  }),

  // Baki endpoints
  http.get("*/rest/v1/bakis", () => {
    return HttpResponse.json(mockBakis);
  }),
]; 