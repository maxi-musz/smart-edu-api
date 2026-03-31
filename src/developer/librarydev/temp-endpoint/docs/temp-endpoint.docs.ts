import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const DeleteAllLibraryAiBooksDocs = {
  operation: ApiOperation({
    summary: 'DELETE ALL library AI books (dangerous, temporary)',
    description:
      'Permanently deletes every LibraryGeneralMaterial row, chapters, chapter files, library chat/purchase rows, ' +
      'linked PDFMaterial + DocumentChunk + MaterialProcessing + school Chat* rows, Pinecone vectors (by PDFMaterial id), ' +
      'and attempts S3 deletes for known keys. Requires body.confirm exactly DELETE_ALL_LIBRARY_AI_BOOKS. Remove this route after use.',
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Deletion finished (see data for counts and any Pinecone/S3 errors)',
  }),
};

export const TempEndpointPingDocs = {
  operation: ApiOperation({
    summary: 'Temp module ping',
    description:
      'Sanity check for the temp-endpoint module. Use this area for short-lived or one-off developer actions; remove routes after use.',
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Module is mounted',
  }),
};
