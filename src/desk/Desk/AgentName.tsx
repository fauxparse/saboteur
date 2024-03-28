import { Agent } from '@/types/Agent';
import { Badge, BadgeProps } from '@mantine/core';

import classes from './Desk.module.css';

type AgentNameProps = BadgeProps & {
  agent: Agent;
  onClick?: (agent: Agent) => void;
};

export const AgentName: React.FC<AgentNameProps> = ({ agent, onClick, ...props }) => (
  <Badge
    component={onClick ? 'button' : 'div'}
    size="lg"
    variant="light"
    radius="sm"
    className={classes.agentName}
    color={agent.color}
    {...((onClick ? { onClick } : {}) as Partial<BadgeProps>)}
    {...props}
  >
    {agent.name}
  </Badge>
);
