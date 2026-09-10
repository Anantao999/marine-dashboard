import { API_VERSION, DEFAULT_API_CONTEXT, normalizeApiEnvelope } from "./contracts";
import { AUTH_FORBIDDEN_EVENT, clearAuthSession, getAuthToken } from "./authSession";

const trimSlashes = (value) => String(value || "").replace(/^\/+|\/+$/g, "");
const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ""));

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `/api/${API_VERSION}`;

export const buildApiPath = (template, params = {}) => {
  const context = { ...DEFAULT_API_CONTEXT, ...params };
  return template.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(context[key] ?? ""));
};

export const buildApiUrl = (path, query = {}) => {
  const cleanPath = trimSlashes(path);
  const url = isAbsoluteUrl(API_BASE_URL)
    ? new URL(`${API_BASE_URL.replace(/\/+$/g, "")}/${cleanPath}`)
    : new URL(`/${trimSlashes(API_BASE_URL)}/${cleanPath}`, window.location.origin);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

export const apiRequest = async (path, options = {}) => {
  const { query, signal, headers, skipAuth = false, ...fetchOptions } = options;
  const body =
    fetchOptions.body && typeof fetchOptions.body !== "string"
      ? JSON.stringify(fetchOptions.body)
      : fetchOptions.body;
  const token = skipAuth ? "" : getAuthToken();
  const requestUrl = buildApiUrl(path, query);
  const response = await fetch(requestUrl, {
    ...fetchOptions,
    body,
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (parseError) {
    const trimmedText = text.trim();
    const error = new Error(
      trimmedText.includes("Proxy error")
        ? "后端服务未启动或无法连接。请确认后端已运行在 127.0.0.1:8080。"
        : trimmedText.startsWith("<")
        ? "后端接口没有返回 JSON。请确认后端服务已启动，并且 /api/v1 已代理到后端。"
        : "后端响应不是合法 JSON。"
    );
    error.status = response.status;
    error.responseText = text;
    error.url = requestUrl;
    throw error;
  }
  const envelope = normalizeApiEnvelope(payload);

  const businessFailed = envelope.code !== undefined && envelope.code !== 0 && envelope.code !== "OK";
  if (!response.ok || envelope.success === false || businessFailed) {
    if (response.status === 401) {
      clearAuthSession("unauthorized");
    }
    if (response.status === 403 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(AUTH_FORBIDDEN_EVENT));
    }
    const error = new Error(envelope.message || `Request failed: ${response.status}`);
    error.status = response.status;
    error.payload = envelope;
    throw error;
  }

  return envelope;
};
