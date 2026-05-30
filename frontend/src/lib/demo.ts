import type { Summary, Quiz } from "./types";

export const DEMO_SUMMARY: Summary = {
  shortSummary:
    "Data structures organize information so algorithms can access, update, and scale efficiently.",
  keyPoints: [
    "Arrays enable fast indexing but fixed size.",
    "Linked lists are flexible but slower for random access.",
    "Stacks and queues control order of processing.",
    "Trees model hierarchies and speed up search.",
    "Big-O estimates performance for operations.",
  ],
  keyConcepts: [
    "Complexity analysis",
    "Stack (LIFO)",
    "Queue (FIFO)",
    "Binary search tree",
    "Hash tables",
  ],
  formulas: [
    "Access time (array): O(1)",
    "Search (BST avg): O(log n)",
    "Search (linear): O(n)",
  ],
};

export const DEMO_QUIZ: Quiz = {
  questions: [
    {
      question: "Which data structure uses LIFO order?",
      options: ["Queue", "Stack", "Array", "Tree"],
      answer: "Stack",
    },
    {
      question: "Average search time in a balanced BST is:",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      answer: "O(log n)",
    },
    {
      question: "Which structure is best for FIFO processing?",
      options: ["Queue", "Stack", "Heap", "Graph"],
      answer: "Queue",
    },
  ],
};
