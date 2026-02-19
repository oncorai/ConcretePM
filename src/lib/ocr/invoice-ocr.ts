import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<string | null> {
  if (!openai) {
    console.log('OpenAI API key not configured, skipping OCR');
    return null;
  }

  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this invoice image. Include all details like vendor name, invoice number, dates, item descriptions, quantities, and prices. Format it as plain text."
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ],
      max_tokens: 2000
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('OCR error:', error);
    return null;
  }
}

// Alternative: Use a free OCR service or library
export async function extractTextFromImageFallback(imageBuffer: Buffer): Promise<string | null> {
  // For now, return null - in production you could use:
  // - Tesseract.js (free, runs locally)
  // - Google Cloud Vision API
  // - AWS Textract
  // - Azure Computer Vision
  return null;
}