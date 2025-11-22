import { GoogleGenAI } from "@google/genai";

// Ensure API key is present
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a tattoo try-on image using Gemini.
 * @param personImageBase64 Base64 string of the person/body part (without data:image/ prefix)
 * @param tattooImageBase64 Base64 string of the tattoo design (without data:image/ prefix)
 * @returns The resulting image as a base64 string.
 */
export const generateTattooTryOn = async (
  personImageBase64: string,
  tattooImageBase64: string,
  mimeTypePerson: string = 'image/jpeg',
  mimeTypeTattoo: string = 'image/png'
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image';

    const prompt = `
      Act as a professional tattoo artist and photo editor. 
      I have provided two images. 
      The first image is a photo of a person's body part (skin).
      The second image is a tattoo design (stencil or art).
      
      Task: Realistically composite the tattoo design onto the person's skin in the first image.
      - Adjust the perspective, warping, and curvature of the tattoo to match the body part's geometry.
      - Apply realistic skin texture overlays, shading, and lighting to make the ink look like it is IN the skin, not just floating on top.
      - Maintain the original skin tone and lighting conditions of the person.
      - Return ONLY the final edited image showing the person with the tattoo applied.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mimeTypePerson, data: personImageBase64 } },
          { inlineData: { mimeType: mimeTypeTattoo, data: tattooImageBase64 } }
        ]
      }
    });

    return extractImageFromResponse(response);

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

/**
 * Generates a tattoo design from a prompt and optional reference images.
 * This supports both "Text-to-Image" and "Image-to-Image" (drawing over).
 * Now supports generating multiple variations.
 */
export const generateTattooDesign = async (
  promptText: string,
  referenceImages: string[] = [],
  count: number = 1
): Promise<string[]> => {
  try {
    const model = 'gemini-2.5-flash-image';

    const generateOne = async () => {
        const parts: any[] = [
        { 
            text: `You are a world-class tattoo artist. Create a high-quality tattoo design based on the following request.
            
            User Request: "${promptText}"
            
            Style Guidelines:
            - The output must be a clear, high-resolution tattoo design on a clean background (white or parchment).
            - If reference images are provided, use them as strong inspiration for style, composition, or subject matter.
            - If the reference image looks like a rough sketch or a drawing over an existing image, refine it into a polished final tattoo design.
            - Do not include realistic skin backgrounds unless asked; focus on the design itself.` 
        }
        ];

        // Add reference images to the payload
        referenceImages.forEach((base64) => {
        parts.push({
            inlineData: {
            mimeType: 'image/png',
            data: base64
            }
        });
        });
        
        // Use a random seed for variation
        const randomSeed = Math.floor(Math.random() * 2147483647);

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: {
                seed: randomSeed
            }
        });
        return extractImageFromResponse(response);
    };

    // Execute generations in parallel
    const promises = Array.from({ length: count }, () => generateOne());
    const results = await Promise.all(promises);
    
    return results;

  } catch (error) {
    console.error("Gemini Design Error:", error);
    throw error;
  }
};

/**
 * Helper to generate fallback images when search fails to find direct URLs.
 * Generates 10 distinct styles to mimic a rich search result feed.
 */
const generateCreativeVariations = async (topic: string): Promise<string[]> => {
  const styles = [
    `Tattoo flash sheet of ${topic}, black and white, clean lines, white background`,
    `Realistic ${topic} tattoo on skin, high detail photo`,
    `Artistic ${topic} tattoo sketch, watercolor style, white background`,
    `Detailed ${topic} tattoo design, neo-traditional illustration, white background`,
    `Minimalist fine line tattoo design of ${topic}, simple, elegant`,
    `Geometric ${topic} tattoo design, sacred geometry elements, black ink`,
    `Old School American Traditional tattoo of ${topic}, bold lines, limited color palette`,
    `Japanese Irezumi style ${topic} tattoo design, detailed waves and clouds background`,
    `Dotwork and stippling style ${topic} tattoo design, intricate details`,
    `Trash Polka style ${topic} tattoo, chaotic black and red elements`
  ];

  const promises = styles.map(async (prompt) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] }
      });
      const b64 = extractImageFromResponse(response);
      return `data:image/png;base64,${b64}`;
    } catch (e) {
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is string => r !== null);
};

/**
 * Searches for tattoo inspiration. 
 * Uses Google Search first. If no images found, falls back to AI Generation to ensure visual results.
 */
export const searchInspiration = async (
  query: string,
  referenceImages: string[] = []
): Promise<{ text: string; images: string[]; sources: { title: string; uri: string }[] }> => {
  let images: string[] = [];
  let cleanText = "";
  let sources: { title: string; uri: string }[] = [];

  try {
    // 1. Try Google Search
    const model = 'gemini-2.5-flash';

    const parts: any[] = [
      {
        text: `You are a visual research assistant. The user wants to see "images of ${query}".
        
        ACTIONS:
        1. Search Google for "${query}".
        2. EXTRACT and LIST any direct image URLs you find in the search snippets.
        3. The URLs should ideally end in .jpg, .png, etc., but if you find source URLs for images, list them too.
        4. Do NOT describe the images.
        `
      }
    ];

    referenceImages.forEach((base64) => {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64
        }
      });
    });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const rawText = response.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || "";

    // Extract images with a broader regex
    const urlRegex = /(https?:\/\/[^\s<>"'()\[\]]+\.(?:jpg|jpeg|png|webp|gif))/gi;
    
    let match;
    while ((match = urlRegex.exec(rawText)) !== null) {
      if (!images.includes(match[1])) {
        images.push(match[1]);
      }
    }
    
    // Fallback: check for markdown images
    const mdRegex = /!\[.*?\]\((.*?)\)/g;
    while ((match = mdRegex.exec(rawText)) !== null) {
      if (!images.includes(match[1])) {
        images.push(match[1]);
      }
    }

    cleanText = rawText.replace(urlRegex, '').replace(mdRegex, '').trim();

    // Extract grounding sources
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || 'Source',
          uri: chunk.web.uri
        });
      }
    });

  } catch (error) {
    console.warn("Search step failed or returned no results, proceeding to fallback generation.");
  }

  // 2. CRITICAL FALLBACK: If no images found (common with text search tools), GENERATE them.
  if (images.length === 0) {
     const generated = await generateCreativeVariations(query);
     images.push(...generated);
     if (!cleanText) cleanText = `Here are some generated designs for "${query}".`;
  }

  return { text: cleanText, images, sources };
};

/**
 * Helper to extract image data from response
 */
const extractImageFromResponse = (response: any): string => {
  if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }
  }
  throw new Error("No image data found in response");
};

/**
 * Helper to convert Blob/File to Base64 (raw string without prefix)
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/xxx;base64, prefix
      const base64Clean = result.split(',')[1];
      resolve(base64Clean);
    };
    reader.onerror = error => reject(error);
  });
};