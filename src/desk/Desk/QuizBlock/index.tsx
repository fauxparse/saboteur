import { Quiz } from '@/types/Event';
import { Milestone } from '../Milestone';
import { IconCopy, IconHelpCircle, IconTrash } from '@tabler/icons-react';
import { Menu } from '@mantine/core';
import { QuizProvider, QuizContext } from '@/contexts/QuizProvider';
import { Questions } from './Questions';
import { ResponseSummary } from './ResponseSummary';

type QuizBlockProps = {
  event: Quiz;
  onDelete: (quiz: Quiz) => void;
};

export const QuizBlock: React.FC<QuizBlockProps> = ({ event: quiz, onDelete }) => {
  return (
    <QuizProvider quiz={quiz}>
      <QuizContext.Consumer>
        {({ duplicateQuiz }) => (
          <>
            <Milestone
              icon={<IconHelpCircle />}
              time={quiz.timestamp}
              menu={
                <>
                  <Menu.Item leftSection={<IconCopy />} onClick={duplicateQuiz}>
                    Duplicate
                  </Menu.Item>
                  <Menu.Item leftSection={<IconTrash />} color="red" onClick={() => onDelete(quiz)}>
                    Delete
                  </Menu.Item>
                </>
              }
            >
              <Questions />
            </Milestone>
            {quiz.startsAt && <ResponseSummary />}
          </>
        )}
      </QuizContext.Consumer>
    </QuizProvider>
  );
};
