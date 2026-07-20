import { describe, expect, it } from "vitest"
import { DEFAULT_VIDEO_URL, getVideoSrc } from "@/lib/video"

describe("getVideoSrc", () => {
  it("returns the env value when set", () => {
    expect(getVideoSrc("https://example.com/blob/video.abc123.mp4")).toBe(
      "https://example.com/blob/video.abc123.mp4"
    )
  })

  it("falls back to the default URL when the env value is undefined", () => {
    expect(getVideoSrc(undefined)).toBe(DEFAULT_VIDEO_URL)
  })

  it("falls back to the default URL when the env value is an empty string", () => {
    expect(getVideoSrc("")).toBe(DEFAULT_VIDEO_URL)
  })
})
