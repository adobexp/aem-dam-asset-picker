import { FC, useEffect, useRef, useState } from "react";

import classNames from "classnames";

import { toBrowserUrl } from "../../utils/imageUrl";
import { isVideoAsset } from "../../utils/isVideoAsset";
import { AssetImage } from "../AssetImage/AssetImage";

import styles from "./VideoHoverThumbnail.module.scss";

export type VideoHoverThumbnailProps = {
  thumbnailUrl?: string | null;
  /** Streamable original asset path (DAM binary). */
  videoSrc?: string | null;
  alt: string;
  name?: string;
  mime?: string;
  className?: string;
  /** Class applied to both the poster image and the hover video. */
  mediaClassName?: string;
  /**
   * When set, hover is controlled by the parent (use when overlays sit above
   * the thumbnail and would otherwise block mouseenter on this root).
   */
  externalHovering?: boolean;
};

/**
 * Card thumbnail that, for video assets, plays a muted preview on hover
 * inside the thumbnail box and restores the poster when the pointer leaves.
 */
export const VideoHoverThumbnail: FC<VideoHoverThumbnailProps> = ({
  thumbnailUrl,
  videoSrc,
  alt,
  name,
  mime,
  className,
  mediaClassName,
  externalHovering,
}) => {
  const isVideo = isVideoAsset(name || videoSrc, mime);
  const streamUrl = toBrowserUrl(videoSrc);
  const [internalHovering, setInternalHovering] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hovering = externalHovering ?? internalHovering;
  const managedByParent = externalHovering !== undefined;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (hovering) {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise) {
        void playPromise.catch(() => {
          /* Autoplay may be blocked; keep poster visible. */
        });
      }
    } else {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        /* ignore seek errors on unloaded media */
      }
      setCanPlay(false);
    }
  }, [hovering]);

  if (!isVideo || !streamUrl) {
    return (
      <AssetImage
        src={thumbnailUrl}
        fallbackSrc={videoSrc}
        alt={alt}
        name={name}
        mime={mime}
        className={classNames(mediaClassName, className)}
        draggable={false}
      />
    );
  }

  return (
    <div
      className={classNames(styles.wrap, className)}
      onMouseEnter={managedByParent ? undefined : () => setInternalHovering(true)}
      onMouseLeave={managedByParent ? undefined : () => setInternalHovering(false)}
    >
      <AssetImage
        src={thumbnailUrl}
        fallbackSrc={videoSrc}
        alt={alt}
        name={name}
        mime={mime}
        className={classNames(styles.media, mediaClassName, hovering && canPlay && styles.posterHidden)}
        draggable={false}
      />
      {hovering && (
        <video
          ref={videoRef}
          className={classNames(styles.media, styles.video, mediaClassName)}
          src={streamUrl}
          poster={toBrowserUrl(thumbnailUrl)}
          muted
          playsInline
          loop
          preload="metadata"
          disablePictureInPicture
          controls={false}
          onLoadedData={() => setCanPlay(true)}
          onPlaying={() => setCanPlay(true)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
