import { BoxProps, Center } from '@mantine/core';
import { Variants, motion } from 'framer-motion';
import { PropsWithChildren, forwardRef } from 'react';

const variants: Variants = {
  out: {
    opacity: 0,
    scale: 0,
  },
  in: {
    opacity: 1,
    scale: 1,
  },
} as const;

export const Page = forwardRef<HTMLDivElement, PropsWithChildren<BoxProps>>(
  ({ children, ...props }, ref) => (
    <Center
      h="full"
      component={motion.div}
      ref={ref}
      variants={variants}
      initial="out"
      animate="in"
      exit="out"
      {...props}
    >
      {children}
    </Center>
  )
);
