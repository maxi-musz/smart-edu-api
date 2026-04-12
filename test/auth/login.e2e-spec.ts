import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import * as argon from 'argon2';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Auth sign-in (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const testEmail = `e2e_login_${suffix}@example.test`;
  const schoolEmail = `e2e_school_${suffix}@example.test`;
  const businessStudentId = `E2E-STU-${suffix}`;

  let schoolId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', ''] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const passwordHash = await argon.hash('password123');

    const school = await prisma.school.create({
      data: {
        school_name: `E2E School ${suffix}`,
        school_email: schoolEmail,
        school_phone: '+10000000000',
        school_address: 'E2E test address',
        school_type: 'secondary',
        school_ownership: 'private',
        status: 'approved',
      },
    });
    schoolId = school.id;

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: passwordHash,
        first_name: 'E2E',
        last_name: 'Student',
        phone_number: '+10000000001',
        school_id: school.id,
        role: 'student',
        student_id: businessStudentId,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    try {
      if (prisma && userId) {
        await prisma.user.delete({ where: { id: userId } });
      }
      if (prisma && schoolId) {
        await prisma.school.delete({ where: { id: schoolId } });
      }
    } catch {
      // best-effort cleanup
    }
    await app?.close();
  });

  it('returns 400-style payload when logging in with business ID without school_id', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/sign-in')
      .send({
        email: 'EXAM-2024-001',
        password: 'password123',
      })
      .expect(200);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/school_id/i);
  });

  it('signs in with email + password and returns tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/sign-in')
      .send({
        email: testEmail,
        password: 'password123',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data?.access_token).toBeTruthy();
    expect(res.body.data?.refresh_token).toBeTruthy();
    expect(res.body.data?.user?.email).toBe(testEmail);
  });

  it('signs in with student business ID + school_id + password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/sign-in')
      .send({
        email: businessStudentId,
        password: 'password123',
        school_id: schoolId,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data?.access_token).toBeTruthy();
    expect(res.body.data?.user?.id).toBe(userId);
  });
});
