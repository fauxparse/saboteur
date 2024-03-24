import { AgentProvider } from '@/contexts/AgentProvider';
import { useMission } from '@/contexts/MissionProvider';
import { db } from '@/firebase';
import { parseAgent } from '@/hooks/useAgents';
import { Agent } from '@/types';
import { Button, Card, Center, Stack, Title } from '@mantine/core';
import { Outlet } from '@tanstack/react-router';
import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const AgentSelector: React.FC = () => {
  const { mission } = useMission();

  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'missions', mission.id, 'agents'), (snapshot) => {
      setAgents(snapshot.docs.map(parseAgent));
    });

    return unsubscribe;
  }, [mission.id]);

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  const agent = useMemo(() => agents.find((a) => a.userId === user?.uid) ?? null, [agents, user]);

  const signIn = useCallback(
    async (agent: Agent) => {
      await updateDoc(doc(db, 'missions', mission.id, 'agents', agent.id), { userId: user?.uid });
    },
    [mission, user]
  );

  if (agent) {
    return (
      <AgentProvider agent={agent}>
        <Outlet />
      </AgentProvider>
    );
  }

  return (
    <Center style={{ minHeight: '100svh', flexDirection: 'column' }}>
      <Card>
        <Card.Section withBorder p="md">
          <Title order={5} ff="mono" fw={500}>
            {mission.id}
          </Title>
          <Title>Identify yourself</Title>
        </Card.Section>
        <Card.Section p="md">
          <Stack align="stretch">
            {agents.map((agent) => (
              <Button size="lg" onClick={() => signIn(agent)}>
                {agent.name}
              </Button>
            ))}
          </Stack>
        </Card.Section>
      </Card>
    </Center>
  );
};
