import { describe, expect, it } from "vitest";
import { answerHelpQuestion, findHelpTopic, suggestedHelpTopics, HELP_TOPICS } from "@ai-job-search/ui/components/helpContent";

describe("Ask Scout offline app guide", () => {
  it.each([
    ["How do I find jobs?", "discover"],
    ["How do I apply for a job?", "prepare"],
    ["Does the app auto-apply for me?", "auto-apply"],
    ["Where are my applications?", "pipeline"],
    ["What is the job fit score?", "ranking"],
    ["How do I connect my workspace?", "workspace"],
    ["Why is the app asking for approval?", "approvals"],
    ["How do I edit my profile?", "profile"],
    ["Do I need AI to use Scout?", "providers"],
    ["Where is my resume PDF?", "documents"],
    ["How do I prepare for an interview?", "interviews"],
    ["Where do I see Claude approvals?", "approvals"],
    ["How do approvals work when ranking?", "approvals"],
    ["How do I change the theme?", "appearance"],
    ["How do I submit the application?", "auto-apply"],
    ["Can I use a local LLM?", "providers"],
    ["What are the keyboard shortcuts?", "navigate"],
  ])("matches %s to %s using bundled content", (question, expectedId) => {
    expect(findHelpTopic(question)?.id).toBe(expectedId);
  });

  it("does not invent answers for unknown questions", () => {
    expect(findHelpTopic("What is the capital of Saturn?")).toBeNull();
    expect(findHelpTopic("")).toBeNull();
    expect(findHelpTopic("jobs")).toBeNull();
    expect(findHelpTopic("help")).toBeNull();
  });

  it("opens a named screen without calling a workflow", () => {
    const opened = answerHelpQuestion("open settings");
    expect(opened.openRoute).toBe("settings");
    expect(opened.topic?.id).toBe("appearance");
    const followUp = answerHelpQuestion("open it", { previous: findHelpTopic("How do I find jobs?") });
    expect(followUp.openRoute).toBe("jobs");
    expect(answerHelpQuestion("show me how rankings work").openRoute).toBeUndefined();
  });

  it("offers contextual help based on the active app screen", () => {
    expect(suggestedHelpTopics("studio").some((topic) => topic.id === "prepare")).toBe(true);
    expect(suggestedHelpTopics("pipeline").some((topic) => topic.id === "pipeline")).toBe(true);
    expect(suggestedHelpTopics("settings").some((topic) => topic.id === "workspace")).toBe(true);
  });

  it("keeps navigation actions within real desktop routes", () => {
    const routes = new Set(["dashboard", "jobs", "studio", "documents", "pipeline", "interview", "activity", "automations", "profile", "settings"]);
    expect(HELP_TOPICS.every((topic) => !topic.route || routes.has(topic.route))).toBe(true);
  });

  it("does not claim to submit job applications", () => {
    expect(findHelpTopic("Does the app auto-apply for me?")?.answer).toContain("does not submit");
  });
});
