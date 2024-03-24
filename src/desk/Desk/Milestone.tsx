import { PropsWithChildren, ReactNode } from 'react';
import { IconClock } from '@tabler/icons-react';
import { Badge } from '@mantine/core';
import { format } from 'date-fns';

import classes from './Desk.module.css';

type MilestoneProps = PropsWithChildren<{
  time?: Date;
  icon?: ReactNode;
}>;

export const Milestone: React.FC<MilestoneProps> = ({ time, icon = <IconClock />, children }) => {
  return (
    <div className={classes.milestone}>
      {time && (
        <Badge variant="light" size="lg" className={classes.milestoneTime}>
          {format(time, 'h:mma')}
        </Badge>
      )}
      <div className={classes.milestoneIcon}>{icon}</div>
      <div className={classes.milestoneContent}>{children}</div>
    </div>
  );
};
