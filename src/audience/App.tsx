import { useEffect, useState } from 'react';
import {
  Timestamp,
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Mission } from '@/types';
import { parseMission } from '@/hooks/useMissions';
import { useVoting } from './useVoting';
import { Box, Image, MantineProvider, createTheme } from '@mantine/core';
import redPaper from '../assets/images/redpaper.webp';
import title from '../assets/images/title.webp';
import kirsty from '../assets/images/kirsty.webp';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { AgentsProvider } from '@/contexts/AgentsProvider';
import { MissionProvider } from '@/contexts/MissionProvider';
import { Vote } from './Vote';

const theme = createTheme({
  primaryColor: 'red',
  fontFamily: 'Cooper, sans-serif',
});

export const App: React.FC = () => {
  const [mission, setMission] = useState<Mission | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  const { canVoteIn, voteFor } = useVoting();

  useEffect(
    () =>
      onSnapshot(
        query(
          collectionGroup(db, 'events'),
          where('type', '==', 'quiz'),
          where('startsAt', '!=', null),
          where('startsAt', '<', Timestamp.now()),
          where('endsAt', '==', null)
        ),
        async (snapshot) => {
          const missionId = snapshot.docs[0]?.ref?.parent?.parent?.id;

          if (!missionId) {
            setQuizId(null);
            setMission(null);
            return;
          }

          const missionDoc = await getDoc(doc(db, 'missions', missionId));
          setMission(parseMission(missionDoc));
          setQuizId(snapshot.docs[0].id);
        }
      ),
    []
  );

  const [b, setB] = useState(false);

  const voting = b && mission && quizId && canVoteIn(quizId);

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Box
        pos="fixed"
        inset={0}
        display="grid"
        style={{
          background: `#81202D url(${redPaper}) 0 0 / cover`,
          justifyItems: 'center',
          overflow: 'hidden',
          fontFamily: 'var(--mantine-font-family)',
        }}
        onClick={() => setB((x) => !x)}
      >
        <MotionConfig>
          <AnimatePresence>
            {voting ? (
              <motion.div
                key="quiz"
                style={{ width: '90vw', maxWidth: '30rem', gridArea: '1 / 1', alignSelf: 'center' }}
                variants={{
                  out: { scale: 0, opacity: 0 },
                  in: { scale: 1, opacity: 1 },
                }}
                initial="out"
                animate="in"
                exit="out"
              >
                <MissionProvider mission={mission}>
                  <AgentsProvider>
                    <Vote quizId={quizId} onVote={voteFor} />
                  </AgentsProvider>
                </MissionProvider>
              </motion.div>
            ) : (
              <>
                <Image
                  key="title"
                  component={motion.img}
                  src={title}
                  alt="The Saboteur"
                  w="90vw"
                  maw="30rem"
                  my="xl"
                  style={{ display: 'block', gridArea: '1 / 1', alignSelf: 'center' }}
                  variants={{
                    out: {
                      y: '-100vh',
                    },
                    in: {
                      y: '-20vh',
                    },
                  }}
                  initial="out"
                  animate="in"
                  exit="out"
                />
                <Image
                  key="kirsty"
                  component={motion.img}
                  src={kirsty}
                  alt=""
                  w="90vw"
                  maw="30rem"
                  style={{ display: 'block', gridArea: '1 / 1', alignSelf: 'end' }}
                  variants={{
                    out: {
                      y: '150%',
                    },
                    in: {
                      y: 0,
                    },
                  }}
                  initial="out"
                  animate="in"
                  exit="out"
                />
              </>
            )}
          </AnimatePresence>
        </MotionConfig>
      </Box>
    </MantineProvider>
  );
};
