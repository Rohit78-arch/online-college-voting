function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:5000/api/v1"
}

/**
 * If API base is http://host:port/api/v1, derive origin as http://host:port
 */
export function getBackendOrigin() {
  const apiBase = getApiBaseUrl()
  return apiBase.replace(/\/api\/v1\/?$/, "")
}

export function toAssetUrl(maybeUrl?: string) {
  if (!maybeUrl) return undefined

  // Already absolute
  if (maybeUrl.startsWith("http://") || maybeUrl.startsWith("https://")) return maybeUrl

  // Backend serves uploads from /uploads/*
  if (maybeUrl.startsWith("/uploads/")) {
    return `${getBackendOrigin()}${maybeUrl}`
  }

  // If someone stored uploads/... without leading slash
  if (maybeUrl.startsWith("uploads/")) {
    return `${getBackendOrigin()}/${maybeUrl}`
  }

  // Unknown path: return as-is
  return maybeUrl
}

export function initials(name?: string) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  const first = parts[0]?.[0] || ""
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : ""
  return (first + last).toUpperCase() || "?"
}
