import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Handloom Operations Platform API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 with healthy status and metadata', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('healthy');
          expect(res.body.data.services).toBeDefined();
          expect(res.body.data.timestamp).toBeDefined();
        });
    });
  });

  describe('POST /api/v1/auth/register-society validation', () => {
    it('should reject registration with empty body (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register-society')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error).toBeDefined();
        });
    });

    it('should reject registration with invalid email format (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register-society')
        .send({
          societyName: 'Test Society',
          code: 'TST-01',
          societyType: 'PRIMARY_WEAVERS_COOPERATIVE',
          adminEmail: 'invalid-email',
          adminPassword: 'short',
          adminFirstName: 'John',
          adminLastName: 'Doe',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });
  });

  describe('POST /api/v1/auth/login validation', () => {
    it('should reject login request missing credentials (400 Bad Request)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });
  });
});
