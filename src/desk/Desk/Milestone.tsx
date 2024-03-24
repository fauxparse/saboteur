import { PropsWithChildren, ReactNode } from 'react';
import { IconClock } from '@tabler/icons-react';
import { ActionIcon, Badge, Menu, MenuDropdown, MenuTarget } from '@mantine/core';
import { format } from 'date-fns';

import classes from './Desk.module.css';

type MilestoneProps = PropsWithChildren<{
  time?: Date;
  icon?: ReactNode;
  menu?: ReactNode;
}>;

export const Milestone: React.FC<MilestoneProps> = ({
  time,
  icon = <IconClock />,
  menu,
  children,
}) => {
  return (
    <div className={classes.milestone}>
      {time && (
        <Badge variant="light" size="lg" className={classes.milestoneTime}>
          {format(time, 'h:mma')}
        </Badge>
      )}
      <div className={classes.milestoneIcon}>
        {menu ? (
          <Menu withArrow>
            <MenuTarget>
              <ActionIcon
                aria-label="Menu"
                size="lg"
                variant="subtle"
                radius="xl"
                p={0}
                style={{ border: 0, margin: '-5px', '--ai-size-sm': '1.5rem' }}
              >
                {icon}
              </ActionIcon>
            </MenuTarget>
            <MenuDropdown>{menu}</MenuDropdown>
          </Menu>
        ) : (
          icon
        )}
      </div>
      <div className={classes.milestoneContent}>{children}</div>
    </div>
  );
};
