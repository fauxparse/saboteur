import { Group, Text } from '@mantine/core';
import React from 'react';
import { Agent } from '@/types/Agent';
import { AgentName } from './AgentName';
import { useAgents } from '@/contexts/AgentsProvider';

type AgentPickerProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

export const AgentPicker: React.FC<AgentPickerProps> = ({ value, onChange }) => {
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
      {saboteur ? (
        <>
          <AgentName agent={saboteur} />
          <Text>accused</Text>
          {[...agents.values()].map((agent) => (
            <AgentName
              key={agent.id}
              agent={agent}
              variant={value.includes(agent.id) ? 'filled' : 'outline'}
              style={{ cursor: 'pointer' }}
              onClick={() => toggle(agent)}
            >
              {agent.name}
            </AgentName>
          ))}
        </>
      ) : (
        <Text>There is no saboteur</Text>
      )}
    </Group>
  );
};
