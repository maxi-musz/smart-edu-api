import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { BulkOnboardRowDto } from '../dto/bulk-onboard.dto';

@Injectable()
export class ExcelProcessorService {
  /**
   * Process Excel file and extract user data
   * @param file - The uploaded Excel file
   * @returns Array of user data objects
   */
  async processExcelFile(file: Express.Multer.File): Promise<BulkOnboardRowDto[]> {
    try {
      // Read the Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new BadRequestException('Excel file must have at least a header row and one data row');
      }
      
      // Extract headers (first row)
      const headers = jsonData[0] as string[];
      
      // Validate required headers
      const requiredHeaders = ['First Name', 'Last Name', 'Email', 'Phone', 'Class', 'Role'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      
      if (missingHeaders.length > 0) {
        throw new BadRequestException(`Missing required headers: ${missingHeaders.join(', ')}`);
      }
      
      // Process data rows (skip header row)
      const dataRows = jsonData.slice(1);
      const processedData: BulkOnboardRowDto[] = [];
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[];
        const rowData: any = {};
        
        // Map row data to headers
        headers.forEach((header, index) => {
          rowData[header] = row[index] || '';
        });
        
        // Validate and clean the data
        const validatedRow = this.validateRowData(rowData, i + 2); // +2 because we start from row 2 (after header)
        
        if (validatedRow) {
          processedData.push(validatedRow);
        }
      }
      
      if (processedData.length === 0) {
        throw new BadRequestException('No valid data found in Excel file');
      }
      
      return processedData;
      
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error processing Excel file: ${error.message}`);
    }
  }
  
  /**
   * Validate and clean row data
   * @param rowData - Raw row data from Excel
   * @param rowNumber - Row number for error reporting
   * @returns Validated row data or null if invalid
   */
  private validateRowData(rowData: any, rowNumber: number): BulkOnboardRowDto | null {
    try {
      // Check if row is empty
      if (!rowData['First Name'] && !rowData['Last Name'] && !rowData['Email']) {
        return null; // Skip empty rows
      }
      
      // Validate required fields
      const requiredFields = ['First Name', 'Last Name', 'Email', 'Phone', 'Class', 'Role'];
      for (const field of requiredFields) {
        if (!rowData[field] || typeof rowData[field] !== 'string' || rowData[field].trim() === '') {
          throw new Error(`Row ${rowNumber}: Missing or empty ${field}`);
        }
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rowData['Email'].trim())) {
        throw new Error(`Row ${rowNumber}: Invalid email format`);
      }
      
      // Validate phone number (basic validation)
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(rowData['Phone'].trim())) {
        throw new Error(`Row ${rowNumber}: Invalid phone number format`);
      }
      
      // Validate class (only for students)
      const validClasses = [
        'pry-1', 'pry-2', 'pry-3', 'pry-4', 'pry-5', 'pry-6',
        'kg-1', 'kg-2', 'nur-1', 'nur-2',
        'jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3'
      ];
      
      if (!validClasses.includes(rowData['Class'].toLowerCase().trim())) {
        throw new Error(`Row ${rowNumber}: Invalid class. Must be one of: ${validClasses.join(', ')}`);
      }
      
      // Validate role
      const validRoles = ['student', 'teacher', 'school_director'];
      if (!validRoles.includes(rowData['Role'].toLowerCase().trim())) {
        throw new Error(`Row ${rowNumber}: Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }
      
      // Return cleaned and validated data
      return {
        'First Name': rowData['First Name'].trim(),
        'Last Name': rowData['Last Name'].trim(),
        'Email': rowData['Email'].toLowerCase().trim(),
        'Phone': rowData['Phone'].trim(),
        'Class': rowData['Class'].toLowerCase().trim(),
        'Role': rowData['Role'].toLowerCase().trim()
      };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  /**
   * Generate Excel template for bulk onboarding
   * @returns Buffer containing the Excel template
   */
  generateExcelTemplate(): Buffer {
    const templateData = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Class', 'Role'],
      ['John', 'Doe', 'john.doe@school.com', '08012345678', 'pry-1', 'student'],
      ['Jane', 'Smith', 'jane.smith@school.com', '08087654321', 'pry-2', 'teacher'],
      ['Mike', 'Johnson', 'mike.johnson@school.com', '08011223344', 'jss1', 'school_director']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bulk Onboard Template');
    
    // Add data validation and formatting
    const range = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;
    
    // Add dropdown for Class column
    const classOptions = ['pry-1', 'pry-2', 'pry-3', 'pry-4', 'pry-5', 'pry-6', 'kg-1', 'kg-2', 'nur-1', 'nur-2', 'jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3'];
    worksheet['!dataValidation'] = {
      E2: { // Class column
        type: 'list',
        formula1: `"${classOptions.join(',')}"`,
        allowBlank: false
      }
    };
    
    // Add dropdown for Role column
    const roleOptions = ['student', 'teacher', 'school_director'];
    worksheet['!dataValidation'] = {
      F2: { // Role column
        type: 'list',
        formula1: `"${roleOptions.join(',')}"`,
        allowBlank: false
      }
    };
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
} 