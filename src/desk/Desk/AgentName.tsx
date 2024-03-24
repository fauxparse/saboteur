import { Agent } from '@/types/Agent';
import { Badge, BadgeProps } from '@mantine/core';

import classes from './Desk.module.css';

type AgentNameProps = BadgeProps & {
  agent: Agent;
};

export const AgentName: React.FC<AgentNameProps> = ({ agent, ...props }) => (
  <Badge
    size="lg"
    variant="light"
    radius="sm"
    className={classes.agentName}
    color={agent.color}
    {...props}
  >
    {agent.name}
  </Badge>
);
