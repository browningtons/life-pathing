// Minimal VercelRequest / VercelResponse stand-ins for the route tests.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface FakeRes {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

export function fakeReq(init: {
  method?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
}): VercelRequest {
  return {
    method: init.method ?? 'GET',
    query: init.query ?? {},
    headers: init.headers ?? {},
    body: init.body,
  } as unknown as VercelRequest;
}

export function fakeRes(): { res: VercelResponse; out: FakeRes } {
  const out: FakeRes = { statusCode: 200, body: undefined, headers: {} };
  const res = {
    status(code: number) {
      out.statusCode = code;
      return res;
    },
    json(body: unknown) {
      out.body = body;
      return res;
    },
    setHeader(name: string, value: string) {
      out.headers[name.toLowerCase()] = value;
      return res;
    },
  };
  return { res: res as unknown as VercelResponse, out };
}
