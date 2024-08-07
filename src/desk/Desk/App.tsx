import {
  ActionIcon,
  AppShell,
  Burger,
  Button,
  Divider,
  Flex,
  MantineProvider,
  Stack,
  Title,
  createTheme,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconHandFinger,
  IconHelpCircle,
  IconMasksTheater,
} from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { AgentList } from './AgentList';
import { Clock } from './Clock';
import { Milestone } from './Milestone';
import { useMission } from '@/contexts/MissionProvider';
import { useAgents } from '@/contexts/AgentsProvider';
import { useMemo } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { Elimination } from '@/types/Event';
import { sortBy } from 'lodash-es';
import { AgentsProvider } from '@/contexts/AgentsProvider';
import { EventBlock } from './EventBlock';
import { SaboteurBlock } from './SaboteurBlock';
import { useDisclosure, useHotkeys } from '@mantine/hooks';

import classes from './Desk.module.css';

const theme = createTheme({
  primaryColor: 'cyan',
});

export const App: React.FC = () => {
  const { mission } = useMission();

  const { agents } = useAgents();

  const { events, createQuiz, createScene, createSuspicional, updateEvent, deleteEvent } =
    useEvents(mission);

  const [showSidebar, { toggle: toggleSidebar }] = useDisclosure(false);

  const allEvents = useMemo(() => {
    const eliminations: Elimination[] = agents
      .filter((a) => !!a.eliminatedAt)
      .map(
        (a) =>
          ({
            id: a.id,
            type: 'elimination',
            timestamp: a.eliminatedAt,
            agentId: a.id,
          }) as Elimination
      );
    return sortBy([...events, ...eliminations], ({ timestamp }) => timestamp.valueOf());
  }, [events, agents]);

  useHotkeys([
    ['alt+S', createScene],
    ['alt+Q', createQuiz],
    ['alt+U', createSuspicional],
  ]);

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <AgentsProvider>
        <AppShell
          className={classes.shell}
          header={{ height: 72 }}
          navbar={{
            width: 300,
            breakpoint: 'sm',
            collapsed: { mobile: !showSidebar, desktop: false },
          }}
        >
          <AppShell.Header className={classes.header} p="md">
            <Flex align="center" gap="sm">
              <Burger opened={showSidebar} onClick={toggleSidebar} hiddenFrom="sm" />
              <ActionIcon
                component={Link}
                to="/desk"
                variant="transparent"
                aria-label="Back"
                visibleFrom="sm"
              >
                <IconArrowLeft />
              </ActionIcon>
              <Title order={1} size="h4" visibleFrom="sm">
                {mission.id}
              </Title>
            </Flex>
            <Clock />
          </AppShell.Header>
          <AppShell.Navbar>
            <Stack gap="sm" p="md" hiddenFrom="sm">
              <Button
                component={Link}
                to="/desk"
                variant="transparent"
                leftSection={<IconArrowLeft />}
                justify="start"
              >
                Back
              </Button>
            </Stack>
            <AgentList />
            <Divider />
            <Stack gap="md" p="md">
              <Button
                className={classes.actionButton}
                variant="outline"
                justify="start"
                leftSection={<IconMasksTheater />}
                rightSection={<span>⌥S</span>}
                onClick={createScene}
              >
                Add scene
              </Button>
              <Button
                className={classes.actionButton}
                variant="outline"
                justify="start"
                leftSection={<IconHandFinger />}
                rightSection={<span>⌥U</span>}
                onClick={createSuspicional}
              >
                Add suspicional
              </Button>
              <Button
                className={classes.actionButton}
                variant="outline"
                justify="start"
                leftSection={<IconHelpCircle />}
                rightSection={<span>⌥Q</span>}
                onClick={createQuiz}
              >
                Add quiz
              </Button>
            </Stack>
          </AppShell.Navbar>
          <AppShell.Main>
            <div className={classes.grid}>
              {mission.startsAt && <Milestone time={mission.startsAt}>Mission start</Milestone>}
              <SaboteurBlock />
              {allEvents.map((event) => (
                <EventBlock
                  key={event.id}
                  event={event}
                  onUpdate={updateEvent}
                  onDelete={deleteEvent}
                />
              ))}
              {mission.endsAt && <Milestone time={mission.endsAt}>Mission end</Milestone>}
            </div>
          </AppShell.Main>
        </AppShell>
      </AgentsProvider>
    </MantineProvider>
  );
};
