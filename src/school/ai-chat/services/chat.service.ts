import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DocumentProcessingService } from './document-processing.service';
import { PineconeService } from './pinecone.service';
import { EmbeddingService } from './embedding.service';
import OpenAI from 'openai';
import { 
  SendMessageDto, 
  ChatMessageResponseDto, 
  CreateConversationDto, 
  ConversationResponseDto,
  GetChatHistoryDto 
} from '../dto/chat.dto';
import { User } from '@prisma/client';
import * as colors from 'colors';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly pineconeService: PineconeService,
    private readonly embeddingService: EmbeddingService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private readonly MATERIAL_SYSTEM_PROMPT = `
  You are a professional teacher and subject‑matter expert. You teach with absolute confidence and authority.

  Your job is to teach using the uploaded material as your primary source. You KNOW the content because you have direct access to it. Answer questions with certainty and authority.

  Communication style:
  - Be direct, confident, and authoritative. NEVER hedge or use uncertain language.
  - STRICTLY FORBIDDEN phrases: "it looks like", "it seems", "appears", "might", "I think", "I believe", "likely", "probably", "perhaps", "maybe", "could be", "might be", "seems to be", "looks like", "appears to be".
  - Use definitive statements: "This is...", "The chapter covers...", "This material explains...", "You will learn...".
  - Prefer imperative teacher language: "This chapter teaches...", "The material states...", "You need to understand...".
  - Start answers directly with facts, not disclaimers.
  - Keep answers concise but complete. Use bullets or short steps when helpful.
  - When a calculation or method is requested, show the minimal steps needed, then the result.
  - Use professional emojis appropriately to enhance clarity and engagement: 📚 for materials/chapters, 💡 for insights/tips, ✅ for confirmations, ⚠️ for warnings, 📝 for notes, 🔍 for analysis, 🎯 for key points, 📊 for data/stats, ⚡ for important concepts, 🚀 for next steps. Use emojis naturally and sparingly - 1-3 per response maximum.

  Grounding rules:
  - For content questions: State facts directly from the material. Use "The material states...", "According to this chapter...", "This chapter covers...".
  - For improvement/analysis questions: Provide confident professional guidance based on the material's structure and content.
  - For completely unrelated topics: Say "This question is outside the scope of this material" and redirect to the material.

  Behavior:
  - Act as a confident mentor. You KNOW the material, so teach it with authority.
  - If the student's question is vague, ask one concise clarifying question before proceeding.
  - Keep responses within 3–8 sentences unless the user explicitly requests more detail or steps.
  - Always start with what you KNOW from the material, not what you think or guess.

  Tone examples:
  - Good: "This chapter covers web development and AI integration in a 3-week intensive course. The program spans 21 days, requiring 4 to 6 hours daily commitment. It's designed for motivated beginners to intermediate developers."
  - Good: "This is a Level 1 workbook on number sense and basic algebra. Start with page 12: practice counting in tens; then attempt Exercise B. Use a number line to visualize jumps of ten."
  - FORBIDDEN: "It looks like you're referring to...", "It seems this chapter is about...", "This appears to be..."
`;

  private readonly GENERAL_SYSTEM_PROMPT = `
  You are a helpful AI assistant for educational purposes.
  You help school owners, teachers, and students with general questions and educational topics.
  Answer questions clearly and provide helpful explanations.
  Be encouraging and supportive in your responses.
  Keep your answers concise but complete when the user asks for specific amounts or detailed information.
  Use professional emojis appropriately to enhance clarity and engagement: 💡 for insights, ✅ for confirmations, ⚠️ for warnings, 📝 for notes, 🔍 for analysis, 🎯 for key points, 📊 for data, ⚡ for important concepts, 🚀 for next steps. Use emojis naturally and sparingly - 1-3 per response maximum.
  Note: If asked about very recent events (after October 2023), mention that your knowledge may be limited and suggest checking the latest sources.
`;

  /**
   * Extract user ID and fetch school ID from database
   * Handles both regular users and library users
   * For library users, creates a User record if it doesn't exist
   */
  private async extractUserData(user: any): Promise<{ userId: string; schoolId: string }> {
    const userId = user.id || user.sub;
    
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    
    // If school_id is already provided in user object (e.g., from gateway for library users), use it
    if (user.school_id) {
      // Still need to ensure User record exists for foreign key constraints
      await this.ensureUserRecordExists(userId, user.email, user.school_id, user.platform_id);
      return { userId, schoolId: user.school_id };
    }
    
    // Try to fetch from User table (for regular school users)
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { school_id: true }
    });
    
    if (userData && userData.school_id) {
      return { userId, schoolId: userData.school_id };
    }
    
    // If user not found in User table, check if it's a library user
    if (user.platform_id) {
      // Verify library user exists in LibraryResourceUser table
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { id: true, platformId: true, email: true, first_name: true, last_name: true, phone_number: true }
      });
      
      if (libraryUser) {
        // Library user exists - get or create default library school
        const librarySchool = await this.prisma.school.upsert({
          where: { school_email: 'library-chat@system.com' },
          update: {},
          create: {
            school_name: 'Library Chat System',
            school_email: 'library-chat@system.com',
            school_phone: '+000-000-0000',
            school_address: 'System Default',
            school_type: 'primary_and_secondary',
            school_ownership: 'private',
            status: 'approved',
          },
        });
        
        // Create User record for library user (required for ChatConversation foreign key)
        await this.ensureUserRecordExists(
          userId,
          libraryUser.email,
          librarySchool.id,
          user.platform_id,
          libraryUser.first_name,
          libraryUser.last_name,
          libraryUser.phone_number
        );
        
        return { userId, schoolId: librarySchool.id };
      }
    }
    
    // If we get here, user doesn't exist in either User or LibraryResourceUser table
    throw new Error('User not found in database');
  }

  /**
   * Ensure User record exists (for library users who need it for foreign key constraints)
   */
  private async ensureUserRecordExists(
    userId: string,
    email: string,
    schoolId: string,
    platformId?: string,
    firstName?: string | null,
    lastName?: string | null,
    phoneNumber?: string | null
  ): Promise<void> {
    try {
      // Check if User record already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        // Create minimal User record for library user
        await this.prisma.user.create({
          data: {
            id: userId, // Use the same ID as LibraryResourceUser
            email: email,
            school_id: schoolId,
            password: 'library-user-placeholder', // Placeholder - library users use LibraryResourceUser for auth
            first_name: firstName || 'Library',
            last_name: lastName || 'User',
            phone_number: phoneNumber || '+000-000-0000',
            role: 'student', // Default role
            status: 'active',
          },
        });
        this.logger.log(colors.cyan(`✅ Created User record for library user: ${userId}`));
      }
    } catch (error) {
      // If user already exists (race condition), that's fine
      if (error.code === 'P2002') {
        this.logger.log(colors.cyan(`ℹ️ User record already exists: ${userId}`));
      } else {
        this.logger.warn(colors.yellow(`⚠️ Could not ensure User record exists: ${error.message}`));
        // Don't throw - let it fail at conversation creation if needed
      }
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    user: User,
    createConversationDto: CreateConversationDto
  ): Promise<ConversationResponseDto> {
    try {
      const { userId, schoolId } = await this.extractUserData(user);
      
      this.logger.log(colors.blue(`💬 Creating new conversation for user: ${userId}`));
      
      // Validate material_id if provided - check PDFMaterial, LibraryGeneralMaterial, and LibraryGeneralMaterialChapterFile
      let materialId: string | null = null;
      let isLibraryMaterial = false;
      
      if (createConversationDto.materialId) {
        try {
          // First check PDFMaterial (school materials)
          const pdfMaterial = await this.prisma.pDFMaterial.findUnique({
            where: { id: createConversationDto.materialId },
            select: { id: true, schoolId: true },
          });
          
          if (pdfMaterial && pdfMaterial.schoolId === schoolId) {
            materialId = pdfMaterial.id;
            this.logger.log(colors.green(`✅ PDF Material validated: ${materialId}`));
          } else {
            // Check LibraryGeneralMaterial
            const libraryMaterial = await this.prisma.libraryGeneralMaterial.findUnique({
              where: { id: createConversationDto.materialId },
              select: { id: true, platformId: true },
            });
            
            if (libraryMaterial) {
              isLibraryMaterial = true;
              // Library material exists but ChatConversation requires PDFMaterial foreign key
              // So we set material_id to null but proceed (material exists, just different table)
              this.logger.log(colors.cyan(`📚 Library Material found: ${libraryMaterial.id}, using general chat (library materials not linked to ChatConversation)`));
              materialId = null;
            } else {
              // Check LibraryGeneralMaterialChapterFile
              const libraryChapterFile = await this.prisma.libraryGeneralMaterialChapterFile.findUnique({
                where: { id: createConversationDto.materialId },
                select: { id: true, platformId: true },
              });
              
              if (libraryChapterFile) {
                isLibraryMaterial = true;
                this.logger.log(colors.cyan(`📚 Library Chapter File found: ${libraryChapterFile.id}, using general chat (library materials not linked to ChatConversation)`));
                materialId = null;
              } else {
                this.logger.warn(colors.yellow(`⚠️ Material not found in PDFMaterial, LibraryGeneralMaterial, or LibraryGeneralMaterialChapterFile, using general chat`));
                materialId = null;
              }
            }
          }
        } catch (error) {
          this.logger.warn(colors.yellow(`⚠️ Error validating material: ${error.message}, using general chat`));
          materialId = null;
        }
      }

      const conversation = await this.prisma.chatConversation.create({
        data: {
          user_id: userId,
          school_id: schoolId,
          material_id: materialId,
          title: createConversationDto.title || 'New Conversation',
          system_prompt: materialId ? this.MATERIAL_SYSTEM_PROMPT : this.GENERAL_SYSTEM_PROMPT,
          status: 'ACTIVE',
          total_messages: 0,
        },
      });

      this.logger.log(colors.green(`✅ Conversation created: ${conversation.id}`));

      return {
        id: conversation.id,
        title: conversation.title || 'New Conversation',
        chatTitle: conversation.title || 'New Conversation',
        status: conversation.status,
        materialId: conversation.material_id,
        totalMessages: conversation.total_messages,
        lastActivity: conversation.last_activity.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error creating conversation: ${error.message}`));
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    user: User,
    sendMessageDto: SendMessageDto
  ): Promise<ChatMessageResponseDto> {
    const startTime = Date.now();
    
    try {
      const { userId, schoolId } = await this.extractUserData(user);
      
      this.logger.log(colors.blue(`💬 Processing message from user: ${userId}`));
      
      this.logger.log(colors.blue(`💬 Send Message Dto: ${JSON.stringify(sendMessageDto, null, 2)}`));

      // Get or create conversation
      let conversation = await this.getOrCreateConversation(
        user,
        sendMessageDto.conversationId,
        sendMessageDto.materialId
      );

      // Use conversation's material_id (validated - will be null for library materials)
      const validatedMaterialId = (conversation as any).material_id || null;

      // Save user message
      const userMessage = await this.prisma.chatMessage.create({
        data: {
          conversation_id: conversation.id,
          user_id: userId,
          school_id: schoolId,
          material_id: validatedMaterialId, // Use validated material_id from conversation
          role: 'USER',
          content: sendMessageDto.message,
          message_type: 'TEXT',
        },
      });

      // Get relevant context chunks if material is specified
      // Works for both PDFMaterial and LibraryGeneralMaterial (both stored in Pinecone)
      let contextChunks: any[] = [];
      const materialIdToSearch = validatedMaterialId || sendMessageDto.materialId;
      
      if (materialIdToSearch) {
        try {
          // Search Pinecone - works for both PDFMaterial and LibraryGeneralMaterial
          // Pinecone stores chunks with material_id filter, regardless of source table
          contextChunks = await this.documentProcessingService.searchRelevantChunks(
            materialIdToSearch,
            sendMessageDto.message,
            5
          );
          
          if (contextChunks.length > 0) {
            this.logger.log(colors.green(`✅ Found ${contextChunks.length} relevant chunks from material`));
          } else {
            this.logger.log(colors.yellow(`⚠️ No chunks found for material: ${materialIdToSearch}`));
          }
        } catch (error) {
          this.logger.warn(colors.yellow(`⚠️ Could not search chunks: ${error.message}`));
          contextChunks = [];
        }
      }

      // Generate AI response
      const systemPrompt = (conversation as any).material_id ? this.MATERIAL_SYSTEM_PROMPT : this.GENERAL_SYSTEM_PROMPT;
      const aiResponse = await this.generateAIResponse(
        sendMessageDto.message,
        contextChunks,
        systemPrompt,
        (conversation as any).material_id ? await this.getConversationHistory(conversation.id, 50, userId) : [],
        Boolean((conversation as any).material_id)
      );

      // Generate chat title for new conversations (first message)
      let chatTitle: string | null = null;
      this.logger.log(colors.cyan(`📝 Checking if should generate title. Total messages: ${(conversation as any).total_messages}`));
      
      // Check if this is a new conversation (total_messages is 0 or undefined, and no existing title)
      const isNewConversation = ((conversation as any).total_messages === 0 || (conversation as any).total_messages === undefined) && 
                                (!conversation.title || conversation.title === 'New Conversation' || conversation.title === 'General Chat');
      
      if (isNewConversation) {
        this.logger.log(colors.cyan(`📝 Generating chat title for first message: "${sendMessageDto.message}"`));
        chatTitle = await this.generateChatTitle(sendMessageDto.message);
        
        // Update conversation with the generated title
        await this.prisma.chatConversation.update({
          where: { id: conversation.id },
          data: { title: chatTitle }
        });
        this.logger.log(colors.green(`✅ Updated conversation title to: "${chatTitle}"`));
      } else {
        this.logger.log(colors.cyan(`📝 Skipping title generation - not first message`));
      }

      // Save AI message
      const refinedContent = this.refineTone(aiResponse.content);

      const aiMessage = await this.prisma.chatMessage.create({
        data: {
          conversation_id: conversation.id,
          user_id: userId,
          school_id: schoolId,
          material_id: validatedMaterialId, // Use validated material_id from conversation
          role: 'ASSISTANT',
          content: refinedContent,
          message_type: 'TEXT',
          model_used: 'gpt-4o-mini',
          tokens_used: aiResponse.tokensUsed,
          response_time_ms: Date.now() - startTime,
          context_chunks: contextChunks.map(chunk => chunk.id),
          context_summary: contextChunks.length > 0 ? 
            `Found ${contextChunks.length} relevant chunks from the document` : null,
        },
      });

      // Update conversation
      await this.prisma.chatConversation.update({
        where: { id: conversation.id },
        data: {
          total_messages: ((conversation as any).total_messages || 0) + 2, // User + AI message
          last_activity: new Date(),
        },
      });

      // Update user token usage
      await this.updateUserTokenUsage(userId, aiResponse.tokensUsed);

      // Save context relationships
      if (contextChunks.length > 0) {
        await this.saveContextRelationships(aiMessage.id, contextChunks, conversation.id, schoolId);
      }

      const responseTime = Date.now() - startTime;
      this.logger.log(colors.green(`✅ Message processed in ${responseTime}ms`));

      // Get user data for plan lookup
      const userData = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      // Get school's subscription plan
      const subscriptionPlan = await this.prisma.platformSubscriptionPlan.findUnique({
        where: { school_id: schoolId }
      });

      // Get updated usage limits (merged with plan limits)
      const usageLimits = await this.getUserUsageLimits(userId, schoolId, userData?.role || 'student', subscriptionPlan);

      return {
        id: aiMessage.id,
        content: aiMessage.content,
        role: aiMessage.role,
        conversationId: aiMessage.conversation_id || '',
        materialId: aiMessage.material_id,
        chatTitle: chatTitle, // Include generated title
        contextChunks: contextChunks.map((chunk: any) => ({
          id: chunk.id,
          content: chunk.content.substring(0, 200) + '...', // Truncate for response
          similarity: chunk.similarity,
          chunkType: chunk.chunk_type,
        })),
        tokensUsed: aiMessage.tokens_used,
        responseTimeMs: aiMessage.response_time_ms,
        createdAt: aiMessage.createdAt.toISOString(),
        usageLimits: usageLimits, // Include usage limits after every message
      };

    } catch (error) {
      this.logger.error(colors.red(`❌ Error processing message: ${error.message}`));
      throw new Error(`Failed to process message: ${error.message}`);
    }
  }

  /**
   * Get conversation history
   */
  async getChatHistory(
    user: User,
    conversationId: string,
    getChatHistoryDto: GetChatHistoryDto
  ): Promise<{ conversationHistory: ChatMessageResponseDto[]; usageLimits: any }> {

    this.logger.log(colors.blue(`💬 Getting chat history for conversation: ${conversationId}`));

    try {
      const { userId } = await this.extractUserData(user);
      
      const limit = parseInt((getChatHistoryDto.limit || 25).toString());
      const offset = parseInt((getChatHistoryDto.offset || 0).toString());
      
      this.logger.log(colors.cyan(`📖 Loading conversation history - Limit: ${limit}, Offset: ${offset}`));
      
      // Get conversation history
      const messages = await this.prisma.chatMessage.findMany({
        where: {
          conversation_id: conversationId,
          user_id: userId,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      this.logger.log(
        colors.green(`✅ Conversation history loaded: ${messages.length} messages found for conversation ${conversationId}`)
      );

      const conversationHistory = messages.map(message => ({
        id: message.id,
        content: message.content,
        role: message.role,
        conversationId: message.conversation_id || conversationId, // Use conversationId from query if null
        materialId: message.material_id,
        tokensUsed: message.tokens_used,
        responseTimeMs: message.response_time_ms,
        createdAt: message.createdAt.toISOString(),
      }));

      // Get user data for plan lookup
      const { schoolId } = await this.extractUserData(user);
      const userData = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      // Get school's subscription plan
      const subscriptionPlan = await this.prisma.platformSubscriptionPlan.findUnique({
        where: { school_id: schoolId }
      });

      // Get usage limits (merged with plan limits)
      const usageLimits = await this.getUserUsageLimits(userId, schoolId, userData?.role || 'student', subscriptionPlan);

      return {
        conversationHistory: conversationHistory as ChatMessageResponseDto[],
        usageLimits
      };

    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting chat history: ${error.message}`));
      throw new Error(`Failed to get chat history: ${error.message}`);
    }
  }

  /**
   * Get user's usage limits (merged with subscription plan limits)
   */
  private async getUserUsageLimits(
    userId: string,
    schoolId: string,
    userRole: string,
    subscriptionPlan: any
  ): Promise<any> {
    try {
      this.logger.log(colors.blue(`📊 Fetching usage limits for user: ${userId}`));

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          filesUploadedThisMonth: true,
          totalFilesUploadedAllTime: true,
          totalStorageUsedMB: true,
          maxFilesPerMonth: true,
          maxFileSizeMB: true,
          maxStorageMB: true,
          tokensUsedThisWeek: true,
          tokensUsedThisDay: true,
          tokensUsedAllTime: true,
          maxTokensPerWeek: true,
          maxTokensPerDay: true,
          lastFileResetDate: true,
          lastTokenResetDateAllTime: true,
        }
      });

      if (!user) {
        this.logger.error(colors.red(`❌ User not found: ${userId}`));
        throw new Error('User not found');
      }

      // Determine max document uploads based on role and plan
      let maxDocumentUploadsPerDay: number;
      if (subscriptionPlan) {
        if (userRole === 'student') {
          maxDocumentUploadsPerDay = subscriptionPlan.max_document_uploads_per_student_per_day || 3;
        } else if (userRole === 'teacher') {
          maxDocumentUploadsPerDay = subscriptionPlan.max_document_uploads_per_teacher_per_day || 10;
        } else {
          maxDocumentUploadsPerDay = subscriptionPlan.max_document_uploads_per_teacher_per_day || 10;
        }
      } else {
        // Defaults if no plan
        maxDocumentUploadsPerDay = userRole === 'student' ? 3 : 10;
      }

      // Use plan limits where available, fallback to user model defaults
      const usageLimits = {
        filesUploadedThisMonth: user.filesUploadedThisMonth,
        totalFilesUploadedAllTime: user.totalFilesUploadedAllTime,
        totalStorageUsedMB: user.totalStorageUsedMB,
        maxFilesPerMonth: subscriptionPlan?.max_files_per_month ?? user.maxFilesPerMonth,
        maxFileSizeMB: subscriptionPlan?.max_file_size_mb ?? user.maxFileSizeMB,
        maxStorageMB: subscriptionPlan?.max_storage_mb ?? user.maxStorageMB,
        tokensUsedThisWeek: user.tokensUsedThisWeek,
        tokensUsedThisDay: user.tokensUsedThisDay,
        tokensUsedAllTime: user.tokensUsedAllTime,
        maxTokensPerWeek: subscriptionPlan?.max_weekly_tokens_per_user ?? user.maxTokensPerWeek,
        maxTokensPerDay: subscriptionPlan?.max_daily_tokens_per_user ?? user.maxTokensPerDay,
        maxDocumentUploadsPerDay: maxDocumentUploadsPerDay,
        lastFileResetDate: user.lastFileResetDate.toISOString(),
        lastTokenResetDate: user.lastTokenResetDateAllTime.toISOString(),
      };

      this.logger.log(colors.green(`✅ Retrieved usage limits for user (plan: ${subscriptionPlan?.plan_type || 'none'})`));
      return usageLimits;

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching usage limits: ${error.message}`));
      throw new Error(`Failed to fetch usage limits: ${error.message}`);
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(user: User): Promise<ConversationResponseDto[]> {
    try {
      const { userId } = await this.extractUserData(user);
      
      const conversations = await this.prisma.chatConversation.findMany({
        where: {
          user_id: userId,
        },
        orderBy: { last_activity: 'desc' },
        take: 50,
      });

      return conversations.map(conversation => ({
        id: conversation.id,
        title: conversation.title,
        chatTitle: conversation.title, // Alias for clarity
        status: conversation.status,
        materialId: conversation.material_id,
        totalMessages: conversation.total_messages,
        lastActivity: conversation.last_activity.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      }));

    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting conversations: ${error.message}`));
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  /**
   * Get or create conversation
   */
  private async getOrCreateConversation(
    user: User,
    conversationId?: string,
    materialId?: string
  ) {
    const { userId, schoolId } = await this.extractUserData(user);
    
    if (conversationId) {
      const conversation = await this.prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          user_id: userId,
        },
      });

      if (conversation) {
        return conversation;
      }
    }

    // Create new conversation
    return this.createConversation(user, {
      materialId,
      title: materialId ? 'Document Chat' : 'General Chat',
    });
  }

  /**
   * Generate chat title based on first message
   */
  private async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a short, descriptive title (max 5 words) for this conversation based on the user\'s first message. Return only the title, nothing else.'
          },
          {
            role: 'user',
            content: firstMessage
          }
        ],
        max_tokens: 20,
        temperature: 0.3,
      });

      const title = response.choices[0].message.content?.trim() || 'New Chat';
      this.logger.log(colors.cyan(`📝 Generated chat title: "${title}"`));
      return title;

    } catch (error) {
      this.logger.error(colors.red(`❌ Error generating chat title: ${error.message}`));
      return 'New Chat';
    }
  }

  /**
   * Generate AI response using OpenAI
   */
  private async generateAIResponse(
    userMessage: string,
    contextChunks: any[],
    systemPrompt: string,
    conversationHistory: any[],
    isMaterialChat: boolean
  ): Promise<{ content: string; tokensUsed: number }> {
    try {
      // Build context from chunks
      const context = contextChunks.length > 0 
        ? `\n\nRelevant document context:\n${contextChunks.map(chunk => 
            `- ${chunk.content.substring(0, 500)}...`
          ).join('\n')}`
        : '';

      // Build conversation history
      const history = conversationHistory.map(msg => 
        `${msg.role}: ${msg.content}`
      ).join('\n');

      // Log conversation history being sent to ChatGPT
      this.logger.log(colors.cyan(`📚 Conversation history (${conversationHistory.length} messages):`));
      if (conversationHistory.length > 0) {
        // conversationHistory.forEach((msg, index) => {
        //   this.logger.log(colors.cyan(`   ${index + 1}. ${msg.role.toUpperCase()}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`));
        // });
      } else {
        this.logger.log(colors.cyan(`   No previous conversation history`));
      }

      const messages = [
        { role: 'system', content: systemPrompt + context },
        ...(history ? [{ role: 'user', content: `Previous conversation:\n${history}` }] : []),
        { role: 'user', content: userMessage },
      ];

      // Log the complete prompt being sent to ChatGPT
      this.logger.log(colors.cyan(`🤖 Full prompt being sent to ChatGPT:`));
      // messages.forEach((msg, index) => {
      //   this.logger.log(colors.cyan(`   ${index + 1}. ${msg.role.toUpperCase()}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`));
      // });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages as any,
        max_tokens: 4000,
        temperature: isMaterialChat ? 0.25 : 0.7,
      });

      return {
        content: response.choices[0].message.content || 'I apologize, but I could not generate a response.',
        tokensUsed: response.usage?.total_tokens || 0,
      };

    } catch (error) {
      this.logger.error(colors.red(`❌ Error generating AI response: ${error.message}`));
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  /**
   * Get conversation history for context
   */
  private async getConversationHistory(conversationId: string, limit: number, userId?: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { 
        conversation_id: conversationId,
        ...(userId && { user_id: userId })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return messages.reverse(); // Return in chronological order
  }

  /**
   * Update user token usage counters
   */
  private async updateUserTokenUsage(userId: string, tokensUsed: number) {
    try {
      this.logger.log(colors.blue(`📊 Updating token usage for user: ${userId}, tokens: ${tokensUsed}`));

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      // Get current user data
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          tokensUsedThisDay: true,
          tokensUsedThisWeek: true,
          tokensUsedAllTime: true,
          lastTokenResetDateAllTime: true,
        }
      });

      if (!user) {
        console.log('User not found for token update: ', userId);
        this.logger.error(colors.red(`❌ User not found for token update: ${userId}`));
        return;
      }

      // Check if we need to reset daily/weekly counters
      const shouldResetDaily = user.lastTokenResetDateAllTime < startOfDay;
      const shouldResetWeekly = user.lastTokenResetDateAllTime < startOfWeek;

      // Calculate new values
      const newDailyTokens = shouldResetDaily ? tokensUsed : (user.tokensUsedThisDay || 0) + tokensUsed;
      const newWeeklyTokens = shouldResetWeekly ? tokensUsed : (user.tokensUsedThisWeek || 0) + tokensUsed;
      const newAllTimeTokens = (user.tokensUsedAllTime || 0) + tokensUsed;
      // Update user token usage
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          tokensUsedThisDay: newDailyTokens,
          tokensUsedThisWeek: newWeeklyTokens,
          tokensUsedAllTime: newAllTimeTokens,
          lastTokenResetDateAllTime: today,
        }
      });

      // log previous values
      this.logger.log(colors.cyan(`📊 Previous token usage - Daily: ${user.tokensUsedThisDay}, Weekly: ${user.tokensUsedThisWeek}, All-time: ${user.tokensUsedAllTime}`));

      this.logger.log(colors.green(`✅ Updated token usage - Daily: ${newDailyTokens}, Weekly: ${newWeeklyTokens}, All-time: ${newAllTimeTokens}`));

    } catch (error) {
      this.logger.error(colors.red(`❌ Error updating token usage: ${error.message}`));
    }
  }

  /**
   * Refine tone to remove hedging and start decisively
   */
  private refineTone(text: string): string {
    if (!text) return text;

    let refined = text;

    // Remove common hedging phrases with more aggressive replacements
    const hedges = [
      // "it looks like" -> direct statement
      /\bit looks like\s+/gi,
      /\bit seems like\s+/gi,
      /\bit appears that\s+/gi,
      /\bit seems that\s+/gi,
      // "this appears to be" -> "this is"
      /\bthis (document|workbook|chapter|material) (appears to|seems to|might be)\s+/gi,
      /\b(it|this) (appears|seems|might|likely)\s+/gi,
      /\bI (think|believe)\s+/gi,
      /\bprobably\s+/gi,
      /\bperhaps\s+/gi,
      /\bmaybe\s+/gi,
      /\bcould be\s+/gi,
      /\bmight be\s+/gi,
    ];
    
    for (const h of hedges) {
      refined = refined.replace(h, '');
    }

    // Replace weak openings with confident statements
    refined = refined.replace(/^\s*(it looks like|it seems like|it appears that|it seems that)\s+/i, '');
    refined = refined.replace(/^\s*the (document|workbook|chapter|material) you provided\s+(is|appears to be|seems to be)\s*/iu, 'This material ');
    refined = refined.replace(/^\s*the (document|workbook|chapter|material)\s+(appears|seems)\s+to\s+be\s*/iu, 'This material is ');
    
    // Fix common patterns
    refined = refined.replace(/\b(you're referring to|you are referring to)\s+a\s+/gi, 'This ');
    refined = refined.replace(/\bbased on the context provided\s*[,:]\s*/gi, '');
    
    // Ensure sentences start with confidence
    refined = refined.replace(/^\.\s*/, ''); // Remove leading period if created
    refined = refined.replace(/^\s*,\s*/, ''); // Remove leading comma if created
    
    // Capitalize first letter if needed
    if (refined.length > 0 && refined[0] === refined[0].toLowerCase()) {
      refined = refined.charAt(0).toUpperCase() + refined.slice(1);
    }

    return refined.trim();
  }

  /**
   * Save context relationships
   */
  private async saveContextRelationships(
    messageId: string,
    contextChunks: any[],
    conversationId: string,
    schoolId: string
  ) {
    try {
      const contextData = contextChunks.map((chunk, index) => ({
        conversation_id: conversationId,
        message_id: messageId,
        chunk_id: chunk.id,
        school_id: schoolId,
        relevance_score: chunk.similarity,
        context_type: 'semantic',
        position_in_context: index,
      }));

      for (const context of contextData) {
        await this.prisma.chatContext.create({ data: context });
      }

    } catch (error) {
      this.logger.error(colors.red(`❌ Error saving context relationships: ${error.message}`));
    }
  }
}
