// backend/src/modules/ai/ai.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { OptimizeRouteDto } from './dto/optimize-route.dto';
import { CreateAiOptimizationDto, UpdateAiOptimizationDto } from './dto/ai-optimization.dto';
import { AiOptimization } from './ai-optimization.entity';
import { z } from 'zod';

export const OptimizeRouteSchema = z.object({
  optimalOrder: z.array(z.number().int()),
  totalDistance: z.string(),
  totalTime: z.string(),
  recommendations: z.string(),
});

type OptimizeRouteResult = z.infer<typeof OptimizeRouteSchema>;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private groq: OpenAI | null = null;

  constructor(
    private configService: ConfigService,
    @InjectRepository(AiOptimization)
    private aiOptimizationRepository: Repository<AiOptimization>,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (apiKey) {
      this.groq = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });

      this.logger.log('Groq API initialized successfully');
    } else {
      this.logger.warn('Groq API key not configured.');
    }
  }

  async optimizeRoute(dto: OptimizeRouteDto): Promise<OptimizeRouteResult> {
    const points = dto.points
      .map((p, i) => `${i + 1}. ${p.address}`)
      .join('\n');

    const prompt = `
Return ONLY JSON.

Optimize delivery route:

${points}

Rules:
- Return valid JSON only
- No explanations
- No markdown

Format:
{
  "optimalOrder": [1,2,3],
  "totalDistance": "string",
  "totalTime": "string",
  "recommendations": "string"
}
`;

    if (!this.groq) {
      return this.getMockOptimization(dto);
    }

    try {
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a strict JSON API. Output ONLY valid JSON. No text.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      });

      const content = response.choices[0].message.content;
      return this.parseAndValidate(content, dto);
    } catch (error) {
      this.logger.error('Groq optimizeRoute error:', error);
      return this.getMockOptimization(dto);
    }
  }

  private parseAndValidate(
    content: string | null | undefined,
    dto: OptimizeRouteDto,
  ): OptimizeRouteResult {
    if (!content) return this.getMockOptimization(dto);

    try {
      const cleaned = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      const result = OptimizeRouteSchema.safeParse(parsed);

      if (!result.success) {
        this.logger.warn('Zod validation failed, using fallback');
        return this.getMockOptimization(dto);
      }

      return result.data;
    } catch (err) {
      this.logger.warn('JSON parse failed, using fallback');
      return this.getMockOptimization(dto);
    }
  }

  async chat(message: string): Promise<string> {
    if (!this.groq) {
      return this.getMockChatResponse(message);
    }

    try {
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a logistics assistant. Be short, clear, and helpful.',
          },
          { role: 'user', content: message },
        ],
        temperature: 0.6,
      });

      return (
        response.choices[0].message.content ||
        this.getMockChatResponse(message)
      );
    } catch (error) {
      this.logger.error('Groq chat error:', error);
      return this.getMockChatResponse(message);
    }
  }

  async predictDelay(shipmentId: string) {
    return {
      shipmentId,
      delayProbability: 'Low (15%)',
      estimatedDelay: '0-15 minutes',
      reasons: ['Normal traffic conditions expected'],
    };
  }

  // ==================== AI OPTIMIZATION CRUD ====================

  async createOptimization(createDto: CreateAiOptimizationDto): Promise<AiOptimization> {
    const optimization = new AiOptimization();
    optimization.shipmentId = createDto.shipmentId;
    optimization.originalRoute = createDto.originalRoute;
    optimization.savedDistanceKm = null as any;
    optimization.savedTimeMin = null as any;
    optimization.confidenceScore = null as any;
    
    return this.aiOptimizationRepository.save(optimization);
  }

  async updateOptimization(id: string, updateDto: UpdateAiOptimizationDto): Promise<AiOptimization> {
    const optimization = await this.aiOptimizationRepository.findOne({ where: { id } });
    if (!optimization) {
      throw new NotFoundException(`AI Optimization with ID ${id} not found`);
    }
    
    if (updateDto.optimizedRoute !== undefined) {
      optimization.optimizedRoute = updateDto.optimizedRoute;
    }
    if (updateDto.savedDistanceKm !== undefined) {
      optimization.savedDistanceKm = updateDto.savedDistanceKm;
    }
    if (updateDto.savedTimeMin !== undefined) {
      optimization.savedTimeMin = updateDto.savedTimeMin;
    }
    if (updateDto.confidenceScore !== undefined) {
      optimization.confidenceScore = updateDto.confidenceScore;
    }
    
    return this.aiOptimizationRepository.save(optimization);
  }

  async findOptimizationByShipment(shipmentId: string): Promise<AiOptimization | null> {
    return this.aiOptimizationRepository.findOne({
      where: { shipmentId },
      relations: ['shipment'],
    });
  }

  async findAllOptimizations(): Promise<AiOptimization[]> {
    return this.aiOptimizationRepository.find({
      relations: ['shipment'],
      order: { createdAt: 'DESC' },
    });
  }

  // ==================== MOCK METHODS ====================

  private getMockOptimization(dto: OptimizeRouteDto): OptimizeRouteResult {
    return {
      optimalOrder: dto.points.map((_, i) => i + 1),
      totalDistance: '45 km',
      totalTime: '1 hour 15 minutes',
      recommendations: 'Start early to avoid traffic',
    };
  }

  private getMockChatResponse(message: string): string {
    const msg = message.toLowerCase();

    if (msg.includes('track')) {
      return 'Use tracking number in dashboard.';
    }
    if (msg.includes('delay')) {
      return 'Delays depend on traffic and weather.';
    }
    if (msg.includes('cost')) {
      return 'Cost depends on distance and weight.';
    }

    return 'How can I help you?';
  }
}