import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { A2UIPayload } from "../types/a2ui";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `
Bạn là Trợ lý AI cho Hệ thống Giám sát Môi trường Thông minh. 
Mục tiêu của bạn là giao tiếp bằng mã JSON A2UI (Agent-to-User Interface).

### QUY TẮC QUAN TRỌNG:
- Luôn trả về dữ liệu JSON hợp lệ.
- TẤT CẢ văn bản hiển thị (title, value, content, label) PHẢI bằng TIẾNG VIỆT.
- KHÔNG có bình luận bên trong JSON.
- KHÔNG có văn bản thừa bên ngoài JSON.

### CẤU TRÚC JSON:
{
  "version": "1.0",
  "components": [
    {
      "id": "unique_id",
      "type": "container",
      "props": {},
      "children": [
        {
          "id": "comp_1",
          "type": "stat-card",
          "props": {
            "title": "Nhiệt độ",
            "value": "24°C",
            "icon": "thermostat",
            "colorClass": "text-orange-400"
          }
        }
      ]
    }
  ]
}

### CÁC LOẠI THÀNH PHẦN:
- type: "container", "grid-container", "text", "button", "stat-card"
- icons: thermostat, humidity_percentage, air, eco, warning, trending_up
- text styles: "title", "body", "caption"

Nếu người dùng yêu cầu xem dữ liệu/thông số, hãy sử dụng grid-container với các stat-cards. 
Nếu người dùng đặt câu hỏi, hãy sử dụng các thành phần text.
`;

/**
 * Utility to attempt to "close" a truncated JSON string by adding missing brackets.
 * Highly useful for experimental AI models that might cut off output.
 */
const tryFixJson = (json: string): string => {
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (char === '"' && json[i - 1] !== '\\') inString = !inString;
    if (!inString) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }
  }

  let fixed = json;
  if (inString) fixed += '"';
  while (openBrackets > 0) { fixed += ']'; openBrackets--; }
  while (openBraces > 0) { fixed += '}'; openBraces--; }

  return fixed;
};

export const getAgentResponse = async (userInput: string): Promise<A2UIPayload> => {
  if (!API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is missing. Please add it to your .env file.");
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });

    const generationConfig = {
      temperature: 0.1, // Lower temperature for more consistent JSON
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048, // Increased limit for complex UIs
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT + "\nIMPORTANT: Ensure the JSON is complete and valid. Close all brackets." }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will provide strictly valid and complete A2UI JSON payloads." }],
        },
      ],
    });

    const result = await chatSession.sendMessage(userInput);
    let responseText = result.response.text();

    // Advanced Clean: Extract JSON part
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    } else {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    try {
      // First attempt: standard parse
      return JSON.parse(responseText) as A2UIPayload;
    } catch (e) {
      // Second attempt: try to fix truncated JSON
      console.warn("JSON malformed, attempting to fix truncation...");
      const fixedJson = tryFixJson(responseText);
      try {
        const parsed = JSON.parse(fixedJson);
        if (!parsed.components) throw new Error("Fixed JSON missing components.");
        return parsed as A2UIPayload;
      } catch (innerError) {
        console.error("AI JSON Error Details:", responseText);
        throw new Error("The AI response was invalid. Please try a simpler request.");
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // Re-throw with user-friendly message
    if (error.message?.includes("429")) {
      throw new Error("Quota exceeded. Please wait a minute.");
    }
    throw error;
  }
};
