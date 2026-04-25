/**
 * Convert a Web File / Blob to a Uint8Array<ArrayBuffer>.
 *
 * TypeScript 5+ types `Uint8Array` as `Uint8Array<ArrayBufferLike>`, which
 * Prisma rejects because `Bytes` requires `Uint8Array<ArrayBuffer>`. We copy
 * the data into a fresh `ArrayBuffer` so the type is correct.
 */
export async function fileToBytes(
  file: Blob
): Promise<Uint8Array<ArrayBuffer>> {
  const ab = await file.arrayBuffer();
  const fresh = new ArrayBuffer(ab.byteLength);
  const out = new Uint8Array(fresh);
  out.set(new Uint8Array(ab));
  return out;
}

/**
 * Coerce raw `Bytes` from Prisma to `Uint8Array<ArrayBuffer>` so it can be
 * passed to a Web `Response`.
 */
export function toResponseBytes(
  data: Uint8Array | Buffer
): Uint8Array<ArrayBuffer> {
  // If the underlying buffer is already a plain ArrayBuffer we can reuse it.
  const ab = data.buffer;
  if (ab instanceof ArrayBuffer) {
    return new Uint8Array(ab, data.byteOffset, data.byteLength);
  }
  const fresh = new ArrayBuffer(data.byteLength);
  new Uint8Array(fresh).set(data);
  return new Uint8Array(fresh);
}
