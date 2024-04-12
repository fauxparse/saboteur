import { useAgent } from '@/contexts/AgentProvider';
import { useMission } from '@/contexts/MissionProvider';
import { ActionIcon, AppShell, Center, Flex, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Quiz, parseEvent } from '@/types/Event';
import { Timestamp, collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { QuizProvider } from '@/contexts/QuizProvider';
import { TakeQuiz } from './TakeQuiz';

import classes from './Agent.module.css';

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
          where('startsAt', '<', Timestamp.now()),
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
        {agent.eliminatedAt ? (
          <Center h="full">You have been eliminated.</Center>
        ) : (
          quiz && (
            <QuizProvider quiz={quiz}>
              <TakeQuiz />
            </QuizProvider>
          )
        )}
      </AppShell.Main>
    </AppShell>
  );
};
