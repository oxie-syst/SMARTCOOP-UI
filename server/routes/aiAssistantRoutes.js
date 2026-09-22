const {
  checkFeatureLimit,
  logFeatureUsage
} = require("../utils/featurelimit");

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();


const GEMINI_MODELS = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash"
];


const knowledgePath = path.join(
  __dirname,
  "../training/ai-assistant/poultry-knowledge.json"
);


let poultryKnowledge = {};


try {

  poultryKnowledge = JSON.parse(
    fs.readFileSync(
      knowledgePath,
      "utf8"
    )
  );

  console.log(
    "AI Assistant Knowledge Base: LOADED"
  );

} catch (error) {

  console.error(
    "AI Assistant Knowledge Base Error:",
    error.message
  );

}


function getRelevantKnowledge(message) {

  const text =
    message.toLowerCase();

  const relevant = {};


  if (
    text.includes("breed") ||
    text.includes("lahi") ||
    text.includes("layer") ||
    text.includes("broiler") ||
    text.includes("dual purpose") ||
    text.includes("egg") ||
    text.includes("itlog")
  ) {

    relevant.breeds =
      poultryKnowledge.breeds;

  }


  if (
    text.includes("coop") ||
    text.includes("housing") ||
    text.includes("space") ||
    text.includes("kulungan") ||
    text.includes("ventilation") ||
    text.includes("lighting") ||
    text.includes("ilaw")
  ) {

    relevant.housing =
      poultryKnowledge.housing;

  }


  if (
    text.includes("feed") ||
    text.includes("feeding") ||
    text.includes("pagkain") ||
    text.includes("pakain") ||
    text.includes("nutrition") ||
    text.includes("water") ||
    text.includes("tubig")
  ) {

    relevant.feeding =
      poultryKnowledge.feeding;

  }


  if (
    text.includes("health") ||
    text.includes("sick") ||
    text.includes("disease") ||
    text.includes("symptom") ||
    text.includes("sakit") ||
    text.includes("may sakit") ||
    text.includes("mahina") ||
    text.includes("namamatay") ||
    text.includes("mortality")
  ) {

    relevant.health =
      poultryKnowledge.health;

    relevant.biosecurity =
      poultryKnowledge.biosecurity;

  }


  if (
    text.includes("biosecurity") ||
    text.includes("sanitize") ||
    text.includes("sanitation") ||
    text.includes("clean") ||
    text.includes("cleaning") ||
    text.includes("linis") ||
    text.includes("paglilinis")
  ) {

    relevant.biosecurity =
      poultryKnowledge.biosecurity;

    relevant.sanitation =
      poultryKnowledge.sanitation;

  }


  if (
    text.includes("egg production") ||
    text.includes("itlog") ||
    text.includes("laying") ||
    text.includes("egg")
  ) {

    relevant.eggProduction =
      poultryKnowledge.eggProduction;

  }


  if (
    text.includes("broiler") ||
    text.includes("meat") ||
    text.includes("karne")
  ) {

    relevant.broilerManagement =
      poultryKnowledge.broilerManagement;

  }


  if (
    text.includes("record") ||
    text.includes("records") ||
    text.includes("expense") ||
    text.includes("expenses") ||
    text.includes("cost") ||
    text.includes("budget") ||
    text.includes("gastos") ||
    text.includes("presyo")
  ) {

    relevant.recordKeeping =
      poultryKnowledge.recordKeeping;

    relevant.budgeting =
      poultryKnowledge.budgeting;

  }


  if (
    text.includes("smartcoop") ||
    text.includes("feature") ||
    text.includes("features") ||
    text.includes("system") ||
    text.includes("app")
  ) {

    relevant.smartcoop =
      poultryKnowledge.smartcoop;

  }


  if (
    Object.keys(relevant).length === 0
  ) {

    return {

      smartcoop:
        poultryKnowledge.smartcoop,

      healthGuidance:
        poultryKnowledge.health
          ?.guidance

    };

  }


  return relevant;
}


router.post(
  "/chat",
  async (req, res) => {

    try {

      const {
        userId,
        message,
        history = []
      } = req.body;


      if (
        !message ||
        !message.trim()
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Please enter a question."

          });

      }


      if (
        message.trim().length > 1000
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Your question is too long. Please keep it under 1000 characters."

          });

      }


      if (
        !process.env.GEMINI_API_KEY
      ) {

        return res
          .status(500)
          .json({

            success: false,

            message:
              "Gemini API key is not configured."

          });

      }


      if (!userId) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "User ID is required."

          });

      }


      const featureCheck =
        await checkFeatureLimit(
          userId,
          "ai_assistant"
        );


      if (
        !featureCheck.allowed
      ) {

        return res
          .status(429)
          .json({

            success: false,

            message:
              featureCheck.message ||
              "You have reached your daily AI Assistant limit.",

            usage: {

              feature:
                "ai_assistant",

              limit:
                featureCheck.limit || 5,

              used:
                featureCheck.used ||
                featureCheck.limit ||
                5,

              remaining: 0,

              isPremium: false

            }

          });

      }


      const cleanHistory =
        Array.isArray(history)

          ? history
              .slice(-10)
              .filter(
                item =>
                  item &&
                  typeof item.message ===
                    "string" &&
                  typeof item.reply ===
                    "string"
              )

          : [];


      const conversation =
        cleanHistory
          .map(
            item => `

User: ${item.message}
SmartCoop AI: ${item.reply}

`
          )
          .join("\n");


      const relevantKnowledge =
        getRelevantKnowledge(
          message
        );


      const knowledgeContext =
        JSON.stringify(
          relevantKnowledge,
          null,
          2
        );


      const prompt = `

You are SmartCoop AI, the official intelligent virtual assistant of the SmartCoop Poultry Planning and Management System.

Your purpose is to provide reliable, practical, professional, and easy-to-understand guidance related to poultry farming and poultry farm management.

AREAS OF ASSISTANCE

You may provide guidance on:

- Poultry farm planning and management
- Broiler, layer, and dual-purpose chickens
- Chicken breed selection
- Coop design, space requirements, and capacity
- Housing, ventilation, lighting, and environmental management
- Feeding and nutrition
- Water management
- Growth and production management
- Egg production
- Poultry health and general flock observation
- Disease prevention and biosecurity
- Coop sanitation and hygiene
- Mortality prevention and flock management
- Poultry farm expenses and budgeting
- Cost-saving practices
- Farm record keeping
- Alerts, schedules, and routine farm activities
- Beginner poultry farming practices
- General guidance on using SmartCoop features

RESPONSE GUIDELINES

1. Respond in a professional, respectful, and helpful manner.

2. Provide clear and practical information that can be understood by beginner and experienced poultry raisers.

3. Organize detailed answers using short paragraphs, numbered steps, or bullet points when appropriate.

4. Prioritize practical recommendations that can realistically be applied to poultry farm management.

5. Explain technical poultry terms briefly when necessary.

6. Do not invent information about the user's chickens, coop, farm, location, records, expenses, or production.

7. If important information is missing, ask an appropriate follow-up question before making a very specific recommendation.

8. When discussing costs, quantities, production, capacity, or other estimates, clearly identify them as estimates when exact information is unavailable.

9. When discussing poultry health, provide general health and management guidance only. Never present an AI-generated response as a confirmed veterinary diagnosis.

10. If the user describes serious, persistent, or rapidly worsening health concerns in the flock, recommend consulting a qualified veterinarian or appropriate animal health professional.

11. Clearly distinguish between preventive management advice and treatment recommendations.

12. Do not recommend unsafe, unverified, or potentially harmful poultry management practices.

13. If several solutions are possible, briefly explain the advantages and considerations of each option instead of presenting one option as universally correct.

14. Maintain context from the previous conversation when it is relevant to the current question.

15. Do not claim that SmartCoop has accessed or analyzed farm information unless that information was explicitly provided in the conversation.

16. For questions unrelated to poultry farming or SmartCoop, politely explain that SmartCoop AI is primarily designed to assist with poultry planning and management.

17. Respond naturally to greetings, acknowledgements, and questions about SmartCoop AI.

18. Avoid unnecessarily long responses. Give enough explanation to answer the question properly while remaining clear and focused.

19. Always complete your response. Never end in the middle of a sentence, list, explanation, or recommendation.

20. Keep normal responses reasonably concise unless the user specifically requests a more detailed explanation.

21. Detect the language used by the user and respond in the same language whenever possible.

22. If the user communicates in Filipino or Tagalog, respond naturally in Filipino or Tagalog using clear and easy-to-understand terms.

23. If the user uses Taglish, respond naturally in Taglish while maintaining a professional and helpful tone.

24. Keep commonly used poultry and technical terms in English when translating them would make the explanation less clear.

SMARTCOOP KNOWLEDGE BASE

The following information comes from SmartCoop's curated poultry knowledge base.

Use this information as your primary SmartCoop reference whenever it is relevant to the user's question.

Do not claim that information exists in the knowledge base if it is not included below.

If the knowledge base does not contain enough information to fully answer the question, you may provide general poultry knowledge, but do not invent SmartCoop-specific facts.

Relevant SmartCoop knowledge:

${knowledgeContext}

COMMUNICATION STYLE

Use a professional and approachable tone.

Prefer clear language over unnecessarily complicated terminology.

Be confident when information is well established, but acknowledge uncertainty when appropriate.

Do not exaggerate SmartCoop's capabilities.

Your responses should support informed decision-making rather than make decisions on behalf of the user.

CONVERSATION CONTEXT

Previous conversation:

${conversation || "No previous conversation is available."}

CURRENT USER QUESTION

${message.trim()}

Provide the most appropriate response as SmartCoop AI:

`;


      let lastError = null;


      for (
        const model of GEMINI_MODELS
      ) {

        try {

          const response =
            await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
              {

                method: "POST",

                headers: {

                  "Content-Type":
                    "application/json"

                },

                body: JSON.stringify({

                  contents: [
                    {

                      role: "user",

                      parts: [
                        {

                          text: prompt

                        }
                      ]

                    }
                  ],

                  generationConfig: {

                    temperature: 0.4,

                    maxOutputTokens:
                      2048

                  }

                })

              }
            );


          const data =
            await response.json();


          if (!response.ok) {

            lastError =
              data?.error?.message ||
              `Gemini request failed using ${model}.`;


            console.error(
              `Gemini ${model} Error:`,
              lastError
            );


            continue;

          }


          const reply =
            data
              ?.candidates
              ?.[0]
              ?.content
              ?.parts
              ?.map(
                part =>
                  part.text || ""
              )
              .join("")
              .trim();


          if (!reply) {

            lastError =
              `${model} returned an empty response.`;


            console.error(
              "Gemini Empty Response:",
              data
            );


            continue;

          }


          const finishReason =
            data
              ?.candidates
              ?.[0]
              ?.finishReason;


          console.log(
            `AI Assistant Model: ${model}`
          );


          console.log(
            `AI Question: ${message}`
          );


          console.log(
            `AI Finish Reason: ${
              finishReason ||
              "UNKNOWN"
            }`
          );


          console.log(
            "AI USER ID RECEIVED:",
            userId
          );


try {

  if (!featureCheck.isPremium) {

    await logFeatureUsage(
      userId,
      "ai_assistant"
    );

    console.log(
      "AI FEATURE USAGE SAVED:",
      {
        userId,
        feature:
          "ai_assistant"
      }
    );

  }

} catch (usageError) {

  console.error(
    "AI FEATURE USAGE ERROR:",
    usageError
  );

  return res
    .status(500)
    .json({

      success: false,

      message:
        "Unable to save AI usage."

    });

}
try {

  await new Promise(
    (resolve, reject) => {

      const db =
        require("../db");

      db.query(
        `
          INSERT INTO ai_usage_logs
          (
            UserID,
            FeatureName
          )
          VALUES (?, ?)
        `,
        [
          userId,
          "AI Assistant"
        ],
        (err, result) => {

          if (err) {
            reject(err);
            return;
          }

          resolve(result);
        }
      );

    }
  );

  console.log(
    "AI ANALYTICS USAGE SAVED:",
    {
      userId,
      feature: "AI Assistant"
    }
  );

} catch (analyticsError) {

  console.error(
    "AI ANALYTICS USAGE ERROR:",
    analyticsError
  );

}

const remaining =
  featureCheck.isPremium

    ? null

    : Math.max(
        Number(
          featureCheck.remaining ||
          0
        ) - 1,
        0
      );
    
          return res.json({

            success: true,

            reply,

            usage: {

              feature:
                "ai_assistant",

              limit:
                featureCheck.limit,

              used:
                featureCheck.isPremium
                  ? null
                  : Number(
                      featureCheck.used ||
                      0
                    ) + 1,

              remaining,

              isPremium:
                featureCheck.isPremium

            }

          });


        } catch (error) {

          lastError =
            error.message;


          console.error(
            `Gemini ${model} Request Error:`,
            error
          );

        }

      }


      return res
        .status(502)
        .json({

          success: false,

          message:
            lastError ||
          "SmartCoop AI is temporarily busy. Please try again in a moment."

        });


    } catch (error) {

      console.error(
        "AI ASSISTANT ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "SmartCoop AI encountered an error."

        });

    }

  }
);


module.exports = router;