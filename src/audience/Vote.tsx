import { useAgents } from '@/contexts/AgentsProvider';
import { Button, Center, Flex, Stack, Text } from '@mantine/core';

type VoteProps = {
  quizId: string;
  onVote: (quizId: string, agentId: string) => void;
};

export const Vote: React.FC<VoteProps> = ({ quizId, onVote }) => {
  const { agents } = useAgents();

  return (
    <Center pos="fixed" inset={0}>
      <Stack align="center">
        <Text fz="xl">Who is the Saboteur?</Text>

        <Flex wrap="wrap" gap="md" justify="center">
          {agents.map((agent) => (
            <Button
              key={agent.id}
              disabled={!!agent.eliminatedAt}
              onClick={() => onVote(quizId, agent.id)}
            >
              {agent.name}
            </Button>
          ))}
        </Flex>
      </Stack>
    </Center>
  );
};
