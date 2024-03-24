import { Group, Text } from '@mantine/core';
import { format } from 'date-fns';
import React, { ReactNode, useEffect, useState } from 'react';
import classes from './Clock.module.css';
import { MissionStatus } from './MissionStatus';

export const Clock: React.FC = () => {
  const [time, setTime] = useState<ReactNode>('');

  useEffect(() => {
    const t = setInterval(() => {
      const date = new Date();
      setTime(
        <>
          <span>{format(date, 'h:mm')}</span>
          <span style={{ opacity: 0.5 }}>{format(date, ':ss')}</span>
        </>
      );
    }, 1000);

    return () => clearInterval(t);
  }, []);

  return (
    <Group>
      <Text className={classes.clock} component="span" size="2rem" fw={500}>
        {time}
      </Text>
      <MissionStatus />
    </Group>
  );
};
