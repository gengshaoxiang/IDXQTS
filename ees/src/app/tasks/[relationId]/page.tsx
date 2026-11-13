"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BallotForm } from "@/components/BallotForm";

export default function BallotPage() {
  const params = useParams<{ relationId: string }>();
  const router = useRouter();
  const [task, setTask] = useState<{
    relationId: string;
    subjectName: string;
    positionTitle: string;
    taskStatus: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/evaluations/tasks")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.message);
        const found = (j.data.tasks as typeof task[]).find(
          (t) => t && t.relationId === params.relationId,
        );
        if (!found) throw new Error("未找到该评价任务");
        setTask(found);
      })
      .catch((e) => setError(e.message));
  }, [params.relationId]);

  if (error) return <p className="text-red-700">{error}</p>;
  if (!task) return <p className="text-ink-soft">加载中…</p>;
  if (task.taskStatus === "COMPLETED") {
    return <p className="text-sea">该任务已提交，不可重复评价。</p>;
  }

  return (
    <BallotForm
      relationId={task.relationId}
      subjectName={task.subjectName}
      positionTitle={task.positionTitle}
      onDone={() => router.push("/tasks")}
    />
  );
}
