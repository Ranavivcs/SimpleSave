import { redirect } from "next/navigation";

/**
 * The demo questionnaire has been superseded by the production new-mortgage
 * flow. Kept as a redirect so old links don't 404.
 */
export default function DemoQuestionnairePage() {
  redirect("/questionnaire/new-mortgage");
}
