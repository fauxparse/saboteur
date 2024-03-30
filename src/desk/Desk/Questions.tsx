import { useQuiz } from '@/contexts/QuizProvider';
import { DEFAULT_QUESTIONS, Question } from '@/types/Question';
import { Accordion, Button, ButtonGroup, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import QuestionEditor from './QuestionEditor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export const Questions: React.FC = () => {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const { questions, addQuestion, reorderQuestions } = useQuiz();

  const addNextQuestion = useCallback(async () => {
    const type = (Object.keys(DEFAULT_QUESTIONS).find(
      (key) => !questions.some((question) => question.type === key)
    ) || 'custom') as Question['type'];
    await addQuestion(type);
  }, [questions, addQuestion]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = questions.findIndex((q) => q.id === active.id);
        const newIndex = questions.findIndex((q) => q.id === over.id);
        reorderQuestions(arrayMove(questions, oldIndex, newIndex));
      }
    },
    [questions, reorderQuestions]
  );

  return (
    <Stack>
      <Accordion chevronPosition="left" value={openQuestion} onChange={setOpenQuestion}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => setOpenQuestion(null)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={questions} strategy={verticalListSortingStrategy}>
            {questions.map((question) => (
              <QuestionEditor key={question.id} question={question} />
            ))}
          </SortableContext>
        </DndContext>
      </Accordion>
      <ButtonGroup>
        <Button leftSection={<IconPlus />} onClick={addNextQuestion}>
          Add question
        </Button>
      </ButtonGroup>
    </Stack>
  );
};
