// Pour lancer ce test : npx tsx scripts/test-deepseek-v3.2.ts (Node 18+)

const API_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-v3.2";

type ChatMessage = { role: string; content: string };
type ChatChoice = { message?: ChatMessage };
type ChatCompletionResponse = {
  model?: string;
  usage?: { model?: string };
  choices?: ChatChoice[];
};

async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error("Missing DEEPSEEK_API_KEY in environment.");
    process.exit(1);
  }

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content:
          "Réponds en une phrase courte pour confirmer que le modèle deepseek-v3.2 fonctionne correctement.",
      },
    ],
  };

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("Network error while calling DeepSeek:", error);
    process.exit(1);
    return;
  }

  console.log(`HTTP status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("DeepSeek API returned a non-2xx response:", errorText);
    process.exit(1);
  }

  let data: ChatCompletionResponse | undefined;
  try {
    data = (await response.json()) as ChatCompletionResponse;
  } catch (error) {
    console.error("Failed to parse JSON from DeepSeek:", error);
    process.exit(1);
  }

  const returnedModel = data?.model ?? data?.usage?.model ?? "(missing)";
  console.log("DeepSeek model returned:", returnedModel);

  const firstMessage = data?.choices?.[0]?.message?.content?.trim();
  if (firstMessage) {
    console.log("First message:", firstMessage);
  } else {
    console.error("No message content returned in the first choice.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
