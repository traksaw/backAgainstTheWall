import { describe, expect, it } from "vitest"
import { buildVersionedFilename, hashBuffer, selectBlobsToDelete } from "./video-versioning.mjs"

describe("hashBuffer", () => {
  it("is deterministic for the same content", () => {
    const buffer = Buffer.from("same content")
    expect(hashBuffer(buffer)).toBe(hashBuffer(buffer))
  })

  it("differs for different content", () => {
    expect(hashBuffer(Buffer.from("content a"))).not.toBe(hashBuffer(Buffer.from("content b")))
  })

  it("returns a 16-character hex string by default", () => {
    expect(hashBuffer(Buffer.from("content"))).toMatch(/^[0-9a-f]{16}$/)
  })
})

describe("buildVersionedFilename", () => {
  it("inserts the hash before the extension", () => {
    expect(buildVersionedFilename("Ambitious_compatible.mp4", "abc1234567")).toBe(
      "Ambitious_compatible.abc1234567.mp4"
    )
  })
})

describe("selectBlobsToDelete", () => {
  const baseFilename = "Ambitious_compatible.mp4"

  it("selects versioned blobs matching the base filename, excluding the kept URL", () => {
    const blobs = [
      { url: "https://blob/Ambitious_compatible.aaa1111111.mp4", pathname: "Ambitious_compatible.aaa1111111.mp4" },
      { url: "https://blob/Ambitious_compatible.bbb2222222.mp4", pathname: "Ambitious_compatible.bbb2222222.mp4" },
    ]

    const result = selectBlobsToDelete(blobs, "https://blob/Ambitious_compatible.bbb2222222.mp4", baseFilename)

    expect(result).toEqual([blobs[0]])
  })

  it("also matches the pre-versioning bare filename", () => {
    const blobs = [{ url: "https://blob/Ambitious_compatible.mp4", pathname: "Ambitious_compatible.mp4" }]

    const result = selectBlobsToDelete(blobs, "https://blob/Ambitious_compatible.ccc3333333.mp4", baseFilename)

    expect(result).toEqual(blobs)
  })

  it("ignores blobs unrelated to this video", () => {
    const blobs = [{ url: "https://blob/some-other-file.pdf", pathname: "some-other-file.pdf" }]

    const result = selectBlobsToDelete(blobs, "https://blob/Ambitious_compatible.ccc3333333.mp4", baseFilename)

    expect(result).toEqual([])
  })

  it("returns nothing to delete when only the kept version exists", () => {
    const blobs = [{ url: "https://blob/Ambitious_compatible.ccc3333333.mp4", pathname: "Ambitious_compatible.ccc3333333.mp4" }]

    const result = selectBlobsToDelete(blobs, "https://blob/Ambitious_compatible.ccc3333333.mp4", baseFilename)

    expect(result).toEqual([])
  })
})
