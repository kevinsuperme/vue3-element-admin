import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/vue3-admin-test';

// Mock uuid module to avoid ES module issues
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-12345')
}));

// Mock bcrypt for password hashing and comparison
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  hashSync: jest.fn().mockReturnValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock jsonwebtoken for JWT token generation and verification
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockImplementation((payload, _secret, _options) => {
    // Return different tokens for different users
    if (payload.roles && payload.roles.includes('admin')) {
      return 'mock-admin-jwt-token';
    }
    return 'mock-user-jwt-token';
  }),
  verify: jest.fn().mockImplementation((token) => {
    // Return different payloads for different tokens
    if (token === 'mock-admin-jwt-token') {
      return {
        userId: '507f1f77bcf86cd799439012',
        username: 'admin',
        role: 'admin',
        roles: ['admin']
      };
    }
    return {
      userId: '507f1f77bcf86cd799439011',
      username: 'testuser',
      role: 'user',
      roles: ['user']
    };
  }),
  decode: jest.fn().mockImplementation((token) => {
    // Return different payloads for different tokens
    if (token === 'mock-admin-jwt-token') {
      return {
        userId: '507f1f77bcf86cd799439012',
        username: 'admin',
        role: 'admin',
        roles: ['admin']
      };
    }
    return {
      userId: '507f1f77bcf86cd799439011',
      username: 'testuser',
      role: 'user',
      roles: ['user']
    };
  })
}));

// Mock mongoose connection to avoid database dependency during tests
jest.mock('mongoose', () => {
  const mockSchema = jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    methods: {},
    statics: {},
    index: jest.fn(),
    indexes: jest.fn()
  })) as any;

  mockSchema.Types = {
    ObjectId: jest.fn()
  };

  // Create a mock model with all necessary methods
  const mockModel = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'user',
    save: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue([]),
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue([])
      }),
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue([])
      }),
      skip: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue([])
      })
    }),
    findOne: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    findByIdAndUpdate: jest.fn().mockResolvedValue(null),
    findByIdAndDelete: jest.fn().mockResolvedValue(null),
    countDocuments: jest.fn().mockResolvedValue(0),
    createIndexes: jest.fn().mockResolvedValue(undefined),
    comparePassword: jest.fn().mockImplementation((password) => {
      return Promise.resolve(password === 'password123');
    })
  } as any;

  // Create a constructor function that returns the mock model
  const ModelConstructor = jest.fn(() => mockModel) as any;

  // Add static methods to the constructor
  ModelConstructor.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
  ModelConstructor.find = jest.fn().mockImplementation((_query) => {
    // Return a mock query object with pagination methods
    return {
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        { _id: '507f1f77bcf86cd799439011', username: 'testuser', email: 'test@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439012', username: 'testuser1', email: 'test1@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439013', username: 'testuser2', email: 'test2@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439014', username: 'testuser3', email: 'test3@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439015', username: 'testuser4', email: 'test4@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439016', username: 'testuser5', email: 'test5@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439017', username: 'testuser6', email: 'test6@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439018', username: 'testuser7', email: 'test7@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439019', username: 'testuser8', email: 'test8@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439020', username: 'testuser9', email: 'test9@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439021', username: 'testuser10', email: 'test10@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439022', username: 'testuser11', email: 'test11@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439023', username: 'testuser12', email: 'test12@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439024', username: 'testuser13', email: 'test13@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439025', username: 'testuser14', email: 'test14@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439026', username: 'testuser15', email: 'test15@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439027', username: 'testuser16', email: 'test16@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439028', username: 'testuser17', email: 'test17@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439029', username: 'testuser18', email: 'test18@example.com', roles: ['user'] },
        { _id: '507f1f77bcf86cd799439030', username: 'testuser19', email: 'test19@example.com', roles: ['user'] }
      ])
    };
  });
  ModelConstructor.countDocuments = jest.fn().mockResolvedValue(50); // Total count for pagination testing
  ModelConstructor.findOne = jest.fn().mockImplementation((query) => {
    // Return a mock query object with select method
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null)
    };

    // If looking for test@example.com, return a mock user
    if (query && query.email === 'test@example.com') {
      mockQuery.exec.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        lastLogin: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439011',
          id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user'],
          isActive: true
        })
      });
    }
    // If looking for admin@example.com, return a mock admin user
    else if (query && query.email === 'admin@example.com') {
      mockQuery.exec.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012',
        id: '507f1f77bcf86cd799439012',
        username: 'admin',
        email: 'admin@example.com',
        password: 'hashedpassword',
        roles: ['admin'],
        isActive: true,
        lastLogin: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439012',
          id: '507f1f77bcf86cd799439012',
          username: 'admin',
          email: 'admin@example.com',
          roles: ['admin'],
          isActive: true
        })
      });
    }
    // If looking for testuser, return a mock user
    else if (query && (query.username === 'testuser' || (query.$or && query.$or.some((or: any) => or.username === 'testuser')))) {
      mockQuery.exec.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        lastLogin: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439011',
          id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user'],
          isActive: true
        })
      });
    }
    // Handle username queries for testuser1, testuser2, etc.
    else if (query && query.username && query.username.startsWith('testuser') && query.username !== 'testuser') {
      const userNum = query.username.replace('testuser', '');
      const userId = `507f1f77bcf86cd799439${(11 + parseInt(userNum)).toString().padStart(2, '0')}`;

      mockQuery.exec.mockResolvedValue({
        _id: userId,
        id: userId,
        username: query.username,
        email: `${query.username}@example.com`,
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        lastLogin: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: userId,
          id: userId,
          username: query.username,
          email: `${query.username}@example.com`,
          roles: ['user'],
          isActive: true
        })
      });
    }

    return mockQuery;
  });
  ModelConstructor.findById = jest.fn().mockImplementation((id) => {
    // Return a mock query object with select method
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null)
    };

    // If looking for test user ID, return a mock user
    if (id === '507f1f77bcf86cd799439011') {
      mockQuery.exec.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        lastLogin: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439011',
          id: '507f1f77bcf86cd799439011',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user'],
          isActive: true
        })
      });
    }
    // If looking for admin user ID, return a mock admin user
    else if (id === '507f1f77bcf86cd799439012') {
      mockQuery.exec.mockResolvedValue({
        _id: '507f1f77bcf86cd799439012',
        id: '507f1f77bcf86cd799439012',
        username: 'admin',
        email: 'admin@example.com',
        password: 'hashedpassword',
        roles: ['admin'],
        isActive: true,
        lastLogin: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439012',
          id: '507f1f77bcf86cd799439012',
          username: 'admin',
          email: 'admin@example.com',
          roles: ['admin'],
          isActive: true
        })
      });
    }

    return mockQuery;
  });
  ModelConstructor.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
  ModelConstructor.findByIdAndDelete = jest.fn().mockResolvedValue(null);
  ModelConstructor.countDocuments = jest.fn().mockResolvedValue(0);
  ModelConstructor.createIndexes = jest.fn().mockResolvedValue(undefined);
  ModelConstructor.create = jest.fn().mockImplementation((userData) => {
    // Handle array of users
    if (Array.isArray(userData)) {
      return Promise.resolve(userData.map((user, index) => ({
        _id: `507f1f77bcf86cd7994390${index.toString().padStart(3, '0')}`,
        id: `507f1f77bcf86cd7994390${index.toString().padStart(3, '0')}`,
        username: user.username,
        email: user.email,
        password: user.password,
        roles: user.roles || ['user'],
        isActive: user.isActive !== undefined ? user.isActive : true,
        lastLogin: user.lastLogin || new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: `507f1f77bcf86cd7994390${index.toString().padStart(3, '0')}`,
          id: `507f1f77bcf86cd7994390${index.toString().padStart(3, '0')}`,
          username: user.username,
          email: user.email,
          roles: user.roles || ['user'],
          isActive: user.isActive !== undefined ? user.isActive : true
        })
      })));
    }

    // Handle single user
    const userId = userData.email === 'admin@example.com' ? '507f1f77bcf86cd799439012' : '507f1f77bcf86cd799439011';
    return Promise.resolve({
      _id: userId,
      id: userId,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      roles: userData.roles || (userData.email === 'admin@example.com' ? ['admin'] : ['user']),
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      lastLogin: userData.lastLogin || new Date(),
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue({
        _id: userId,
        id: userId,
        username: userData.username,
        email: userData.email,
        roles: userData.roles || (userData.email === 'admin@example.com' ? ['admin'] : ['user']),
        isActive: userData.isActive !== undefined ? userData.isActive : true
      })
    });
  });

  return {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    connection: {
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined)
    },
    Schema: mockSchema,
    model: jest.fn(() => ModelConstructor),
    Types: {
      ObjectId: jest.fn()
    }
  };
});

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
