import { QuestionProvider } from '@/contexts/QuestionProvider';
import { useResponse } from '@/contexts/ResponseProvider';
import { Box, Button, Stack, Text } from '@mantine/core';
import { AnimatePresence, MotionConfig, Variants, motion } from 'framer-motion';
import { PropsWithChildren, forwardRef, useCallback, useState } from 'react';
import { AskQuestion } from './AskQuestion';

const variants: Variants = {
  initial: { opacity: 0, x: '100vw' },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: '-100vw' },
};

export const Questions: React.FC = () => {
  const { response, currentQuestion, start, finish } = useResponse();

  const [loading, setLoading] = useState(false);

  const startQuiz = useCallback(async () => {
    setLoading(true);
    await start();
    setLoading(false);
  }, [start]);

  const finishQuiz = useCallback(async () => {
    setLoading(true);
    await finish();
    setLoading(false);
  }, [finish]);

  return (
    <Box flex={1} display="grid" style={{ placeContent: 'center', overflow: 'hidden' }}>
      <MotionConfig transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}>
        <AnimatePresence initial={false} mode="popLayout">
          {response.startsAt ? (
            currentQuestion ? (
              <Page key={currentQuestion.id}>
                <QuestionProvider question={currentQuestion}>
                  <AskQuestion />
                </QuestionProvider>
              </Page>
            ) : response.endsAt ? null : (
              <Page key="end">
                <Stack>
                  <Text fz="xl">
                    Thanks for your answers. Click the button below to finish the quiz, and then put
                    your device away.
                  </Text>
                  <Button size="xl" variant="outline" loading={loading} onClick={finishQuiz}>
                    Finished
                  </Button>
                </Stack>
              </Page>
            )
          ) : (
            <Page key="start">
              <Stack>
                <Text fz="xl">
                  <b>Quiz time!</b> You will now be asked a series of questions to determine how
                  much you know about the identity of The Saboteur.
                </Text>
                <Button size="xl" variant="outline" loading={loading} onClick={startQuiz}>
                  Start quiz
                </Button>
              </Stack>
            </Page>
          )}
        </AnimatePresence>
      </MotionConfig>
    </Box>
  );
};

const Page = forwardRef<HTMLDivElement, PropsWithChildren>(({ children }, ref) => (
  <Box
    ref={ref}
    component={motion.div}
    maw="100%"
    w="30rem"
    p="md"
    ta="center"
    display="grid"
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ gridArea: '1 / 1' }}
  >
    {children}
  </Box>
));
