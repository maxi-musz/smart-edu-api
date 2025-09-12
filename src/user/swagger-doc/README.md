# User Module Swagger Documentation

This folder contains comprehensive Swagger/OpenAPI documentation for the User module endpoints.

## Files Overview

- `user-profile-endpoint.md` - Detailed documentation for the user profile endpoint
- `response-schemas.md` - Complete response schema definitions
- `request-examples.md` - Example requests and responses
- `error-responses.md` - Error response documentation

## Quick Reference

### User Profile Endpoint
- **GET** `/api/v1/user/profile` - Get comprehensive user profile data
- **Authentication**: JWT Bearer token required
- **Response**: Complete user profile with general info, academic info, settings, and support info

## Usage

These documentation files can be used to:
1. Generate Swagger UI documentation
2. Create API client SDKs
3. Provide reference for frontend developers
4. Document API contracts for testing

## Integration

The documentation is automatically integrated with the main Swagger setup through the controller decorators and can be viewed at `/api/docs` when the application is running.
