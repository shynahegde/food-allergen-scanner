import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { imageBase64, mediaType = 'image/jpeg' } = req.body
  if (!imageBase64) return res.status(400).json({ error: 'No image provided' })

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in environment' })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: `You are a food safety expert. Analyze this image of food packaging and extract the ingredient list.

Return a JSON object with this exact structure (no markdown, just raw JSON):
{
  "ingredientsText": "raw ingredient text found in image",
  "ingredients": ["ingredient1", "ingredient2", ...],
  "allergens": ["allergen1", "allergen2", ...],
  "isGlutenFree": true/false,
  "isVegan": true/false,
  "isDairyFree": true/false,
  "isNutFree": true/false,
  "warnings": ["warning1", "warning2", ...],
  "safeForDiet": ["diet1", "diet2", ...],
  "processedIngredients": ["ingredient1", ...],
  "highSugar": true/false,
  "confidence": "high/medium/low"
}

The 14 major allergens to check for: milk/dairy, eggs, fish, shellfish, tree nuts, peanuts, wheat/gluten, soybeans, sesame, mustard, celery, lupin, molluscs, sulphites.

If you cannot find an ingredient list in the image, return:
{"error": "No ingredient list found in image. Try scanning the back or side of the packaging."}`
            }
          ]
        }
      ]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(500).json({ error: 'Could not parse analysis result' })

    const result = JSON.parse(jsonMatch[0])
    if (result.error) return res.status(422).json({ error: result.error })

    return res.status(200).json(result)
  } catch (err: any) {
    console.error('Anthropic API error:', err)
    return res.status(500).json({ error: err.message || 'Analysis failed' })
  }
}
