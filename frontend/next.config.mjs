/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    /**
     * Turbopack's persistent dev cache is on by default in Next 16 and has now
     * gone inconsistent twice on this project: once as a `Cell … no longer
     * exists` HMR panic, and once by restoring an hour-old compilation on
     * startup and never recompiling — which showed up as newly added routes
     * 404ing while the same source built and served correctly.
     *
     * A cold `next dev` here starts in under a second, so the cache buys very
     * little and costs a debugging session each time it breaks. Turn it back on
     * if startup ever becomes slow enough to matter.
     */
    turbopackFileSystemCacheForDev: false,

    serverActions: {
      /**
       * Photos reach the backend through a Server Action, and the default cap
       * on an action's request body is 1MB — a phone camera clears that on
       * every shot.
       *
       * The ceiling above this one is not ours: a Vercel function refuses a
       * request body of roughly 4.5MB before it ever reaches the function, and
       * no setting here can lift that. So the number is chosen to sit *under*
       * the platform's, not over the backend's — raising it past 4.5 would only
       * move the failure somewhere we cannot put a message on.
       *
       * The upload is sized for it rather than fighting it:
       * `lib/compress-image.js` re-encodes the photo in the browser first, and
       * a 2400px WebP lands near 400KB. `MAX_PAYLOAD_BYTES` there refuses
       * anything over 3.5MB, so a file that could not be compressed is turned
       * away with a sentence to read, and this limit is the backstop behind it.
       *
       * Files are uploaded one per request — sending three at once would put
       * the total, not the largest, against this number.
       */
      bodySizeLimit: "4mb",
    },

    /**
     * The second body limit, and the one that actually bit.
     *
     * Because `proxy.js` exists, Next buffers every matching request's body in
     * memory so it can be read twice — once by the proxy, once by the route.
     * That buffer is capped separately from `bodySizeLimit`, at 10MB, and an
     * upload posts to `/weddings/{id}/sections/gallery`, which has no file
     * extension and so matches the proxy matcher.
     *
     * The failure is quiet in the worst way: an over-size body is *truncated*
     * rather than rejected, the request carries on with the first 10MB, and the
     * damage only surfaces further down as `Unexpected end of form` — the
     * multipart parser reaching the end of the stream mid-file. Nothing in that
     * error mentions a size limit.
     *
     * Kept equal to `bodySizeLimit` so there is one number to change, and low
     * for a second reason: this one is a buffer held in memory for the life of
     * the request, and the proxy runs with far less of it to spend than a route
     * handler does.
     *
     * Note the warning Next logs points at `middlewareClientMaxBodySize`, which
     * is the deprecated spelling — `config.js` renamed it and the message did
     * not follow.
     */
    proxyClientMaxBodySize: "4mb",
  },
  images: {
    /**
     * Photos in an invitation are Cloudinary `secure_url`s, and `next/image`
     * refuses any remote host that is not listed here.
     *
     * `images.domains` would be shorter but is deprecated in Next 16, and a
     * bare hostname allows any path on it; the pathname pattern keeps this to
     * the delivery endpoint.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        // The seeded starter templates use placehold.co thumbnails until real
        // artwork exists. Drop this once they have their own images.
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
