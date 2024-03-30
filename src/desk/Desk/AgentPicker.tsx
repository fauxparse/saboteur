import { Group } from '@mantine/core';
import React from 'react';
import { Agent } from '@/types/Agent';
import { AgentName } from './AgentName';
import { useAgents } from '@/contexts/AgentsProvider';

type AgentPickerProps = {
  value: string[];
  exceptSaboteur?: boolean;
  onChange: (value: string[]) => void;
};

export const AgentPicker: React.FC<AgentPickerProps> = ({ value, exceptSaboteur, onChange }) => {
  const { agents, saboteur } = useAgents();

  const toggle = (agent: Agent) => {
    if (value.includes(agent.id)) {
      onChange(value.filter((id) => id !== agent.id));
    } else {
      onChange([...value, agent.id]);
    }
  };

  return (
    <Group gap="sm">
      {[...agents.values()].map(
        (agent) =>
          (!exceptSaboteur || agent.id !== saboteur?.id) && (
            <AgentName
              key={agent.id}
              agent={agent}
              variant={value.includes(agent.id) ? 'filled' : 'outline'}
              style={{ cursor: 'pointer' }}
              onClick={() => toggle(agent)}
            >
              {agent.name}
            </AgentName>
          )
      )}
    </Group>
  );
};
