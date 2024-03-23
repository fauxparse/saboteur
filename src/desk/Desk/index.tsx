import { Mission } from '@/types';
import { ActionIcon, AppShell, Flex, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';

import classes from './Desk.module.css';
import { MissionProvider } from '../../contexts/MissionProvider';
import { AgentList } from './AgentList';

type DeskProps = {
  mission: Mission;
};

export const Desk: React.FC<DeskProps> = ({ mission }) => {
  return (
    <MissionProvider mission={mission}>
      <AppShell>
        <AppShell.Header className={classes.header} p="md">
          <Flex align="center" gap="sm">
            <ActionIcon component={Link} to="/desk" variant="transparent" aria-label="Back">
              <IconArrowLeft />
            </ActionIcon>
            <Title order={1} size="h4" ff="mono">
              {mission.id}
            </Title>
          </Flex>
          <AgentList />
        </AppShell.Header>
        <AppShell.Main>Main</AppShell.Main>
        <AppShell.Footer>Footer</AppShell.Footer>
      </AppShell>
    </MissionProvider>
  );
};
