import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import standardBuyout from '@/data/standard-buyout.json';

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Convert files to base64 for API
    const imageContents = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        
        if (file.type === 'application/pdf') {
          // For PDFs, we'll need to convert or use document parsing
          // For now, return as document
          return {
            type: 'document' as const,
            source: {
              type: 'base64' as const,
              media_type: 'application/pdf' as const,
              data: base64,
            },
          };
        }
        
        return {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: mediaType,
            data: base64,
          },
        };
      })
    );

    // Call Claude to parse the scope
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContents,
            {
              type: 'text',
              text: `You are a concrete construction expert analyzing a subcontract scope of work document.

Extract ALL items from this scope of work and categorize them.

Return a JSON object with this structure:
{
  "inclusions": [
    {
      "item_number": "1",
      "description": "Brief description of what's included",
      "keywords": ["keyword1", "keyword2"] // keywords that help identify buyout needs
    }
  ],
  "exclusions": [
    {
      "item_number": "1", 
      "description": "What's excluded",
      "provided_by": "Company/GC/Owner/etc"
    }
  ],
  "detected_buyout_items": [
    "Concrete",
    "Rebar",
    "Vapor barrier",
    // etc - list all materials/subs/equipment needed based on scope
  ],
  "detected_submittals": [
    {
      "item": "Mill certs",
      "trigger": "What in the scope requires this"
    }
  ],
  "special_requirements": [
    "Any special requirements like mockups, weather plans, etc"
  ]
}

Be thorough - extract EVERY line item from the scope.`,
            },
          ],
        },
      ],
    });

    // Parse Claude's response
    const claudeResponse = response.content[0];
    if (claudeResponse.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract JSON from response
    let parsedScope;
    try {
      const jsonMatch = claudeResponse.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedScope = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      console.error('Failed to parse Claude response:', claudeResponse.text);
      throw new Error('Failed to parse scope analysis');
    }

    // Compare against standard buyout list
    const buyoutItems = standardBuyout.standardBuyoutItems.map((item) => {
      const inScope = parsedScope.detected_buyout_items?.some(
        (detected: string) =>
          detected.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(detected.toLowerCase())
      );

      return {
        ...item,
        inScope: inScope || false,
      };
    });

    // Check for scope-specific items
    const scopeText = JSON.stringify(parsedScope).toLowerCase();
    const additionalItems: typeof buyoutItems = [];
    
    standardBuyout.scopeSpecificItems.forEach((scopeItem) => {
      const triggers = scopeItem.trigger.split('|');
      const found = triggers.some((t) => scopeText.includes(t.toLowerCase()));
      if (found) {
        additionalItems.push({
          id: 100 + additionalItems.length,
          name: scopeItem.item,
          category: 'Scope-Specific',
          submittalRequired: !!scopeItem.submittalType,
          submittalType: scopeItem.submittalType || undefined,
          inScope: true,
        });
      }
    });

    // Build submittal register
    const submittals = [
      ...buyoutItems
        .filter((item) => item.inScope && item.submittalRequired)
        .map((item) => ({
          item: item.name,
          type: item.submittalType || 'Product Data',
          status: 'Required' as const,
        })),
      ...additionalItems
        .filter((item) => item.submittalRequired)
        .map((item) => ({
          item: item.name,
          type: item.submittalType || 'Product Data',
          status: 'Required' as const,
        })),
      ...(parsedScope.detected_submittals || []).map((sub: { item: string }) => ({
        item: sub.item,
        type: 'Per Scope',
        status: 'Required' as const,
      })),
    ];

    // Build exclusions list
    const exclusions = (parsedScope.exclusions || []).map(
      (exc: { description: string; provided_by: string }) =>
        `${exc.description} (${exc.provided_by})`
    );

    // Build warnings for items that might be missed
    const warnings: string[] = [];
    
    // Check if standard items are NOT in scope but typically would be
    const criticalItems = ['Concrete', 'Rebar', 'Vapor Barrier', 'Formwork'];
    criticalItems.forEach((critical) => {
      const found = buyoutItems.find(
        (item) => item.name.toLowerCase().includes(critical.toLowerCase())
      );
      if (found && !found.inScope) {
        warnings.push(`${critical} not detected in scope - verify if included`);
      }
    });

    // Add special requirements as warnings
    if (parsedScope.special_requirements) {
      parsedScope.special_requirements.forEach((req: string) => {
        warnings.push(`Special requirement: ${req}`);
      });
    }

    return NextResponse.json({
      projectName: 'New Project', // Could extract from scope
      buyoutItems: [...buyoutItems, ...additionalItems],
      submittals,
      exclusions,
      warnings,
      rawAnalysis: parsedScope,
    });
  } catch (error) {
    console.error('Error parsing scope:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse scope' },
      { status: 500 }
    );
  }
}
