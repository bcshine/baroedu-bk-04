const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

// 환경 설정 로드
const config = require('./config/env');

// Express 앱 생성
const app = express();

// Supabase 클라이언트 (Service Role - 서버 전용)
const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// 보안 미들웨어
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://code.jquery.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://bjsstktiiniigdnsdwsr.supabase.co"]
        }
    }
}));

// CORS 설정
app.use(cors({
    origin: config.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000, // 15 minutes
    max: config.RATE_LIMIT_MAX, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api', limiter);

// 압축 미들웨어
app.use(compression());

// Body parser 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙 (admin 폴더 내 파일)
app.use(express.static(path.join(__dirname, 'admin')));

// JWT 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// 관리자 권한 확인 미들웨어
const requireAdmin = async (req, res, next) => {
    try {
        const { data: adminUser, error } = await supabaseAdmin
            .from('admin_users')
            .select('role, is_active')
            .eq('user_id', req.user.id)
            .single();

        if (error || !adminUser || !adminUser.is_active) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        if (adminUser.role !== 'admin' && adminUser.role !== 'manager') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        req.adminUser = adminUser;
        next();
    } catch (error) {
        console.error('Admin authorization error:', error);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};

// 입력 검증 미들웨어
const validateInput = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors.array() 
        });
    }
    next();
};

// =================================
// 인증 관련 API 엔드포인트
// =================================

// 관리자 로그인
app.post('/api/admin/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    validateInput
], async (req, res) => {
    try {
        const { email, password } = req.body;

        // 테스트 계정 확인 (임시)
        if (email === 'admin@baroedu.com' && password === 'admin123!@#') {
            // JWT 토큰 생성
            const token = jwt.sign(
                { 
                    id: 'test-admin-001', 
                    email: 'admin@baroedu.com',
                    role: 'admin' 
                },
                config.JWT_SECRET,
                { expiresIn: config.JWT_EXPIRES_IN }
            );

            return res.json({
                success: true,
                token,
                user: {
                    id: 'test-admin-001',
                    email: 'admin@baroedu.com',
                    name: '바로교육 관리자',
                    role: 'admin'
                }
            });
        }

        // Supabase 인증 (실제 계정용)
        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 관리자 권한 확인
        const { data: adminUser, error: adminError } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('user_id', authData.user.id)
            .single();

        if (adminError || !adminUser || !adminUser.is_active) {
            return res.status(403).json({ error: 'Admin access denied' });
        }

        // JWT 토큰 생성
        const token = jwt.sign(
            { 
                id: authData.user.id, 
                email: authData.user.email,
                role: adminUser.role 
            },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            token,
            user: {
                id: authData.user.id,
                email: authData.user.email,
                name: adminUser.name,
                role: adminUser.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// 토큰 검증
app.get('/api/admin/verify', authenticateToken, requireAdmin, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.adminUser.role
        }
    });
});

// =================================
// 대시보드 통계 API
// =================================

// 대시보드 통계 조회
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [
            { count: userCount },
            { count: courseCount },
            { count: enrollmentCount },
            { data: payments }
        ] = await Promise.all([
            supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('enrollments').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('payments').select('amount').eq('payment_status', 'completed')
        ]);

        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

        res.json({
            success: true,
            stats: {
                userCount: userCount || 0,
                courseCount: courseCount || 0,
                enrollmentCount: enrollmentCount || 0,
                totalRevenue: totalRevenue || 0
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// 최근 활동 조회
app.get('/api/admin/recent-activities', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [enrollments, reviews] = await Promise.all([
            supabaseAdmin
                .from('enrollments')
                .select(`
                    *,
                    users(name, email),
                    courses(title, price)
                `)
                .order('created_at', { ascending: false })
                .limit(5),
            supabaseAdmin
                .from('reviews')
                .select(`
                    *,
                    users(name),
                    courses(title)
                `)
                .order('created_at', { ascending: false })
                .limit(5)
        ]);

        res.json({
            success: true,
            data: {
                enrollments: enrollments.data || [],
                reviews: reviews.data || []
            }
        });

    } catch (error) {
        console.error('Recent activities error:', error);
        res.status(500).json({ error: 'Failed to fetch recent activities' });
    }
});

// 월별 통계 조회
app.get('/api/admin/monthly-stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data: enrollments, error } = await supabaseAdmin
            .from('enrollments')
            .select('created_at')
            .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString());

        if (error) {
            throw error;
        }

        // 월별로 그룹화
        const monthlyData = {};
        enrollments.forEach(enrollment => {
            const month = new Date(enrollment.created_at).getMonth() + 1;
            monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        res.json({
            success: true,
            data: monthlyData
        });

    } catch (error) {
        console.error('Monthly stats error:', error);
        res.status(500).json({ error: 'Failed to fetch monthly statistics' });
    }
});

// =================================
// 강좌 관리 API
// =================================

// 강좌 목록 조회
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data: courses, error } = await supabaseAdmin
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: courses
        });

    } catch (error) {
        console.error('Courses fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// 강좌 생성
app.post('/api/admin/courses', [
    authenticateToken,
    requireAdmin,
    body('title').notEmpty().trim(),
    body('instructor_name').notEmpty().trim(),
    body('price').isNumeric().toFloat(),
    validateInput
], async (req, res) => {
    try {
        const courseData = {
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: course, error } = await supabaseAdmin
            .from('courses')
            .insert([courseData])
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: course
        });

    } catch (error) {
        console.error('Course creation error:', error);
        res.status(500).json({ error: 'Failed to create course' });
    }
});

// 강좌 수정
app.put('/api/admin/courses/:id', [
    authenticateToken,
    requireAdmin,
    body('title').notEmpty().trim(),
    body('instructor_name').notEmpty().trim(),
    body('price').isNumeric().toFloat(),
    validateInput
], async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        const { data: course, error } = await supabaseAdmin
            .from('courses')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: course
        });

    } catch (error) {
        console.error('Course update error:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
});

// 강좌 삭제
app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('courses')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });

    } catch (error) {
        console.error('Course deletion error:', error);
        res.status(500).json({ error: 'Failed to delete course' });
    }
});

// =================================
// 에러 핸들링 미들웨어
// =================================

// 404 에러 핸들러
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        ...(config.NODE_ENV === 'development' && { details: err.message })
    });
});

// 서버 시작
const PORT = config.PORT;
app.listen(PORT, () => {
    console.log(`🚀 바로교육 관리자 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📊 환경: ${config.NODE_ENV}`);
    console.log(`🔒 보안: Helmet, CORS, Rate Limiting 활성화`);
    console.log(`📱 클라이언트: http://localhost:${PORT}`);
});

module.exports = app; 