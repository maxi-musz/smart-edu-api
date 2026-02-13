import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import * as XLSX from 'xlsx';
import { sendMail } from 'src/common/mailer/send-mail';

interface PasswordUpdateResult {
    sn: number;
    smartEduEmail: string;
    fileNumber: string;
    personalEmail: string;
    password: string;
    status: 'updated' | 'not_found' | 'failed';
    error?: string;
}

@Injectable()
export class TemEndpointService {
    private readonly logger = new Logger(TemEndpointService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Bulk update passwords and generate a summary Excel report.
     *
     * @param mainFileBuffer  - Excel with: file_number, smart_edu_email, password
     * @param personalFileBuffer - Excel with: file_number, personal_email
     *
     * Flow:
     *   1. Parse the personal-email file → build a map: file_number → personal_email
     *   2. Parse the main file → for each row, update the password in the DB
     *   3. Join on file_number to get personal_email
     *   4. Return a new Excel: S/N, Smart Edu Email, File Number, Personal Email, Password
     */
    async bulkUpdatePasswordsAndGenerateReport(
        mainFileBuffer: Buffer,
        personalFileBuffer: Buffer,
    ): Promise<{
        excelBuffer: Buffer;
        summary: {
            total: number;
            updated: number;
            notFound: number;
            failed: number;
        };
    }> {
        // ══════════════════════════════════════════════════════════════
        // Step 1: Parse the personal-email file → file_number → personal_email map
        // ══════════════════════════════════════════════════════════════
        const persWorkbook = XLSX.read(personalFileBuffer, { type: 'buffer' });
        const persSheet = persWorkbook.Sheets[persWorkbook.SheetNames[0]];
        const persRows: Record<string, any>[] = XLSX.utils.sheet_to_json(persSheet, { defval: '' });

        if (!persRows.length) {
            throw new BadRequestException({
                success: false,
                message: 'The personal-email Excel file is empty.',
                statusCode: 400,
            });
        }

        const normalizedPersRows = this.normalizeRows(persRows);
        const persKeys = Object.keys(normalizedPersRows[0]);

        const persFileNumberKey = persKeys.find(k => k.includes('file') && k.includes('number'));
        const persEmailKey = persKeys.find(k => k.includes('email'));

        if (!persFileNumberKey || !persEmailKey) {
            throw new BadRequestException({
                success: false,
                message: `Personal-email Excel: Could not detect required columns. Found: [${persKeys.join(', ')}]. Need "file_number" and "email" columns.`,
                statusCode: 400,
            });
        }

        // Build the map
        const personalEmailMap = new Map<string, string>();
        for (const row of normalizedPersRows) {
            const fileNumber = String(row[persFileNumberKey]).trim();
            const email = String(row[persEmailKey]).trim().toLowerCase();
            if (fileNumber && email) {
                personalEmailMap.set(fileNumber, email);
            }
        }

        this.logger.log(`Personal-email map built with ${personalEmailMap.size} entries`);

        // ══════════════════════════════════════════════════════════════
        // Step 2: Parse the main file (smart_edu_email + password)
        // ══════════════════════════════════════════════════════════════
        const mainWorkbook = XLSX.read(mainFileBuffer, { type: 'buffer' });
        const mainSheet = mainWorkbook.Sheets[mainWorkbook.SheetNames[0]];
        const mainRows: Record<string, any>[] = XLSX.utils.sheet_to_json(mainSheet, { defval: '' });

        if (!mainRows.length) {
            throw new BadRequestException({
                success: false,
                message: 'The main Excel file is empty.',
                statusCode: 400,
            });
        }

        const normalizedMainRows = this.normalizeRows(mainRows);
        const mainKeys = Object.keys(normalizedMainRows[0]);

        const mainFileNumberKey = mainKeys.find(k => k.includes('file') && k.includes('number'));
        const smartEduEmailKey = mainKeys.find(
            k => (k.includes('smart') && k.includes('email')) || k === 'smart_edu_email',
        );
        const passwordKey = mainKeys.find(k => k.includes('password'));

        if (!mainFileNumberKey || !smartEduEmailKey || !passwordKey) {
            throw new BadRequestException({
                success: false,
                message: `Main Excel: Could not detect required columns. Found: [${mainKeys.join(', ')}]. Need "file_number", "smart_edu_email", and "password" columns.`,
                statusCode: 400,
            });
        }

        this.logger.log(
            `Main Excel — file_number: "${mainFileNumberKey}", smart_edu_email: "${smartEduEmailKey}", password: "${passwordKey}"`,
        );
        this.logger.log(`Processing ${normalizedMainRows.length} row(s)...`);

        // ══════════════════════════════════════════════════════════════
        // Step 3: Process each row — update passwords & join personal email
        // ══════════════════════════════════════════════════════════════
        const results: PasswordUpdateResult[] = [];
        let updatedCount = 0;
        let notFoundCount = 0;
        let failedCount = 0;

        for (let i = 0; i < normalizedMainRows.length; i++) {
            const row = normalizedMainRows[i];
            const fileNumber = String(row[mainFileNumberKey]).trim();
            const smartEduEmail = row[smartEduEmailKey]?.toLowerCase();
            // Capitalize the first letter of the password
            const rawPassword = row[passwordKey];
            const password = rawPassword ? rawPassword.charAt(0).toUpperCase() + rawPassword.slice(1) : '';

            // Look up personal email from the second file using file_number
            const personalEmail = personalEmailMap.get(fileNumber) || '';

            if (!smartEduEmail || !password) {
                this.logger.warn(`[SKIP] Row ${i + 1} missing smart_edu_email or password`);
                failedCount++;
                results.push({
                    sn: i + 1,
                    smartEduEmail: smartEduEmail || '',
                    fileNumber,
                    personalEmail,
                    password: password || '',
                    status: 'failed',
                    error: 'Missing smart_edu_email or password',
                });
                continue;
            }

            try {
                const user = await this.prisma.user.findFirst({
                    where: { email: smartEduEmail },
                });

                if (!user) {
                    this.logger.warn(`[NOT FOUND] No user for email: ${smartEduEmail}`);
                    notFoundCount++;
                    results.push({
                        sn: i + 1,
                        smartEduEmail,
                        fileNumber,
                        personalEmail,
                        password,
                        status: 'not_found',
                    });
                    continue;
                }

                // Hash and update password
                const hashedPassword = await argon.hash(password);
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { password: hashedPassword },
                });

                this.logger.log(`[UPDATED] ${smartEduEmail}`);
                updatedCount++;
                results.push({
                    sn: i + 1,
                    smartEduEmail,
                    fileNumber,
                    personalEmail,
                    password,
                    status: 'updated',
                });
            } catch (error) {
                this.logger.error(`[FAILED] ${smartEduEmail} — ${error.message}`);
                failedCount++;
                results.push({
                    sn: i + 1,
                    smartEduEmail,
                    fileNumber,
                    personalEmail,
                    password,
                    status: 'failed',
                    error: error.message,
                });
            }
        }

        // ══════════════════════════════════════════════════════════════
        // Step 4: Log summary
        // ══════════════════════════════════════════════════════════════
        this.logger.log(`========== BULK PASSWORD UPDATE SUMMARY ==========`);
        this.logger.log(`Total:     ${normalizedMainRows.length}`);
        this.logger.log(`Updated:   ${updatedCount}`);
        this.logger.log(`Not found: ${notFoundCount}`);
        this.logger.log(`Failed:    ${failedCount}`);
        this.logger.log(`==================================================`);

        // ══════════════════════════════════════════════════════════════
        // Step 5: Generate the output Excel
        // ══════════════════════════════════════════════════════════════
        const outputData = results
            .filter(r => r.status === 'updated')
            .map((r, idx) => ({
                'S/N': idx + 1,
                'Smart Edu Email': r.smartEduEmail,
                'File Number': r.fileNumber,
                'Personal Email': r.personalEmail,
                'Password': r.password,
            }));

        const outputWorkbook = XLSX.utils.book_new();
        const outputSheet = XLSX.utils.json_to_sheet(outputData);

        outputSheet['!cols'] = [
            { wch: 6 },  // S/N
            { wch: 35 }, // Smart Edu Email
            { wch: 15 }, // File Number
            { wch: 35 }, // Personal Email
            { wch: 25 }, // Password
        ];

        XLSX.utils.book_append_sheet(outputWorkbook, outputSheet, 'Updated Credentials');

        // Add a second sheet for issues if any
        const issueRows = results.filter(r => r.status !== 'updated');
        if (issueRows.length > 0) {
            const issueData = issueRows.map((r, idx) => ({
                'S/N': idx + 1,
                'Smart Edu Email': r.smartEduEmail,
                'File Number': r.fileNumber,
                'Personal Email': r.personalEmail,
                'Password': r.password,
                'Status': r.status,
                'Error': r.error || '',
            }));

            const issueSheet = XLSX.utils.json_to_sheet(issueData);
            issueSheet['!cols'] = [
                { wch: 6 },
                { wch: 35 },
                { wch: 15 },
                { wch: 35 },
                { wch: 25 },
                { wch: 12 },
                { wch: 40 },
            ];
            XLSX.utils.book_append_sheet(outputWorkbook, issueSheet, 'Issues');
        }

        const excelBuffer = XLSX.write(outputWorkbook, { type: 'buffer', bookType: 'xlsx' });

        return {
            excelBuffer,
            summary: {
                total: normalizedMainRows.length,
                updated: updatedCount,
                notFound: notFoundCount,
                failed: failedCount,
            },
        };
    }

    /**
     * Send login credentials to each participant's personal email.
     *
     * Accepts:
     *   - Excel file (the downloaded "updated-credentials.xlsx") with columns:
     *       S/N, Smart Edu Email, File Number, Personal Email, Password
     *   - PDF buffer (the user guide to attach to every email)
     *
     * For each row, sends an email to "Personal Email" with the Smart Edu Email
     * and Password, plus the PDF attached.
     */
    async sendCredentialsEmail(
        excelBuffer: Buffer,
        pdfBuffer: Buffer,
        pdfFilename: string,
    ): Promise<{
        total: number;
        sent: number;
        skipped: number;
        failed: number;
        details: {
            sent: string[];
            skipped: { personalEmail: string; reason: string }[];
            failed: { personalEmail: string; error: string }[];
        };
    }> {
        // ── Parse the Excel file ──
        const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rows.length) {
            throw new BadRequestException({
                success: false,
                message: 'The uploaded Excel file is empty.',
                statusCode: 400,
            });
        }

        const normalizedRows = this.normalizeRows(rows);
        const keys = Object.keys(normalizedRows[0]);

        const smartEduEmailKey = keys.find(
            k => (k.includes('smart') && k.includes('email')) || k === 'smart_edu_email',
        );
        const personalEmailKey = keys.find(k => k.includes('personal') && k.includes('email'));
        const passwordKey = keys.find(k => k.includes('password'));

        if (!smartEduEmailKey || !personalEmailKey || !passwordKey) {
            throw new BadRequestException({
                success: false,
                message: `Could not detect required columns. Found: [${keys.join(', ')}]. Need "smart_edu_email", "personal_email", and "password" columns.`,
                statusCode: 400,
            });
        }

        this.logger.log(`Detected columns — smart_edu_email: "${smartEduEmailKey}", personal_email: "${personalEmailKey}", password: "${passwordKey}"`);
        this.logger.log(`Sending credentials to ${normalizedRows.length} recipient(s)...`);

        const results = {
            sent: [] as string[],
            skipped: [] as { personalEmail: string; reason: string }[],
            failed: [] as { personalEmail: string; error: string }[],
        };

        for (const row of normalizedRows) {
            const smartEduEmail = row[smartEduEmailKey]?.trim();
            const personalEmail = row[personalEmailKey]?.trim().toLowerCase();
            const password = row[passwordKey]?.trim();

            if (!personalEmail || !smartEduEmail || !password) {
                this.logger.warn(`[SKIP] Missing data — personalEmail: "${personalEmail || 'EMPTY'}", smartEduEmail: "${smartEduEmail || 'EMPTY'}"`);
                results.skipped.push({
                    personalEmail: personalEmail || 'EMPTY',
                    reason: 'Missing personal email, smart edu email, or password',
                });
                continue;
            }

            try {
                await sendMail({
                    to: personalEmail,
                    subject: 'SmartEdu Hub – CBT Demo Login Credentials',
                    html: this.buildCredentialsEmailHtml(smartEduEmail, password),
                    attachments: [
                        {
                            filename: pdfFilename,
                            content: pdfBuffer,
                            contentType: 'application/pdf',
                        },
                    ],
                });

                this.logger.log(`[SENT] ${personalEmail}`);
                results.sent.push(personalEmail);
            } catch (error) {
                this.logger.error(`[FAILED] ${personalEmail} — ${error.message}`);
                results.failed.push({
                    personalEmail,
                    error: error.message || 'Unknown error',
                });
            }
        }

        this.logger.log(`========== SEND CREDENTIALS EMAIL SUMMARY ==========`);
        this.logger.log(`Total:   ${normalizedRows.length}`);
        this.logger.log(`Sent:    ${results.sent.length}`);
        this.logger.log(`Skipped: ${results.skipped.length}`);
        this.logger.log(`Failed:  ${results.failed.length}`);
        this.logger.log(`=====================================================`);

        return {
            total: normalizedRows.length,
            sent: results.sent.length,
            skipped: results.skipped.length,
            failed: results.failed.length,
            details: results,
        };
    }

    /**
     * Build the HTML email template for CBT credentials.
     */
    private buildCredentialsEmailHtml(username: string, password: string): string {
        return `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 0;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4F46E5 0%, #3730A3 100%); padding: 28px 32px; border-radius: 10px 10px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">SmartEdu Hub</h1>
                <p style="color: #c7d2fe; margin: 6px 0 0; font-size: 14px;">CBT Demo – Login Credentials</p>
            </div>

            <!-- Body -->
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 10px 10px; background: #ffffff;">
                <p style="font-size: 15px; color: #374151; line-height: 1.6; margin-top: 0;">Dear Participant,</p>

                <p style="font-size: 15px; color: #374151; line-height: 1.6;">
                    We are pleased to confirm that the <strong>CBT Demo</strong> for your staff on <strong>SmartEdu Hub</strong> has been successfully configured and is ready for use.
                </p>

                <p style="font-size: 15px; color: #374151; line-height: 1.6;">Kindly find the login details below:</p>

                <!-- Credentials Card -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px 24px; border-radius: 8px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; width: 110px;">Platform URL</td>
                            <td style="padding: 8px 0; font-size: 14px;"><a href="https://smart-edu-hub.com" style="color: #4F46E5; text-decoration: none; font-weight: 500;">https://smart-edu-hub.com</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Username</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">${username}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Password</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">${password}</td>
                        </tr>
                    </table>
                </div>

                <!-- Important Info -->
                <p style="font-size: 15px; color: #374151; line-height: 1.6; font-weight: 600; margin-bottom: 8px;">Please take note of the following important information:</p>
                <ul style="font-size: 15px; color: #374151; line-height: 1.8; padding-left: 20px; margin-top: 0;">
                    <li>The CBT test will begin at <strong>10:00 AM</strong> and will remain accessible until <strong>12:00 PM</strong>.</li>
                    <li>Each participant will have <strong>1 hour</strong> to complete the examination once the test is started.</li>
                    <li>The CBT test will be available under the <strong>Assessment</strong> menu.</li>
                    <li>Participants are advised to log in a few minutes before the scheduled start time to ensure a smooth process.</li>
                </ul>

                <p style="font-size: 15px; color: #374151; line-height: 1.6;">
                    For ease of use, a detailed <strong>First-Time User Guide</strong> is attached to this email to assist participants with step-by-step instructions on accessing and completing the test.
                </p>

                <p style="font-size: 15px; color: #374151; line-height: 1.6;">
                    Should you require any further clarification or technical support, please do not hesitate to contact us.
                </p>

                <p style="font-size: 15px; color: #374151; line-height: 1.6;">
                    We wish all participants a successful and seamless CBT experience.
                </p>

                <!-- Sign-off -->
                <p style="font-size: 15px; color: #374151; line-height: 1.6; margin-bottom: 0;">
                    Warm regards,<br/>
                    <strong>SmartEdu Hub Team</strong>
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 16px;" />
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">This is an automated message from SmartEdu Hub. Please do not reply to this email.</p>
            </div>
        </div>
        `;
    }

    /**
     * Normalize row keys: trim, lowercase, replace spaces/hyphens with underscores.
     */
    private normalizeRows(rows: Record<string, any>[]): Record<string, string>[] {
        return rows.map(row => {
            const normalized: Record<string, string> = {};
            for (const key of Object.keys(row)) {
                normalized[key.trim().toLowerCase().replace(/[\s-]+/g, '_')] = String(row[key]).trim();
            }
            return normalized;
        });
    }
}
