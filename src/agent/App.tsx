import { useAgent } from '@/contexts/AgentProvider';
import { useMission } from '@/contexts/MissionProvider';
import { ActionIcon, AppShell, Flex, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Quiz, parseEvent } from '@/types/Event';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { TakeQuiz } from './TakeQuiz';

import classes from './Agent.module.css';
import { AnimatePresence } from 'framer-motion';
import { Page } from './Page';

export const App: React.FC = () => {
  const { mission } = useMission();

  const { agent, signOut } = useAgent();

  const [quiz, setQuiz] = useState<Quiz | null>(null);

  useEffect(
    () =>
      onSnapshot(
        query(
          collection(db, 'missions', mission.id, 'events'),
          where('type', '==', 'quiz'),
          where('startsAt', '!=', null),
          where('endsAt', '==', null)
        ),
        (snapshot) => {
          if (snapshot.empty) {
            setQuiz(null);
            return;
          }

          const quiz = parseEvent(snapshot.docs[0]) as Quiz;
          setQuiz(quiz);
        }
      ),
    [mission.id]
  );

  return (
    <AppShell layout="alt" header={{ height: 72 }}>
      <AppShell.Header className={classes.header} p="md">
        <Flex align="center" gap="sm">
          <ActionIcon variant="transparent" aria-label="Back" onClick={signOut}>
            <IconArrowLeft />
          </ActionIcon>
          <Title order={1} size="h4">
            {mission.id}
          </Title>
        </Flex>
        <Flex align="center" gap="sm">
          <Title order={2} size="h4">
            {agent.name}
          </Title>
        </Flex>
      </AppShell.Header>
      <AppShell.Main style={{ display: 'grid' }}>
        <AnimatePresence mode="popLayout">
          {agent.eliminatedAt ? (
            <Page key="eliminated">
              <Text fz="xl">You have been eliminated.</Text>
            </Page>
          ) : quiz ? (
            <Page key="quiz">
              <TakeQuiz quiz={quiz} />
            </Page>
          ) : (
            <Page key="wait">
              <Text fz="xl">Await further instructions</Text>
            </Page>
          )}
        </AnimatePresence>
      </AppShell.Main>
    </AppShell>
  );
};
