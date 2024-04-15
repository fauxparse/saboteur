import { useEffect, useState } from "react";
import {
  Timestamp,
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Mission } from "@/types";
import { parseMission } from "@/hooks/useMissions";
import { MissionProvider } from "@/contexts/MissionProvider";
import { AgentsProvider } from "@/contexts/AgentsProvider";
import { Vote } from "./Vote";
import { useVoting } from "./useVoting";

export const App: React.FC = () => {
  const [mission, setMission] = useState<Mission | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  const { canVoteIn, voteFor } = useVoting();

  useEffect(
    () =>
      onSnapshot(
        query(
          collectionGroup(db, "events"),
          where("type", "==", "quiz"),
          where("startsAt", "!=", null),
          where("startsAt", "<", Timestamp.now()),
          where("endsAt", "==", null)
        ),
        async (snapshot) => {
          const missionId = snapshot.docs[0]?.ref?.parent?.parent?.id;

          if (!missionId) {
            setQuizId(null);
            setMission(null);
            return;
          }

          const missionDoc = await getDoc(doc(db, "missions", missionId));
          setMission(parseMission(missionDoc));
          setQuizId(snapshot.docs[0].id);
        }
      ),
    []
  );

  return (
    mission &&
    quizId &&
    canVoteIn(quizId) && (
      <MissionProvider mission={mission}>
        <AgentsProvider>
          <Vote quizId={quizId} onVote={voteFor} />
        </AgentsProvider>
      </MissionProvider>
    )
  );
};
