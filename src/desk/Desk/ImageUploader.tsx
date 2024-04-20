import { Box, BoxProps, rem } from '@mantine/core';
import { isString } from 'lodash-es';
import { ChangeEvent, useCallback, useRef } from 'react';
import Pica from 'pica';
import { IconPhoto } from '@tabler/icons-react';

const pica = new Pica();

type ImageUploaderProps = BoxProps & {
  url: string | null;
  onChange: (url: string | null) => void;
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  url,
  onChange,
  style = {},
  ...props
}) => {
  const imgRef = useRef<HTMLImageElement>(null);

  const fileChanged = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.currentTarget.files?.[0];
      if (file) {
        const fileReader = new FileReader();
        fileReader.addEventListener('load', () => {
          if (isString(fileReader.result)) {
            const srcImg = document.createElement('img');
            srcImg.addEventListener('load', () => {
              const w = srcImg.width;
              const h = srcImg.height;
              const srcCanvas = document.createElement('canvas');
              srcCanvas.width = srcCanvas.height = Math.min(w, h);
              const context = srcCanvas.getContext('2d');
              context?.drawImage(srcImg, (srcCanvas.width - w) / 2, (srcCanvas.height - h) / 2);
              const destCanvas = document.createElement('canvas');
              destCanvas.width = destCanvas.height = 400;
              pica.resize(srcCanvas, destCanvas).then(() => {
                const url = destCanvas.toDataURL('img/jpeg');
                if (imgRef.current) imgRef.current.src = url;
                onChange(url);
              });
            });
            srcImg.src = fileReader.result;
          }
        });
        fileReader.readAsDataURL(file);
      }
    },
    [onChange]
  );

  return (
    <Box
      pos="relative"
      style={{
        display: 'grid',
        placeContent: 'center',
        backgroundColor: 'var(--mantine-color-dark-6)',
        aspectRatio: '1',
        overflow: 'hidden',
        borderRadius: '0.25rem',
        boxShadow: `inset 0 0 0 ${rem('1px')} var(--mantine-color-dark-4)`,
        ...style,
      }}
      {...props}
    >
      <IconPhoto />
      <img
        ref={imgRef}
        src={url ?? undefined}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          background: 'transparent',
          opacity: url ? 1 : 0,
        }}
      />
      <input
        type="file"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
        }}
        onChange={fileChanged}
      />
    </Box>
  );
};
