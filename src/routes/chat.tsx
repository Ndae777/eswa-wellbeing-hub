import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { SiteLayout } from "@/components/site/site-layout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Wellness chat helper — ESWA" },
      {
        name: "description",
        content:
          "Ask the ESWA wellness helper for mental health tips and short activities made for South African educators.",
      },
      { property: "og:title", content: "Wellness chat helper — ESWA" },
      {
        property: "og:description",
        content: "Practical, confidential wellbeing tips and activities for teachers, any time.",
      },
    ],
  }),
  component: Chat,
});

const starters = [
  "I feel exhausted after every school day. What can I do tonight?",
  "Give me a 3-minute calming activity I can do before a lesson.",
  "How do I set boundaries with work messages after hours?",
  "What are early signs of burnout I should watch for?",
];

function Chat() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: () => toast.error("The wellness helper is unavailable right now. Please try again."),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy, messages.length]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    await sendMessage({ text: trimmed });
  }

  return (
    <SiteLayout>
      <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col px-4 py-6">
        <header>
          <h1 className="font-display text-2xl">Wellness chat helper</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tips and short activities for your wellbeing. This is not therapy or an emergency
            service — in a crisis call SADAG 0800 456 789 or Lifeline SA 0861 322 322.
          </p>
        </header>

        <Conversation className="mt-4 flex-1">
          <ConversationContent>
            {messages.length === 0 && (
              <ConversationEmptyState
                title="How are you doing today?"
                description="Ask anything about stress, sleep, focus or classroom pressure."
              >
                <div className="mt-4 grid gap-2">
                  {starters.map((starter) => (
                    <Button
                      key={starter}
                      variant="outline"
                      className="h-auto whitespace-normal py-2 text-left text-sm"
                      onClick={() => void send(starter)}
                    >
                      {starter}
                    </Button>
                  ))}
                </div>
              </ConversationEmptyState>
            )}

            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  <MessageResponse>
                    {message.parts
                      .map((part) => (part.type === "text" ? part.text : ""))
                      .join("")}
                  </MessageResponse>
                </MessageContent>
              </Message>
            ))}

            {status === "submitted" && <Shimmer>Thinking…</Shimmer>}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput
          className="mt-4"
          onSubmit={(_message, event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for a wellbeing tip or activity…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </SiteLayout>
  );
}
