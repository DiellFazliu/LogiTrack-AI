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
import { VectorStoreService } from './vector-store.service'; // ✅ import

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
    private vectorStore: VectorStoreService, // ✅ inject
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.groq = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
      this.logger.log('Groq API initialized successfully');
    } else {
      this.logger.warn('Groq API key not configured – using mock + RAG.');
    }
  }

  async optimizeRoute(dto: OptimizeRouteDto): Promise<OptimizeRouteResult> {
    // ... (e njëjta logjikë si më parë)
    const points = dto.points.map((p, i) => `${i + 1}. ${p.address}`).join('\n');
    const prompt = `Return ONLY JSON.\n\nOptimize delivery route:\n${points}\n\nRules:\n- Return valid JSON only\n- No explanations\n- No markdown\n\nFormat:\n{\n  "optimalOrder": [1,2,3],\n  "totalDistance": "string",\n  "totalTime": "string",\n  "recommendations": "string"\n}`;

    if (!this.groq) return this.getMockOptimization(dto);
    try {
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a strict JSON API. Output ONLY valid JSON. No text.' },
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

  private parseAndValidate(content: string | null | undefined, dto: OptimizeRouteDto): OptimizeRouteResult {
    if (!content) return this.getMockOptimization(dto);
    try {
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const result = OptimizeRouteSchema.safeParse(parsed);
      if (!result.success) return this.getMockOptimization(dto);
      return result.data;
    } catch {
      return this.getMockOptimization(dto);
    }
  }

  // backend/src/modules/ai/ai.service.ts (inside AiService class)

  async chat(message: string): Promise<string> {
    // 1. Retrieve relevant context from vector store
    const relevant = await this.vectorStore.findSimilar(message, 3);
    const context = relevant.map(c => c.chunk.text).join('\n\n');

    // 2. If no Groq API key, use mock (also updated with friendly greetings)
    if (!this.groq) {
      if (relevant.length > 0) {
        return relevant[0].chunk.text;
      }
      return this.getMockChatResponse(message);
    }

    // 3. Build the friendly system prompt (replace your existing one with this)
    const systemPrompt = `You are a warm, friendly, and enthusiastic support assistant for LogiTrack, a logistics management platform.
    Always greet users with a positive, cheerful tone. Use occasional emojis (😊, 🚀, 👋) to make responses feel welcoming.
    Answer questions concisely but kindly. If you don't know something, say so politely and offer to help with other topics.

    Here is the context to answer the user's question:
    ${context || "No specific context found."}

    If the user greets you (hello, hi, hey, good morning), respond warmly and offer assistance.`;

    try {
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },   // ✅ new friendly prompt
          { role: 'user', content: message },
        ],
        temperature: 0.6,
      });
      return response.choices[0].message.content || this.getMockChatResponse(message);
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
    if (!optimization) throw new NotFoundException(`AI Optimization with ID ${id} not found`);
    if (updateDto.optimizedRoute !== undefined) optimization.optimizedRoute = updateDto.optimizedRoute;
    if (updateDto.savedDistanceKm !== undefined) optimization.savedDistanceKm = updateDto.savedDistanceKm;
    if (updateDto.savedTimeMin !== undefined) optimization.savedTimeMin = updateDto.savedTimeMin;
    if (updateDto.confidenceScore !== undefined) optimization.confidenceScore = updateDto.confidenceScore;
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
    if (msg.includes('logout') || msg.includes('sign out')) return 'To log out, click your avatar in the top‑right corner and select "Logout".';
    if (msg.includes('login') || msg.includes('sign in')) return 'Login at /login with your email and password.';
    if (msg.includes('forgot password')) return 'Click "Forgot Password" on the login page to reset your password.';
    if (msg.includes('change password')) return 'Go to Profile → Change Password.';
    if (msg.includes('shipment')) return 'You can create, track, and manage shipments. Use the "Create Shipment" page.';
    if (msg.includes('driver')) return 'Add drivers from Drivers page. Assign them to shipments.';
    if (msg.includes('vehicle')) return 'Manage your fleet from Vehicles page.';
    if (msg.includes('report')) return 'Reports provide statistics and analytics. Generate custom reports.';
    if (msg.includes('route optimizer')) return 'The AI Route Optimizer helps you plan delivery routes efficiently.';
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('greetings') || msg.includes('good morning') || msg.includes('good afternoon')) {
    const friendlyGreetings = [
      "👋 Hey there! Welcome to LogiTrack! I'm your friendly AI assistant. 😊\n\nNeed help with something? I can assist with shipments, drivers, vehicles, reports, AI route optimization, and more. Just ask!",
      "Hi! 👋 Great to see you! I'm your LogiTrack assistant. How can I make your day easier?",
      "Hello! 🌟 I'm here to help you manage your logistics smoothly. What would you like to know about LogiTrack?",
      "Hey! 👋 Ready to optimize your deliveries? I can help with any LogiTrack feature – from creating shipments to using the AI route optimizer. Shoot your question!"
    ];
    return friendlyGreetings[Math.floor(Math.random() * friendlyGreetings.length)];
  }
    return 'I can help with LogiTrack features. Please ask about shipments, drivers, vehicles, reports, or AI route optimization.';
  }
}