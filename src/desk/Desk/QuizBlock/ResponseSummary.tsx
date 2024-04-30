import { IconMessageCircle } from '@tabler/icons-react';
import { Milestone } from '../Milestone';
import { useQuiz } from '@/contexts/QuizProvider';
import { useAgents } from '@/contexts/AgentsProvider';
import { Box, Progress, Text } from '@mantine/core';
import { Agent } from '@/types/Agent';
import { AgentName } from '../AgentName';
import { Score, useScoring } from './useScoring';
import { addSeconds, intervalToDuration } from 'date-fns';
import { useVoting } from './useVoting';
import { orderBy, sum, values } from 'lodash-es';
import { forwardRef, useMemo } from 'react';

export const ResponseSummary = () => {
  const { quiz } = useQuiz();
  const { agents } = useAgents();

  const scores = useScoring();
  const votes = useVoting();

  const totalVotes = sum(values(votes));

  const sorted = useMemo(
    () => orderBy(agents, [(agent) => scores[agent.id]?.points ?? -Infinity], ['desc']),
    [agents, scores]
  );

  return (
    quiz.startsAt && (
      <Milestone icon={<IconMessageCircle />} time={quiz.startsAt}>
        <Box
          display="grid"
          my="0.375rem"
          style={{ gridTemplateColumns: 'auto 1fr auto auto', rowGap: '0.5rem', columnGap: '1rem' }}
        >
          {sorted.map((agent) => (
            <ResponseRow
              key={agent.id}
              agent={agent}
              score={scores[agent.id]}
              votes={votes[agent.id] ?? 0}
              total={totalVotes}
            />
          ))}
        </Box>
      </Milestone>
    )
  );
};

type ResponseRowProps = {
  agent: Agent;
  score: Score | null;
  votes: number;
  total: number;
};

const ResponseRow = forwardRef<HTMLDivElement, ResponseRowProps>(
  ({ agent, score, votes, total }, ref) => {
    const percentage = total ? (votes / total) * 100.0 : 0;
    return (
      <Box
        ref={ref}
        display="grid"
        style={{ gridColumn: '1 / -1', gridTemplateColumns: 'subgrid', alignItems: 'stretch' }}
      >
        <AgentName agent={agent} style={{ justifySelf: 'end' }} />
        <Progress.Root size="2xl" transitionDuration={200}>
          <Progress.Section
            value={percentage}
            color={agent.color}
            style={{ justifyContent: 'start' }}
          >
            <Progress.Label fw={500} px="sm">{`${votes} (${Math.round(
              percentage
            )}%)`}</Progress.Label>
          </Progress.Section>
        </Progress.Root>
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
  }
);

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatTimeTaken = (time: number) => {
  const start = new Date();
  const end = addSeconds(start, time);
  const duration = intervalToDuration({ start, end });
  return `${pad2(duration.minutes ?? 0)}:${pad2(duration.seconds ?? 0)}`;
};
