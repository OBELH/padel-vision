const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // Ensure trailing slash to avoid 307 redirects from FastAPI
  const [basePath, query] = path.split("?")
  const normalizedPath = basePath.endsWith("/") ? basePath : basePath + "/"
  const fullPath = query ? `${normalizedPath}?${query}` : normalizedPath

  const res = await fetch(`${API_URL}${fullPath}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function apiUpload<T>(path: string, file: File): Promise<T> {
  const [basePath, query] = path.split("?")
  const normalizedPath = basePath.endsWith("/") ? basePath : basePath + "/"
  const fullPath = query ? `${normalizedPath}?${query}` : normalizedPath

  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_URL}${fullPath}`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    throw new Error(`Upload error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}
