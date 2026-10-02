import type { Question } from "../../shared/game";

const entries: Array<[string, string, number, string]> = [
  ["everest", "How tall is Mount Everest?", 8849, "meters"],
  ["bones", "How many bones are in an adult human body?", 206, "bones"],
  ["moon", "How far is the Moon from Earth?", 384400, "km"],
  ["light", "How fast does light travel?", 299792, "km/s"],
  ["eiffel", "How tall is the Eiffel Tower?", 330, "meters"],
  ["ocean", "How deep is the Mariana Trench?", 10984, "meters"],
  ["earth", "What is Earth’s circumference at the equator?", 40075, "km"],
  ["heart", "How many times does a heart beat in a day?", 100000, "beats"],
  ["mars", "How far is Mars from Earth on average?", 225000000, "km"],
  ["amazon", "How long is the Amazon River?", 6400, "km"],
  ["pyramid", "How tall was the Great Pyramid originally?", 146, "meters"],
  ["sahara", "How large is the Sahara Desert?", 9200000, "km²"],
  ["jupiter", "How many Earths could fit inside Jupiter?", 1321, "Earths"],
  ["whale", "How long can a blue whale grow?", 30, "meters"],
  ["speed", "How fast can a cheetah run?", 110, "km/h"],
  ["age", "How old is Earth?", 4540000000, "years"],
  ["water", "What is the boiling point of water at sea level?", 100, "°C"],
  ["paris", "How tall is the Statue of Liberty?", 93, "meters"],
];

export const QUESTIONS: Question[] = entries.map(
  ([id, question, answer, unit]) => ({
    id,
    question,
    answer,
    unit,
  }),
);
