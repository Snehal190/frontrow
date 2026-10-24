"use client";
// Artist photo with an offline fallback: if the remote image (Commons today,
// Spotify later) fails — say, flaky venue Wi-Fi mid-pitch — swap to the
// local duotone placeholder instead of showing a broken image.
import type { Ref } from "react";
import type { Artist } from "@/data/api";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  artist: Pick<Artist, "image" | "fallbackImage">;
  ref?: Ref<HTMLImageElement>;
};

export function ArtistImg({ artist, alt = "", ref, ...rest }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={artist.image}
      alt={alt}
      referrerPolicy="no-referrer"
      decoding="async"
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.endsWith(artist.fallbackImage)) img.src = artist.fallbackImage;
      }}
      {...rest}
    />
  );
}
