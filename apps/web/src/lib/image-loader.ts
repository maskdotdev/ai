// Docs: https://developers.cloudflare.com/images/transform-images

export type CloudflareLoaderParams = {
  src: string
  width: number
  quality?: number
}

export default function cloudflareLoader({
  src,
  width,
  quality = 75,
}: CloudflareLoaderParams) {
  const params = [`width=${width}`, `quality=${quality}`, 'format=auto']
  return `https://e35da6d7c60201d2204fae8bc2942069.r2.cloudflarestorage.com/maskdotdev/${params.join(',')}/${src}`
}
