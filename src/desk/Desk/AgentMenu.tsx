import { Agent } from '@/types';
import { Button, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { AgentInfo } from './AgentInfo';

type AgentMenuProps = {
  agent: Agent;
  onDelete: (agent: Agent) => void;
};

export const AgentMenu: React.FC<AgentMenuProps> = ({ agent, onDelete }) => {
  const [editing, modal] = useDisclosure();

  return (
    <>
      <Menu>
        <Menu.Target>
          <Button>{agent.name}</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<IconEdit />} onClick={modal.open}>
            Edit details
          </Menu.Item>
          <Menu.Item color="red" leftSection={<IconTrash />} onClick={() => onDelete(agent)}>
            Delete agent
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <AgentInfo agent={agent} opened={editing} onClose={modal.close} />
    </>
  );
};
