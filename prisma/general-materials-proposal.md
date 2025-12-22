# Library General Materials - Schema Proposal

## Overview
This document proposes a new model structure for **Library General Materials** - standalone ebooks/textbooks that can be sold and have AI chat capabilities. These materials are NOT tied to the educational hierarchy (class/subject/topic).

## Why a Separate Model?

1. **Different Use Case**: E-commerce (selling books) vs Educational content (free resources)
2. **Different Structure**: Needs chapters for AI chunking (textbooks are long documents)
3. **Different Fields**: Price, purchase status, sales tracking
4. **Standalone**: Not tied to class/subject/topic hierarchy
5. **AI Chat Ready**: Built-in chapter structure for better AI understanding

## Proposed Schema Structure

### 1. LibraryGeneralMaterial (The Book/Textbook)
```prisma
model LibraryGeneralMaterial {
  id           String  @id @default(cuid())
  platformId   String
  uploadedById String

  // Basic Info
  title        String
  description  String?
  author       String?
  isbn         String?
  publisher    String?
  
  // File Info
  materialType LibraryMaterialType @default(PDF)
  url          String // Main file URL
  s3Key        String? // S3 object key
  sizeBytes    Int?
  pageCount    Int?
  thumbnailUrl String?
  thumbnailS3Key String?

  // E-commerce Fields
  price        Float?  // Price in platform currency (null = free)
  currency     String? @default("NGN") // Currency code
  isFree       Boolean @default(false)
  isAvailable  Boolean @default(true) // For inventory management
  
  // Optional Educational Attachment (for categorization)
  classId      String? // Optional - can be attached to a class for organization
  subjectId    String? // Optional - can be attached to a subject for organization
  
  // AI Chat Support
  isAiEnabled  Boolean @default(false) // Whether AI chat is enabled
  processingStatus MaterialProcessingStatus @default(PENDING)
  
  // Metadata
  status       LibraryContentStatus @default(published)
  order        Int                  @default(1)
  views        Int                  @default(0)
  downloads    Int                  @default(0)
  salesCount   Int                  @default(0) // Number of purchases
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  platform     LibraryPlatform              @relation(fields: [platformId], references: [id])
  uploadedBy   LibraryResourceUser          @relation(fields: [uploadedById], references: [id])
  class        LibraryClass?               @relation(fields: [classId], references: [id])
  subject      LibrarySubject?              @relation(fields: [subjectId], references: [id])
  
  // Chapters for AI chunking
  chapters     LibraryGeneralMaterialChapter[]
  
  // Processing & AI
  processing   LibraryGeneralMaterialProcessing?
  chunks       LibraryGeneralMaterialChunk[]
  
  // Purchases
  purchases    LibraryGeneralMaterialPurchase[]
  
  // Chat conversations
  chatConversations LibraryGeneralMaterialChatConversation[]

  @@index([platformId])
  @@index([uploadedById])
  @@index([classId])
  @@index([subjectId])
  @@index([status])
  @@index([isAiEnabled])
  @@index([price])
  @@index([createdAt])
}
```

### 2. LibraryGeneralMaterialChapter (Chapters for AI Chunking)
```prisma
model LibraryGeneralMaterialChapter {
  id           String  @id @default(cuid())
  materialId   String
  platformId   String

  title        String
  description  String?
  pageStart    Int?    // Starting page number
  pageEnd      Int?     // Ending page number
  order        Int      @default(1)
  
  // AI Processing
  isProcessed  Boolean  @default(false)
  chunkCount   Int      @default(0)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  material     LibraryGeneralMaterial @relation(fields: [materialId], references: [id], onDelete: Cascade)
  platform     LibraryPlatform        @relation(fields: [platformId], references: [id])
  chunks       LibraryGeneralMaterialChunk[]

  @@index([materialId])
  @@index([platformId])
  @@index([order])
}
```

### 3. LibraryGeneralMaterialProcessing (AI Processing Status)
```prisma
model LibraryGeneralMaterialProcessing {
  id                      String                   @id @default(cuid())
  materialId              String                   @unique
  platformId              String
  
  status                  MaterialProcessingStatus @default(PENDING)
  totalChunks             Int                      @default(0)
  processedChunks         Int                      @default(0)
  failedChunks            Int                      @default(0)
  
  processingStartedAt     DateTime?
  processingCompletedAt   DateTime?
  errorMessage            String?
  retryCount              Int                      @default(0)
  
  vectorDatabaseId        String?
  embeddingModel          String?
  
  createdAt               DateTime                 @default(now())
  updatedAt               DateTime                 @updatedAt

  material                LibraryGeneralMaterial   @relation(fields: [materialId], references: [id], onDelete: Cascade)
  platform                LibraryPlatform         @relation(fields: [platformId], references: [id])
  chunks                  LibraryGeneralMaterialChunk[]

  @@index([platformId])
  @@index([status])
}
```

### 4. LibraryGeneralMaterialChunk (AI Chunks)
```prisma
model LibraryGeneralMaterialChunk {
  id                     String                @id @default(cuid())
  materialId             String
  chapterId              String?
  processingId           String
  platformId             String
  
  content                String
  chunkType              ChunkType             @default(TEXT)
  pageNumber             Int?
  sectionTitle           String?
  embedding              Unsupported("vector") // Vector embedding for AI
  embeddingModel         String
  tokenCount             Int                   @default(0)
  wordCount              Int                   @default(0)
  orderIndex             Int
  keywords               String[]              @default([])
  summary                String?
  
  createdAt              DateTime              @default(now())
  updatedAt              DateTime              @updatedAt

  material               LibraryGeneralMaterial        @relation(fields: [materialId], references: [id], onDelete: Cascade)
  chapter                LibraryGeneralMaterialChapter? @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  processing             LibraryGeneralMaterialProcessing @relation(fields: [processingId], references: [id], onDelete: Cascade)
  platform               LibraryPlatform               @relation(fields: [platformId], references: [id])

  @@index([materialId])
  @@index([chapterId])
  @@index([processingId])
  @@index([platformId])
  @@index([orderIndex])
}
```

### 5. LibraryGeneralMaterialPurchase (Purchase Tracking)
```prisma
model LibraryGeneralMaterialPurchase {
  id           String   @id @default(cuid())
  materialId   String
  userId       String   // Regular User ID (student/parent who purchased)
  platformId   String
  
  price        Float
  currency     String   @default("NGN")
  paymentMethod String? // e.g., "card", "bank_transfer", "wallet"
  transactionId String? // External payment transaction ID
  
  status       PurchaseStatus @default(PENDING) // PENDING, COMPLETED, FAILED, REFUNDED
  
  purchasedAt  DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  material     LibraryGeneralMaterial @relation(fields: [materialId], references: [id])
  user         User                   @relation(fields: [userId], references: [id])
  platform     LibraryPlatform        @relation(fields: [platformId], references: [id])

  @@index([materialId])
  @@index([userId])
  @@index([platformId])
  @@index([status])
  @@index([purchasedAt])
}
```

### 6. LibraryGeneralMaterialChatConversation (AI Chat)
```prisma
model LibraryGeneralMaterialChatConversation {
  id              String             @id @default(cuid())
  userId          String
  materialId      String
  platformId      String
  
  title           String?
  status          ConversationStatus @default(ACTIVE)
  systemPrompt    String?
  contextSummary  String?
  totalMessages   Int                @default(0)
  lastActivity    DateTime           @default(now())
  
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  user            User                        @relation(fields: [userId], references: [id])
  material        LibraryGeneralMaterial      @relation(fields: [materialId], references: [id])
  platform        LibraryPlatform             @relation(fields: [platformId], references: [id])
  messages        LibraryGeneralMaterialChatMessage[]
  contexts        LibraryGeneralMaterialChatContext[]

  @@index([userId])
  @@index([materialId])
  @@index([platformId])
  @@index([status])
}
```

### 7. LibraryGeneralMaterialChatMessage (Chat Messages)
```prisma
model LibraryGeneralMaterialChatMessage {
  id              String   @id @default(cuid())
  conversationId  String
  materialId      String
  userId          String
  
  role            MessageRole // USER, ASSISTANT, SYSTEM
  content         String
  tokensUsed      Int?
  model           String?
  
  // Context from chunks
  referencedChunks String[] // IDs of chunks used for context
  
  createdAt       DateTime @default(now())

  conversation    LibraryGeneralMaterialChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  material        LibraryGeneralMaterial                  @relation(fields: [materialId], references: [id])
  user            User                                    @relation(fields: [userId], references: [id])

  @@index([conversationId])
  @@index([materialId])
  @@index([userId])
  @@index([createdAt])
}
```

### 8. LibraryGeneralMaterialChatContext (Chat Context)
```prisma
model LibraryGeneralMaterialChatContext {
  id              String   @id @default(cuid())
  conversationId  String
  chunkId         String
  materialId      String
  
  relevanceScore  Float?
  createdAt       DateTime @default(now())

  conversation    LibraryGeneralMaterialChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  chunk           LibraryGeneralMaterialChunk           @relation(fields: [chunkId], references: [id])
  material        LibraryGeneralMaterial                @relation(fields: [materialId], references: [id])

  @@index([conversationId])
  @@index([chunkId])
  @@index([materialId])
}
```

## New Enums Needed

```prisma
enum PurchaseStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  CANCELLED
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

enum ConversationStatus {
  ACTIVE
  ARCHIVED
  DELETED
}
```

## Relations to Add to Existing Models

### LibraryPlatform
```prisma
generalMaterials LibraryGeneralMaterial[]
generalMaterialPurchases LibraryGeneralMaterialPurchase[]
generalMaterialChatConversations LibraryGeneralMaterialChatConversation[]
```

### LibraryResourceUser
```prisma
uploadedGeneralMaterials LibraryGeneralMaterial[]
```

### LibraryClass (Optional)
```prisma
generalMaterials LibraryGeneralMaterial[]
```

### LibrarySubject (Optional)
```prisma
generalMaterials LibraryGeneralMaterial[]
```

### User (Regular User Model)
```prisma
generalMaterialPurchases LibraryGeneralMaterialPurchase[]
generalMaterialChatConversations LibraryGeneralMaterialChatConversation[]
generalMaterialChatMessages LibraryGeneralMaterialChatMessage[]
```

## Benefits of This Structure

1. **Clear Separation**: Educational materials vs E-commerce materials
2. **AI-Ready**: Built-in chapter structure for better chunking
3. **E-commerce Ready**: Price, purchase tracking, sales analytics
4. **Flexible**: Can optionally attach to class/subject for organization
5. **Scalable**: Separate processing and chat infrastructure
6. **Reusable**: Similar pattern to existing PDFMaterial but for library

## Alternative: Extend Existing LibraryMaterial?

**Pros:**
- One model to maintain
- Less code duplication

**Cons:**
- Mixing concerns (educational vs e-commerce)
- subjectId is required (can't be standalone)
- No chapter structure for AI chunking
- Hard to add e-commerce fields without breaking existing code
- Different business logic would be confusing

## Recommendation

**Create the new model structure** - It's cleaner, more maintainable, and better suited for the e-commerce + AI chat use case.

