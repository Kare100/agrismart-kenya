import { ENV } from '../../config/env';
import { ensureFreshSession, restHeaders } from './session';

const REST_URL = `${ENV.SUPABASE_URL}/rest/v1`;

export class Query {
  constructor(table) {
    this.table = table;
    this.qs = new URLSearchParams();
    this.method = 'GET';
    this.body = null;
    this.wantsSingle = false;
    this.wantsMaybe = false;
    this.prefer = [];
  }

  select(cols = '*') {
    this.qs.set('select', cols);
    if (this.method !== 'GET') this.prefer.push('return=representation');
    return this;
  }
  eq(col, val) {
    this.qs.append(col, `eq.${val}`);
    return this;
  }
  gte(col, val) {
    this.qs.append(col, `gte.${val}`);
    return this;
  }
  order(col, { ascending = true } = {}) {
    this.qs.set('order', `${col}.${ascending ? 'asc' : 'desc'}`);
    return this;
  }
  limit(n) {
    this.qs.set('limit', String(n));
    return this;
  }
  single() {
    this.wantsSingle = true;
    return this;
  }
  maybeSingle() {
    this.wantsMaybe = true;
    return this;
  }
  insert(obj) {
    this.method = 'POST';
    this.body = obj;
    this.prefer.push('return=representation');
    return this;
  }
  update(obj) {
    this.method = 'PATCH';
    this.body = obj;
    return this;
  }

  async _run() {
    await ensureFreshSession();
    const url = `${REST_URL}/${this.table}?${this.qs.toString()}`;
    try {
      const res = await fetch(url, {
        method: this.method,
        headers: restHeaders(this.prefer.length ? { Prefer: this.prefer.join(',') } : {}),
        body: this.body ? JSON.stringify(this.body) : undefined,
      });
      if (!res.ok) {
        const text = await res.text();
        return { data: null, error: { message: `${res.status}: ${text}` } };
      }
      if (res.status === 204) return { data: null, error: null };
      let data = await res.json();
      if (this.wantsSingle || this.wantsMaybe) {
        data = Array.isArray(data) ? data[0] ?? null : data;
      }
      return { data, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  }

  // Lets callers `await` a Query directly (or use .then), same ergonomics
  // as the real supabase-js client.
  then(resolve, reject) {
    return this._run().then(resolve, reject);
  }
}
