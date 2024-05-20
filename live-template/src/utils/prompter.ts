import inquirer from "inquirer";

interface Question {
  type: string;
  name: string;
  message: string;
  choices?: string[];
  default?: string;
}

export async function askQuestions(
  questions: Question[]
): Promise<Record<string, any>> {
  return inquirer.prompt(questions);
}
