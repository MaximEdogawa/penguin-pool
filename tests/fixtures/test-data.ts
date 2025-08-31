// Basic test data fixtures for component testing

export const mockUsers = {
  regular: {
    id: 'user-1',
    username: 'john_doe',
    email: 'john@example.com',
    isAuthenticated: true,
  },
}













// Mock API responses
export const mockApiResponses = {
  users: {
    list: {
      data: Object.values(mockUsers),
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
      },
    },
    single: {
      data: mockUsers.regular,
    },
  },
  loans: {
    list: {
      data: Object.values(mockLoans),
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
      },
    },
    single: {
      data: mockLoans.active,
    },
  },
  options: {
    list: {
      data: Object.values(mockOptionContracts),
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
      },
    },
    single: {
      data: mockOptionContracts.call,
    },
  },
  offers: {
    list: {
      data: Object.values(mockOffers),
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    },
    single: {
      data: mockOffers.loan,
    },
  },
  piggyBank: {
    list: {
      data: Object.values(mockPiggyBank),
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    },
    single: {
      data: mockPiggyBank.active,
    },
  },
  notifications: {
    list: {
      data: Object.values(mockNotifications),
      pagination: {
        page: 1,
        limit: 10,
        total: 4,
        totalPages: 1,
      },
    },
    single: {
      data: mockNotifications.info,
    },
  },
  themes: {
    list: {
      data: Object.values(mockThemes),
    },
    single: {
      data: mockThemes.dark,
    },
  },
}

// Mock error responses
export const mockApiErrors = {
  notFound: {
    error: 'Not Found',
    message: 'The requested resource was not found',
    statusCode: 404,
  },
  unauthorized: {
    error: 'Unauthorized',
    message: 'Authentication required',
    statusCode: 401,
  },
  forbidden: {
    error: 'Forbidden',
    message: 'Access denied',
    statusCode: 403,
  },
  validation: {
    error: 'Validation Error',
    message: 'Invalid input data',
    statusCode: 400,
    details: [
      {
        field: 'email',
        message: 'Invalid email format',
      },
      {
        field: 'amount',
        message: 'Amount must be greater than 0',
      },
    ],
  },
  serverError: {
    error: 'Internal Server Error',
    message: 'Something went wrong on our end',
    statusCode: 500,
  },
  networkError: {
    error: 'Network Error',
    message: 'Failed to connect to the server',
    statusCode: 0,
  },
}

// Mock form data
export const mockFormData = {
  login: {
    email: 'test@example.com',
    password: 'password123',
    rememberMe: true,
  },
  registration: {
    username: 'newuser',
    email: 'newuser@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    acceptTerms: true,
  },
  loanApplication: {
    amount: 1000,
    currency: 'XCH',
    term: 30,
    purpose: 'Personal expenses',
    collateral: {
      type: 'XCH',
      amount: 2000,
    },
  },
  optionContract: {
    type: 'call',
    strikePrice: 100,
    underlying: 'XCH',
    expiryDate: '2024-12-31',
    premium: 10,
    quantity: 100,
  },
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    bio: 'DeFi enthusiast',
    avatar: null,
  },
}

// Mock search and filter data
export const mockSearchFilters = {
  loans: {
    status: ['active', 'pending', 'completed'],
    currency: ['XCH', 'USD'],
    minAmount: 0,
    maxAmount: 10000,
    minInterestRate: 0,
    maxInterestRate: 20,
    term: [15, 30, 60, 90],
  },
  options: {
    type: ['call', 'put'],
    underlying: ['XCH', 'BTC', 'ETH'],
    minStrikePrice: 0,
    maxStrikePrice: 1000,
    status: ['active', 'expired', 'exercised'],
    expiryDate: {
      from: '2024-01-01',
      to: '2024-12-31',
    },
  },
  offers: {
    type: ['loan', 'option'],
    status: ['open', 'accepted', 'expired'],
    minAmount: 0,
    maxAmount: 10000,
    currency: ['XCH', 'USD'],
  },
}

