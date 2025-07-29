import { ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

export const GetFinanceDashboardDocs = {
  operation: ApiOperation({
    summary: 'Get finance dashboard',
    description: 'Fetch finance dashboard data including revenue, expenses, and financial statistics for the authenticated director'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  query1: ApiQuery({
    name: 'start_date',
    description: 'Start date for financial data (YYYY-MM-DD)',
    example: '2024-01-01',
    required: false
  }),
  query2: ApiQuery({
    name: 'end_date',
    description: 'End date for financial data (YYYY-MM-DD)',
    example: '2024-12-31',
    required: false
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Finance dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Finance dashboard data fetched successfully' },
        data: {
          type: 'object',
          properties: {
            total_revenue: { type: 'number', example: 500000 },
            total_expenses: { type: 'number', example: 300000 },
            net_profit: { type: 'number', example: 200000 },
            monthly_revenue: { type: 'array' },
            expense_breakdown: { type: 'object' },
            payment_statistics: { type: 'object' }
          }
        },
        statusCode: { type: 'number', example: 200 }
      }
    }
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
}; 