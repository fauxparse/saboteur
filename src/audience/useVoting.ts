import { realtime } from "@/firebase";
import { ref, increment, update } from "firebase/database";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

const VotingSchema = z.array(z.string());

const readLocalStorage = (key: string) => {
  const existing = localStorage.getItem(key);
  return new Set(existing ? VotingSchema.parse(JSON.parse(existing)) : []);
};

const writeLocalStorage = (key: string, value: Set<string>) => {
  localStorage.setItem(
    key,
    JSON.stringify(VotingSchema.parse(Array.from(value)))
  );
};

const useLocalStorageList = (key: string) => {
  const [items, setItems] = useState(() => readLocalStorage(key));

  useEffect(() => {
    const localStorageUpdated = () => setItems(readLocalStorage(key));
    addEventListener("storage", localStorageUpdated);
    return () => removeEventListener("storage", localStorageUpdated);
  }, [key]);

  const add = useCallback(
    (item: string) => {
      const existing = readLocalStorage(key);
      existing.add(item);
      writeLocalStorage(key, existing);
      setItems(existing);
    },
    [key]
  );

  return { items, add };
};

export const useVoting = () => {
  const { items, add } = useLocalStorageList("saboteur.voting");

  const voteFor = useCallback(
    (quizId: string, agentId: string) => {
      if (items.has(agentId)) return;
      const updates = {
        [`quizzes/${quizId}/${agentId}`]: increment(1),
      };
      update(ref(realtime), updates);
      add(quizId);
    },
    [items, add]
  );

  const canVoteIn = useCallback(
    (quizId: string) => !items.has(quizId),
    [items]
  );

  return { voteFor, canVoteIn };
};
