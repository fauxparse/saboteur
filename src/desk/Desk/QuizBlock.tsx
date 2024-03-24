import { Quiz } from '@/types/Event';
import { Milestone } from './Milestone';
import { IconHelpCircle, IconTrash } from '@tabler/icons-react';
import { Menu } from '@mantine/core';

type QuizBlockProps = {
  event: Quiz;
  onDelete: (quiz: Quiz) => void;
};

export const QuizBlock: React.FC<QuizBlockProps> = ({ event: quiz, onDelete }) => {
  return (
    <Milestone
      icon={<IconHelpCircle />}
      time={quiz.startsAt}
      menu={
        <>
          <Menu.Item leftSection={<IconTrash />} color="red" onClick={() => onDelete(quiz)}>
            Delete
          </Menu.Item>
        </>
      }
    >
      Quiz
    </Milestone>
  );
};
