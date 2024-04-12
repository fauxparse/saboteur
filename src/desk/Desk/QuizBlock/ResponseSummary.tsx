import { IconMessageCircle } from '@tabler/icons-react';
import { Milestone } from '../Milestone';
import { useQuiz } from '@/contexts/QuizProvider';
import { useAgents } from '@/contexts/AgentsProvider';
import { Box, Progress, Text } from '@mantine/core';
import { Agent } from '@/types/Agent';
import { AgentName } from '../AgentName';
import { Score, useScoring } from './useScoring';
import { addSeconds, intervalToDuration } from 'date-fns';

export const ResponseSummary = () => {
  const { quiz } = useQuiz();
  const { agents } = useAgents();

  const scores = useScoring();

  return (
    quiz.startsAt && (
      <Milestone icon={<IconMessageCircle />} time={quiz.startsAt}>
        <Box
          display="grid"
          my="0.375rem"
          style={{ gridTemplateColumns: 'auto 1fr auto auto', rowGap: '0.5rem', columnGap: '1rem' }}
        >
          {agents.map((agent) => (
            <ResponseRow key={agent.id} agent={agent} score={scores[agent.id]} />
          ))}
        </Box>
      </Milestone>
    )
  );
};

const ResponseRow: React.FC<{ agent: Agent; score: Score | null }> = ({ agent, score }) => {
  return (
    <Box
      display="grid"
      style={{ gridColumn: '1 / -1', gridTemplateColumns: 'subgrid', alignItems: 'center' }}
    >
      <AgentName agent={agent} style={{ justifySelf: 'end' }} />
      <Progress color={agent.color} value={50} />
      {score ? (
        <>
          <Text>
            {score.points} {score.points !== 1 ? 'points' : 'point'}
          </Text>
          <Text>{formatTimeTaken(score.time)}</Text>
        </>
      ) : (
        <>
          <Text style={{ justifySelf: 'center' }}>⋯</Text>
          <Text style={{ justifySelf: 'center' }}>⋯</Text>
        </>
      )}
    </Box>
  );
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatTimeTaken = (time: number) => {
  const start = new Date();
  const end = addSeconds(start, time);
  const duration = intervalToDuration({ start, end });
  console.log(duration);
  return `${pad2(duration.minutes ?? 0)}:${pad2(duration.seconds ?? 0)}`;
};
