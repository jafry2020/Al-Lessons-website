import type { Metadata } from "next";
import { Lesson } from "@/views/Lesson";

export const metadata: Metadata = {
  title: "Optimizers — how SGD, Momentum, RMSprop, and Adam actually behave",
  description:
    "An interactive walkthrough of the four core optimizers used to train neural networks, with a live optimizer race on the Beale function.",
};

export default function OptimizersLessonPage() {
  return <Lesson />;
}
