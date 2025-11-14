/**
 * Parse an API response into a typed value, normalizing empty bodies and friendly errors.
 */
export async function parseApiResponse<T>(response: Response): Promise<T> {
  const hasBody = ![204, 205, 304].includes(response.status)
  const contentType = response.headers.get("content-type") ?? ""

  let rawBody: string | null = null
  if (hasBody) {
    try {
      rawBody = await response.text()
    } catch {
      rawBody = null
    }
  }

  let parsedBody: unknown = undefined
  if (rawBody && rawBody.length > 0) {
    if (contentType.includes("application/json")) {
      try {
        parsedBody = JSON.parse(rawBody)
      } catch {
        parsedBody = undefined
      }
    } else {
      parsedBody = rawBody
    }
  }

  if (!response.ok) {
    const errorMessage = extractErrorMessage(parsedBody) ?? (response.statusText || `Request failed (${response.status})`)
    throw new Error(errorMessage)
  }

  return (parsedBody as T) ?? (undefined as T)
}

function extractErrorMessage(payload: unknown): string | undefined {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload
  }

  if (typeof payload === "object" && payload !== null) {
    const maybeDetail = (payload as Record<string, unknown>).detail
    if (typeof maybeDetail === "string" && maybeDetail.trim().length > 0) {
      return maybeDetail
    }

    const maybeMessage = (payload as Record<string, unknown>).message
    if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
      return maybeMessage
    }
  }

  return undefined
}
