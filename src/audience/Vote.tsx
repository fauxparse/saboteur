import { useAgents } from '@/contexts/AgentsProvider';
import { Button, Flex, Image, Stack, Text } from '@mantine/core';
import classes from './audience.module.css';

type VoteProps = {
  quizId: string;
  onVote: (quizId: string, agentId: string) => void;
};

export const Vote: React.FC<VoteProps> = ({ quizId, onVote }) => {
  const { agents } = useAgents();

  return (
    <Stack align="center">
      <Text fz="1.75rem" fw="bold" c="white">
        Who is the Saboteur?
      </Text>

      <Flex wrap="wrap" gap="md" w="100%" justify="center">
        {agents.map((agent) => (
          <Button
            className={classes.voteButton}
            key={agent.id}
            pos="relative"
            p={0}
            style={{ aspectRatio: 1 }}
            disabled={!!agent.eliminatedAt}
            onClick={() => onVote(quizId, agent.id)}
          >
            {agent.image && <Image src={agent.image} pos="absolute" inset={0} />}
            <Text fz="lg" pos="absolute" bottom={0} left={0} right={0} bg="rgba(0, 0, 0, 0.5)">
              {agent.name}
            </Text>
          </Button>
        ))}
      </Flex>
    </Stack>
  );
};
